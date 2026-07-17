/**
 * AIProvider Arayüzü
 * =====================
 * bkz. ADR 0024 Karar 1 (Provider Registry). Uygulama kodu HİÇBİR ZAMAN
 * doğrudan bir sağlayıcının SDK'sını çağırmaz — her zaman bu arayüz
 * üzerinden (native eklenti sarmalayıcı deseniyle tutarlı, Kural 12).
 *
 * BİLİNÇLİ SADELİK (YAGNI — kullanıcı onayı, "gereksiz karmaşık/büyük
 * olmamalı"): Sadece `sendMessage()` var. `streamMessage()`/
 * `analyzeImage()` (AI Master Architecture Bölüm 9-10'da tanımlı)
 * Sprint 6'nın kapsamı DIŞINDA (Sesli Asistan/Fotoğraf Analizi
 * ertelendi) — bugün YAZILMIYOR. İleride gerektiğinde bu arayüze
 * eklenecek, mevcut `GeminiProvider` implementasyonu genişletilecek.
 */

export interface AIToolDefinition {
  name: string;
  description: string;
  /** Düz JSON Schema (OpenAPI 3.0 Parameter Object) — `@google/genai`'nin `parametersJsonSchema` alanıyla birebir uyumlu, gerçek tip tanımlarından doğrulandı. */
  parametersJsonSchema: Record<string, unknown>;
}

export interface AIToolCallRequest {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface AIToolResult {
  toolName: string;
  result: unknown;
}

export type AIMessageRole = "user" | "model" | "tool";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIProviderResponse {
  /** Modelin ürettiği metin — araç çağrısı talep ederse `null` olabilir. */
  text: string | null;
  /** Modelin çağırmak istediği araçlar (varsa) — boş dizi = araç çağrısı yok. */
  toolCalls: AIToolCallRequest[];
}

export interface AIProvider {
  readonly providerName: string;
  /**
   * Bir mesaj dizisini (geçmiş + yeni kullanıcı mesajı) sağlayıcıya
   * gönderir.
   *
   * `systemInstruction` — GERÇEK Gemini API'sinin ayrı bir `config.
   * systemInstruction` alanı VAR (resmi tip tanımlarından doğrulandı,
   * `ContentUnion` tipinde) — sistem talimatını bir "user" mesajına
   * GÖMMEK yerine bu alan kullanılır (daha doğru, modelin sistem
   * talimatını kullanıcı girdisinden NET olarak ayırt etmesini sağlar).
   *
   * `tools` verilirse, sağlayıcı bunlardan birini çağırmayı TALEP
   * EDEBİLİR (`AIProviderResponse.toolCalls`) — gerçek çağrıyı YAPMAZ,
   * sadece talep eder (bkz. `ToolRegistry.invoke`, `AiSessionService`
   * bu talebi işler).
   *
   * `pendingToolResults` — bir ÖNCEKİ `sendMessage()` çağrısı araç
   * çağrısı talep ettiyse, o araçların GERÇEK sonuçları burada geri
   * gönderilir (Gemini'nin gerçek `functionResponse` Part formatına,
   * `GeminiProvider` içinde dönüştürülür — resmi `@google/genai`
   * tip tanımlarından doğrulandı, varsayılmadı).
   */
  sendMessage(
    messages: AIMessage[],
    options?: {
      systemInstruction?: string;
      tools?: AIToolDefinition[];
      pendingToolResults?: AIToolResult[];
    }
  ): Promise<AIProviderResponse>;
}
