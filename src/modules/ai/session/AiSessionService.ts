/**
 * AiSessionService
 * ===================
 * bkz. ADR 0024 Karar 3 (kullanıcı revizyonu — "AiSessionService
 * yalnızca Conversation yönetmesin, merkezi AI oturum katmanı olarak
 * tasarlansın"). Bugün gerçekten uygulanan: Conversation + Context +
 * Screen Context + Usage (mesaj sayısı sınırı üzerinden dolaylı) +
 * History. Memory (uzun-süreli özet/`ai_facts`) ARAYÜZDE YER AYRILMIŞ
 * ama bugün YAZILMAMIŞ (YAGNI — Sprint 6.1+ konusu).
 *
 * TAM AKIŞ (tool-calling round-trip):
 *   1. Kullanıcı mesajı DB'ye kaydedilir.
 *   2. Context Engine (sıfır AI çağrısı) ekran bağlamı + önerilen
 *      araçları belirler (bugün sadece debug/log amaçlı — TÜM
 *      registry zaten gönderiliyor, YAGNI: filtreleme eklemek bugün
 *      gerekmiyor, 5 araç zaten az).
 *   3. Prompt oluşturulur (systemInstruction AYRI, user turn mesajı
 *      context+tool+safe-user bölümlerinden).
 *   4. Provider'a gönderilir. Araç çağrısı TALEP EDİLİRSE:
 *      a. Her araç GERÇEKTEN çalıştırılır (`toolRegistry.invoke`).
 *      b. Sonuçlar provider'a GERİ gönderilir (2. round-trip).
 *   5. Modelin NİHAİ metin cevabı DB'ye kaydedilir ve döndürülür.
 */

import { aiConversationRepository } from "../data/aiConversation.repository";
import type { AiMessage } from "../domain/ai.types";
import type { AIMessage, AIToolResult } from "../providers/AIProvider.interface";
import { toolRegistry } from "../tools/ToolRegistry";
import { keywordContextEngine } from "../context/KeywordContextEngine";
import type { ScreenContext } from "../context/IContextEngine.interface";
import { buildSystemPrompt, buildUserTurnMessage } from "../prompt/promptBuilder";
import { getActiveAiProvider } from "./getActiveAiProvider";
import { aiDiagnostics } from "../diagnostics/aiDiagnostics";

export interface SendUserMessageInput {
  conversationId: string;
  userQuery: string;
  screenContext?: ScreenContext;
}

export interface SendUserMessageResult {
  assistantMessage: AiMessage;
}

class AiSessionService {
  async sendUserMessage(input: SendUserMessageInput): Promise<SendUserMessageResult> {
    // bkz. Sprint 9.2 — izin kontrolü + provider alma mantığı
    // `getActiveAiProvider()`'a ÇIKARILDI (Fotoğraf Analizi de AYNI
    // mantığa ihtiyaç duyuyor, Kural: "kod tekrarından kaçın").
    // Davranış BİREBİR AYNI (aynı hata kodları, aynı sıra).
    const { provider, settings } = await getActiveAiProvider();

    // 1. Kullanıcı mesajını kaydet.
    await aiConversationRepository.addMessage({
      conversationId: input.conversationId,
      role: "user",
      content: input.userQuery,
    });

    // 2. Context Engine — sıfır AI çağrısı.
    const contextResult = await keywordContextEngine.buildContext(input.userQuery, input.screenContext ?? {});

    // 3. Geçmiş — YENİ eklenen ham kullanıcı mesajı HARİÇ (yerine
    // zenginleştirilmiş `userTurnMessage` konacak), `maxMessages - 1`
    // ile sınırlı (Bölüm 15 — Maksimum Mesaj ayarı, bugün gerçekten
    // kullanılan tek "Usage" kontrolü).
    const fullHistory = await aiConversationRepository.listMessages(input.conversationId);
    const priorTurns = fullHistory.slice(0, -1);
    const limitedPriorTurns = priorTurns.slice(-Math.max(settings.maxMessages - 1, 0));

    const toolDefinitions = toolRegistry.list();
    const systemInstruction = buildSystemPrompt(settings.responseLanguage);
    const userTurnMessage = buildUserTurnMessage({
      rawUserQuery: input.userQuery,
      contextText: contextResult.contextText,
      hasTools: toolDefinitions.length > 0,
    });

    const providerMessages: AIMessage[] = [
      ...limitedPriorTurns.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userTurnMessage },
    ];

    let response = await provider.sendMessage(providerMessages, {
      systemInstruction,
      tools: toolDefinitions,
    });

    // 4. Araç çağrısı talep edildiyse GERÇEKTEN çalıştır, sonucu geri gönder.
    if (response.toolCalls.length > 0) {
      const toolResults: AIToolResult[] = [];
      for (const call of response.toolCalls) {
        console.log(`[AI] Tool Started: ${call.toolName}`, call.arguments);
        const toolStartedAt = Date.now();
        const result = await toolRegistry.invoke(call.toolName, call.arguments);
        const toolDurationMs = Date.now() - toolStartedAt;
        aiDiagnostics.recordToolDuration(toolDurationMs);
        console.log(`[AI] Tool Finished: ${call.toolName} (${toolDurationMs}ms)`);
        toolResults.push({ toolName: call.toolName, result });
      }

      if (settings.debugMode) {
        await aiConversationRepository.addMessage({
          conversationId: input.conversationId,
          role: "tool",
          content: JSON.stringify(toolResults),
          toolCalls: response.toolCalls.map((c) => ({ toolName: c.toolName, arguments: c.arguments })),
        });
      }

      // 🔴 GERÇEK BUG DÜZELTMESİ (AI X-Ray denetiminde bulundu,
      // kanıtlandı — bkz. `AIMessage.toolCalls`'ın belgesi ve
      // `GeminiProvider.buildContents()`'in güncellenmiş yorumu).
      // ÖNCEDEN, 2. round-trip'e SADECE `pendingToolResults`
      // gönderiliyordu — modelin KENDİ function-call talebi (bu ilk
      // `response`) history'ye HİÇ eklenmiyordu. Gemini'nin resmi
      // sözleşmesi, bir `functionResponse`'un HEMEN ÖNCESİNDE eşleşen
      // `functionCall`'ı içeren bir "model" turu OLMASINI ZORUNLU
      // KILIYOR — bu satır olmadan Gemini 400 Bad Request döndürüyordu.
      const messagesWithModelToolCall: AIMessage[] = [
        ...providerMessages,
        { role: "model", content: response.text ?? "", toolCalls: response.toolCalls },
      ];

      response = await provider.sendMessage(messagesWithModelToolCall, {
        systemInstruction,
        tools: toolDefinitions,
        pendingToolResults: toolResults,
      });
    }

    // 5. Nihai cevabı kaydet.
    const assistantMessage = await aiConversationRepository.addMessage({
      conversationId: input.conversationId,
      role: "model",
      content: response.text ?? "",
    });

    return { assistantMessage };
  }
}

export const aiSessionService = new AiSessionService();
