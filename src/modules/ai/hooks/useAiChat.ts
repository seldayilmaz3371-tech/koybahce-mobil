/**
 * useAiChat Hook
 * =================
 * bkz. ADR 0024. Bir konuşmayı (yoksa OLUŞTURUR) yönetir, mesaj
 * geçmişini listeler, `AiSessionService.sendUserMessage()` üzerinden
 * yeni mesaj gönderir.
 */

import { useCallback, useEffect, useState } from "react";
import { aiConversationRepository } from "../data/aiConversation.repository";
import { aiSessionService } from "../session/AiSessionService";
import type { AiMessage } from "../domain/ai.types";
import type { ScreenContext } from "../context/IContextEngine.interface";
import { mapAiError } from "../../../core/errors/mapAiError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

type UseAiChatStatus = "idle" | "loading" | "ready" | "sending" | "error";

export interface UseAiChatResult {
  conversationId: string | null;
  messages: AiMessage[];
  status: UseAiChatStatus;
  errorCode: ErrorCodeValue | null;
  sendMessage: (userQuery: string) => Promise<void>;
}

export function useAiChat(screenContext?: ScreenContext): UseAiChatResult {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [status, setStatus] = useState<UseAiChatStatus>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setErrorCode(null);
      try {
        // Sprint 6 — her ekran açılışında YENİ bir konuşma (basit,
        // "önceki konuşmalara devam et" ekranı Sprint 6 kapsamı
        // dışında — YAGNI, henüz istenmedi).
        const conversation = await aiConversationRepository.createConversation();
        if (cancelled) return;
        setConversationId(conversation.id);
        setMessages([]);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorCode(mapAiError(error));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = useCallback(
    async (userQuery: string) => {
      if (!conversationId || status === "sending") return;
      setStatus("sending");
      setErrorCode(null);
      try {
        await aiSessionService.sendUserMessage({ conversationId, userQuery, screenContext });
        const updated = await aiConversationRepository.listMessages(conversationId);
        setMessages(updated);
        setStatus("ready");
      } catch (error) {
        setErrorCode(mapAiError(error));
        setStatus("error");
      }
    },
    [conversationId, status, screenContext]
  );

  return { conversationId, messages, status, errorCode, sendMessage };
}
