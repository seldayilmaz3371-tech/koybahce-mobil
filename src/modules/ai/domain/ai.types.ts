/**
 * AI Domain Tipleri
 * ====================
 * bkz. ADR 0024 (AI Architecture Decisions), Sprint 6.
 *
 * Web projesinde (Deliverable 1 — Module 5 Analysis Report) "konuşma
 * geçmişi" kavramı YOK — web stateless (tek seferlik istek-cevap).
 * Bu tipler SIFIRDAN tasarlandı.
 */

export const AiMessageRole = {
  User: "user",
  Model: "model",
  Tool: "tool",
} as const;

export type AiMessageRoleValue = (typeof AiMessageRole)[keyof typeof AiMessageRole];

export interface AiConversation {
  id: string;
  /** nullable — kullanıcı açıkça bir başlık vermediyse otomatik/boş kalır. */
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewAiConversationInput {
  title?: string | null;
}

/** Modelin bu mesajda talep ettiği araç çağrıları (varsa) — `role: "model"` mesajlarında dolu olabilir. */
export interface AiToolCallRecord {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRoleValue;
  content: string;
  /** nullable — sadece modelin araç çağrısı talep ettiği mesajlarda dolu. */
  toolCalls: AiToolCallRecord[] | null;
  createdAt: string;
}

export interface NewAiMessageInput {
  conversationId: string;
  role: AiMessageRoleValue;
  content: string;
  toolCalls?: AiToolCallRecord[] | null;
}

/**
 * AI Ayarları — Sprint 6, tek satır (id sabit `"default"`).
 *
 * ADR 0024 Karar 4: `providerName` PROVIDER-BAĞIMSIZ — hiçbir yerde
 * `"gemini"` sabit kodlanmıyor, hep bu alandan okunuyor.
 *
 * `maxContextItems`/`maxMessages`/`debugMode` — Sprint 6'nın kendi
 * onayı: "Henüz kullanılmayacak alanlar olsa bile mimari buna uygun
 * olmalıdır." Şemada VE domain tipinde VAR, ama Sprint 6'nın Ayarlar
 * EKRANI bunları bugün GÖSTERMEZ (Kural 30 — varsayımla doldurulmuyor,
 * kademeli UI).
 */
export interface AiSettings {
  providerName: string;
  isEnabled: boolean;
  /** API anahtarının KENDİSİ Secure Storage'da — burada sadece "girilmiş mi" bayrağı. */
  apiKeyConfigured: boolean;
  internetPermission: boolean;
  responseLanguage: string;
  maxContextItems: number;
  maxMessages: number;
  debugMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AiSettingsUpdateInput = Partial<
  Omit<AiSettings, "createdAt" | "updatedAt" | "apiKeyConfigured">
>;
