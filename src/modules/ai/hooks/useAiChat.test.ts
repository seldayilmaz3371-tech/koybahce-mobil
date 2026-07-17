// @vitest-environment jsdom
/**
 * useAiChat Hook Testleri
 * ==========================
 * bkz. ADR 0024.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { aiSettingsRepository } from "../data/aiSettings.repository";
import { providerRegistry } from "../providers/ProviderRegistry";
import type { AIProvider } from "../providers/AIProvider.interface";
import { useAiChat } from "./useAiChat";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("useAiChat", () => {
  it("mount olduğunda YENİ bir konuşma oluşturur", async () => {
    const { result } = renderHook(() => useAiChat());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.conversationId).not.toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  it("AI kapalıyken sendMessage() AI_001 errorCode'una yol açar (ham mesaj DEĞİL)", async () => {
    const { result } = renderHook(() => useAiChat());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.sendMessage("test sorusu");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("AI_001");
  });

  it("AI açık ve provider hazırsa, sendMessage() sonrası messages GÜNCELLENİR", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    const fakeProvider: AIProvider = {
      providerName: "gemini",
      sendMessage: vi.fn().mockResolvedValue({ text: "cevap metni", toolCalls: [] }),
    };
    providerRegistry.register(fakeProvider);

    const { result } = renderHook(() => useAiChat());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.sendMessage("kaç sulama yaptım?");

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[1].content).toBe("cevap metni");
    expect(result.current.status).toBe("ready");
  });

  it("screenContext verilirse AiSessionService'e doğru şekilde iletilir", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    const sendMessageSpy = vi.fn().mockResolvedValue({ text: "cevap", toolCalls: [] });
    providerRegistry.register({ providerName: "gemini", sendMessage: sendMessageSpy });

    const { result } = renderHook(() => useAiChat({ parcelId: "p1" }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.sendMessage("soru");

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    // Context Engine parcelId'yi contextText'e dahil ettiyse, gönderilen
    // mesajlardan birinde "p1" GEÇMELİ.
    const allSentText = sendMessageSpy.mock.calls[0][0].map((m: { content: string }) => m.content).join(" ");
    expect(allSentText).toContain("p1");
  });
});
