/**
 * AI Konuşma Repository Sözleşmesi
 * ====================================
 * bkz. ADR 0024. Web projesinde emsali YOK (stateless) — sıfırdan
 * tasarlandı.
 */

import type { AiConversation, AiMessage, NewAiConversationInput, NewAiMessageInput } from "../domain/ai.types";

export interface IAiConversationRepository {
  listConversations(limit?: number): Promise<AiConversation[]>;
  getConversationById(id: string): Promise<AiConversation | null>;
  createConversation(input?: NewAiConversationInput): Promise<AiConversation>;
  deactivateConversation(id: string): Promise<void>;

  listMessages(conversationId: string): Promise<AiMessage[]>;
  addMessage(input: NewAiMessageInput): Promise<AiMessage>;
}
