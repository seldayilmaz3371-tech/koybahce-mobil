/**
 * IContextEngine Arayüzü
 * =========================
 * bkz. ADR 0024 Karar 5. İlk (ve Sprint 6'daki TEK) implementasyon:
 * `KeywordContextEngine`. Gelecekte `SemanticContextEngine` (embedding/
 * RAG) BU ARAYÜZ ÜZERİNDEN eklenecek — `AiSessionService`'in hiçbir
 * satırı değişmeyecek.
 */

export interface ScreenContext {
  /** Kullanıcının şu an hangi ekranda olduğu (opsiyonel — ekran bağlamı bilinmiyorsa boş). */
  screenName?: string;
  parcelId?: string;
  treeId?: string;
}

export interface ContextResult {
  /** Anahtar kelime eşleşmesine göre İLGİLİ görülen araçlar — GERÇEK çağrı burada YAPILMAZ, sadece hangi araçların modele SUNULACAĞI belirlenir (Bölüm 4 — "iki kademeli, AI çağrısı gerektirmeyen filtreleme"). */
  suggestedToolNames: string[];
  /** Prompt'a eklenecek, ekran bağlamını açıklayan metin (varsa). */
  contextText: string;
}

export interface IContextEngine {
  buildContext(userQuery: string, screenContext: ScreenContext): Promise<ContextResult>;
}
