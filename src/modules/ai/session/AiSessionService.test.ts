/**
 * AiSessionService Testleri
 * ============================
 * bkz. ADR 0024 Karar 3. Gerçek repository'ler (test executor) + SAHTE
 * bir provider (Gemini mock'lanmıyor — provider'ın KENDİSİ test
 * edildi, burada `AiSessionService`'in ORKESTRASYON mantığı test
 * ediliyor).
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { aiConversationRepository } from "../data/aiConversation.repository";
import { aiSettingsRepository } from "../data/aiSettings.repository";
import { providerRegistry } from "../providers/ProviderRegistry";
import { toolRegistry } from "../tools/ToolRegistry";
import type { AIProvider, AIProviderResponse } from "../providers/AIProvider.interface";
import type { AiTool } from "../tools/ToolDefinition.interface";
import { aiSessionService } from "./AiSessionService";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

function fakeProvider(sendMessageImpl: (...args: unknown[]) => Promise<AIProviderResponse>): AIProvider {
  return {
    providerName: "gemini",
    sendMessage: sendMessageImpl as AIProvider["sendMessage"],
    analyzeImage: vi.fn().mockResolvedValue("test analiz sonucu"),
  };
}

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function enableAiWithInternet() {
  await aiSettingsRepository.getOrCreate();
  await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
}

describe("AiSessionService — İzin Kapıları (Bölüm 15, güvenli varsayılanlar)", () => {
  it("isEnabled=false iken AI_NOT_ENABLED hatası fırlatır, HİÇBİR provider çağrısı yapmaz", async () => {
    const sendMessage = vi.fn();
    providerRegistry.register(fakeProvider(sendMessage));
    const conversation = await aiConversationRepository.createConversation();

    await expect(
      aiSessionService.sendUserMessage({ conversationId: conversation.id, userQuery: "test" })
    ).rejects.toThrow("AI_NOT_ENABLED");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("isEnabled=true AMA internetPermission=false iken AI_INTERNET_PERMISSION_DENIED hatası fırlatır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: false });
    const sendMessage = vi.fn();
    providerRegistry.register(fakeProvider(sendMessage));
    const conversation = await aiConversationRepository.createConversation();

    await expect(
      aiSessionService.sendUserMessage({ conversationId: conversation.id, userQuery: "test" })
    ).rejects.toThrow("AI_INTERNET_PERMISSION_DENIED");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe("AiSessionService — Basit Akış (Araç Çağrısı Yok)", () => {
  it("kullanıcı mesajı + model cevabı GERÇEKTEN DB'ye kaydedilir", async () => {
    await enableAiWithInternet();
    providerRegistry.register(
      fakeProvider(async () => ({ text: "Bu ay 3 sulama yaptınız.", toolCalls: [] }))
    );
    const conversation = await aiConversationRepository.createConversation();

    const result = await aiSessionService.sendUserMessage({
      conversationId: conversation.id,
      userQuery: "Kaç sulama yaptım?",
    });

    expect(result.assistantMessage.content).toBe("Bu ay 3 sulama yaptınız.");
    expect(result.assistantMessage.role).toBe("model");

    const messages = await aiConversationRepository.listMessages(conversation.id);
    expect(messages).toHaveLength(2); // user + model
    expect(messages[0]).toMatchObject({ role: "user", content: "Kaç sulama yaptım?" });
    expect(messages[1]).toMatchObject({ role: "model", content: "Bu ay 3 sulama yaptınız." });
  });

  it("kayıtlı olmayan bir provider için AI_PROVIDER_NOT_REGISTERED hatası fırlatır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({
      isEnabled: true,
      internetPermission: true,
      providerName: "hic-kayitli-olmayan-saglayici",
    });
    const conversation = await aiConversationRepository.createConversation();

    await expect(
      aiSessionService.sendUserMessage({ conversationId: conversation.id, userQuery: "test" })
    ).rejects.toThrow("AI_PROVIDER_NOT_REGISTERED");
  });
});

describe("AiSessionService — Tool-Calling Round-Trip (GERÇEK 2 Aşamalı Akış)", () => {
  it("model bir araç çağırmayı talep ederse, GERÇEKTEN çalıştırılır ve sonuç 2. round-trip ile geri gönderilir", async () => {
    await enableAiWithInternet();
    const testTool: AiTool = {
      definition: { name: "testQueryTool", description: "test", parametersJsonSchema: { type: "object" } },
      execute: vi.fn().mockResolvedValue({ count: 7 }),
    };
    toolRegistry.register(testTool);

    let callCount = 0;
    const sendMessage = vi.fn(async (_messages: unknown, _options: unknown) => {
      callCount++;
      if (callCount === 1) {
        // İlk çağrı: model bir araç istiyor.
        return { text: null, toolCalls: [{ toolName: "testQueryTool", arguments: {} }] };
      }
      // İkinci çağrı (tool sonucu geri gönderildikten SONRA): nihai cevap.
      return { text: "7 kayıt bulundu.", toolCalls: [] };
    });
    providerRegistry.register(fakeProvider(sendMessage));

    const conversation = await aiConversationRepository.createConversation();
    const result = await aiSessionService.sendUserMessage({
      conversationId: conversation.id,
      userQuery: "test sorusu",
    });

    expect(testTool.execute).toHaveBeenCalledTimes(1); // araç GERÇEKTEN çalıştırıldı
    expect(sendMessage).toHaveBeenCalledTimes(2); // 2 round-trip
    expect(result.assistantMessage.content).toBe("7 kayıt bulundu.");

    // 2. çağrının pendingToolResults'ı DOĞRU sonucu taşıyor mu?
    const secondCallOptions = sendMessage.mock.calls[1][1] as { pendingToolResults?: unknown };
    expect(secondCallOptions.pendingToolResults).toEqual([{ toolName: "testQueryTool", result: { count: 7 } }]);

    // 🔴 GERÇEK BUG DÜZELTMESİNİN testi (AI X-Ray denetiminde bulundu,
    // Gemini'nin resmi sözleşmesiyle kanıtlandı — bkz. AIMessage.toolCalls
    // belgesi): 2. çağrıya giden `messages` dizisinin SON elemanı,
    // MODELİN kendi function-call talebini (role: "model",
    // toolCalls dolu) İÇERMELİ — ÖNCEDEN bu mesaj HİÇ gönderilmiyordu.
    const secondCallMessages = sendMessage.mock.calls[1][0] as Array<{
      role: string;
      content: string;
      toolCalls?: unknown;
    }>;
    const lastMessage = secondCallMessages[secondCallMessages.length - 1];
    expect(lastMessage.role).toBe("model");
    expect(lastMessage.toolCalls).toEqual([{ toolName: "testQueryTool", arguments: {} }]);
  });

  it("🔴 Sprint 10.16, GERÇEK KÖK NEDEN DÜZELTMESİ: model 2. round-trip'te DE bir tool çağırırsa (ör. filtresiz denemeden sonra filtreli tekrar deneme), bu ARTIK GERÇEKTEN işlenir — ÖNCEDEN bu durumda response.text boş kalırdı, hiçbir hata da oluşmazdı", async () => {
    await enableAiWithInternet();
    const testTool: AiTool = {
      definition: { name: "multiRoundTool", description: "test", parametersJsonSchema: { type: "object" } },
      execute: vi.fn().mockResolvedValue({ found: true }),
    };
    toolRegistry.register(testTool);

    let callCount = 0;
    const sendMessage = vi.fn(async (_messages: unknown, _options: unknown) => {
      callCount++;
      if (callCount === 1) {
        // 1. round: model filtresiz çağırıyor.
        return { text: null, toolCalls: [{ toolName: "multiRoundTool", arguments: {} }] };
      }
      if (callCount === 2) {
        // 2. round: sonuç yetersiz, model FARKLI parametrelerle TEKRAR çağırıyor
        // — bu, kullanıcının gerçek cihazda gözlemlediği "thought_signature VAR
        // ama response boş" belirtisinin TAM olarak temsil ettiği senaryo.
        return { text: null, toolCalls: [{ toolName: "multiRoundTool", arguments: { filtered: true } }] };
      }
      // 3. round: nihayet nihai metin cevabı.
      return { text: "Bulundu: filtreli sonuç.", toolCalls: [] };
    });
    providerRegistry.register(fakeProvider(sendMessage));

    const conversation = await aiConversationRepository.createConversation();
    const result = await aiSessionService.sendUserMessage({
      conversationId: conversation.id,
      userQuery: "test sorusu",
    });

    // ÖNCEDEN: sendMessage 2 kez çağrılırdı, testTool.execute 1 kez
    // çalışırdı, result.content BOŞ ("") olurdu (2. round'un toolCalls'ı
    // hiç işlenmezdi). ŞİMDİ: GERÇEKTEN 3 round tamamlanıyor.
    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(testTool.execute).toHaveBeenCalledTimes(2);
    expect(result.assistantMessage.content).toBe("Bulundu: filtreli sonuç.");
  });

  it("🔴 Sprint 10.16: model MAX_TOOL_ROUNDS'u AŞACAK kadar ısrarla tool çağırırsa, SONSUZ döngüye GİRMEZ — üst sınırda durur", async () => {
    await enableAiWithInternet();
    const testTool: AiTool = {
      definition: { name: "infiniteTool", description: "test", parametersJsonSchema: { type: "object" } },
      execute: vi.fn().mockResolvedValue({ tryAgain: true }),
    };
    toolRegistry.register(testTool);

    // Model HER ZAMAN bir tool çağırmaya devam ediyor (asla metin üretmiyor) — gerçek bir "kaçak model" senaryosu.
    const sendMessage = vi.fn(async () => ({
      text: null,
      toolCalls: [{ toolName: "infiniteTool", arguments: {} }],
    }));
    providerRegistry.register(fakeProvider(sendMessage));

    const conversation = await aiConversationRepository.createConversation();
    const result = await aiSessionService.sendUserMessage({
      conversationId: conversation.id,
      userQuery: "test sorusu",
    });

    // KESİN kanıt: üst sınır (MAX_TOOL_ROUNDS=3) sayesinde, sendMessage
    // sınırsız değil, TAM OLARAK 4 kez çağrılıyor (1 ilk + 3 tool round'u)
    // — sonsuz döngü GERÇEKTEN engellendi.
    expect(sendMessage).toHaveBeenCalledTimes(4);
    expect(testTool.execute).toHaveBeenCalledTimes(3);
    // Üst sınıra ulaşıldığında, modelin SON ürettiği (yine boş) metin kaydedilir — çökme YOK.
    expect(result.assistantMessage.content).toBe("");
  });

  it("debugMode=true iken tool sonuçları 'tool' rolüyle DB'ye de kaydedilir", async () => {
    await enableAiWithInternet();
    await aiSettingsRepository.update({ debugMode: true });
    const testTool: AiTool = {
      definition: { name: "debugTestTool", description: "test", parametersJsonSchema: { type: "object" } },
      execute: vi.fn().mockResolvedValue({ ok: true }),
    };
    toolRegistry.register(testTool);

    let callCount = 0;
    providerRegistry.register(
      fakeProvider(async () => {
        callCount++;
        if (callCount === 1) return { text: null, toolCalls: [{ toolName: "debugTestTool", arguments: {} }] };
        return { text: "cevap", toolCalls: [] };
      })
    );

    const conversation = await aiConversationRepository.createConversation();
    await aiSessionService.sendUserMessage({ conversationId: conversation.id, userQuery: "test" });

    const messages = await aiConversationRepository.listMessages(conversation.id);
    const toolMessage = messages.find((m) => m.role === "tool");
    expect(toolMessage).toBeDefined();
    expect(toolMessage!.content).toContain("debugTestTool");
  });

  it("debugMode=false (varsayılan) iken tool sonuçları DB'ye AYRI bir mesaj olarak KAYDEDİLMEZ", async () => {
    await enableAiWithInternet(); // debugMode varsayılan false
    const testTool: AiTool = {
      definition: { name: "noDebugTool", description: "test", parametersJsonSchema: { type: "object" } },
      execute: vi.fn().mockResolvedValue({ ok: true }),
    };
    toolRegistry.register(testTool);

    let callCount = 0;
    providerRegistry.register(
      fakeProvider(async () => {
        callCount++;
        if (callCount === 1) return { text: null, toolCalls: [{ toolName: "noDebugTool", arguments: {} }] };
        return { text: "cevap", toolCalls: [] };
      })
    );

    const conversation = await aiConversationRepository.createConversation();
    await aiSessionService.sendUserMessage({ conversationId: conversation.id, userQuery: "test" });

    const messages = await aiConversationRepository.listMessages(conversation.id);
    const toolMessage = messages.find((m) => m.role === "tool");
    expect(toolMessage).toBeUndefined();
  });
});

describe("AiSessionService — Geçmiş Sınırlama (maxMessages)", () => {
  it("geçmiş mesaj sayısı maxMessages'ı AŞARSA, sadece SON N-1 mesaj provider'a gönderilir", async () => {
    await enableAiWithInternet();
    await aiSettingsRepository.update({ maxMessages: 3 });
    const sendMessage = vi.fn(async (..._args: unknown[]) => ({
      text: "cevap",
      toolCalls: [],
    }));
    providerRegistry.register(fakeProvider(sendMessage));

    const conversation = await aiConversationRepository.createConversation();
    // 5 önceki tur (10 mesaj) oluştur.
    for (let i = 0; i < 5; i++) {
      await aiSessionService.sendUserMessage({ conversationId: conversation.id, userQuery: `soru ${i}` });
    }

    const lastCallMessages = sendMessage.mock.calls[sendMessage.mock.calls.length - 1][0] as unknown[];

    // maxMessages=3 → en fazla 2 önceki tur + 1 şimdiki tur = 3 mesaj.
    expect(lastCallMessages.length).toBeLessThanOrEqual(3);
  });
});
