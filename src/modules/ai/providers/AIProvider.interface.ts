/**
 * AIProvider Arayüzü
 * =====================
 * bkz. ADR 0024 Karar 1 (Provider Registry). Uygulama kodu HİÇBİR ZAMAN
 * doğrudan bir sağlayıcının SDK'sını çağırmaz — her zaman bu arayüz
 * üzerinden (native eklenti sarmalayıcı deseniyle tutarlı, Kural 12).
 *
 * `analyzeImage()` — Sprint 9.2'de eklendi (ADR 0024'ün önceden
 * öngördüğü genişleme, "İleride gerektiğinde bu arayüze eklenecek").
 * `streamMessage()` HÂLÂ YOK (Sesli Asistan hâlâ ertelendi, bu
 * genişlemenin kapsamı DIŞINDA).
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
  /**
   * bkz. Sprint 10.6 (Production Ready — Tool-Calling Düzeltmesi).
   * SADECE `role: "model"` mesajlarında, o mesaj bir ARAÇ ÇAĞRISI
   * TALEP ETTİYSE dolu olur. GERÇEK BULGU (AI X-Ray denetiminde
   * bulundu, kanıtlandı): Gemini API'nin resmi sözleşmesi, bir
   * `functionResponse`'un HEMEN ÖNCESİNDE, EŞLEŞEN `functionCall`'ı
   * İÇEREN bir "model" turu OLMASINI ZORUNLU KILIYOR (resmi
   * dokümantasyon örneği + güncel bir 3. parti hata raporuyla
   * doğrulandı — aksi halde Gemini 400 Bad Request döner). Bu alan,
   * `AiSessionService`'in modelin İLK yanıtını (tool çağrısı
   * talebini) history'ye GERİ EKLEYEBİLMESİ için var — provider-
   * AGNOSTİK (Gemini'ye özgü bir tip burada SIZDIRILMIYOR, her
   * provider kendi `buildContents()`'inde bunu kendi formatına çevirir).
   */
  toolCalls?: AIToolCallRequest[];
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

  /**
   * Bir görseli (base64 kodlanmış) ve bir metin talimatını Gemini
   * Vision'a gönderir, modelin metin yanıtını döner. Sprint 9.2 —
   * sadece Fotoğraf Analizi'nin "ilk çalışan akışı" için — HİÇBİR
   * yapılandırılmış (JSON şemalı) çıktı, tool calling veya kalıcı
   * saklama YOK, sadece serbest metin analiz sonucu.
   *
   * GERÇEK API DOĞRULAMASI (varsayılmadı): `Part.inlineData: { data:
   * string (base64), mimeType: string }` — resmi `@google/genai`
   * tip tanımlarından (`Blob_2`) doğrulandı.
   */
  analyzeImage(imageBase64: string, mimeType: string, prompt: string, systemInstruction?: string): Promise<string>;
}
