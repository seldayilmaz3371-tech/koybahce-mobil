/**
 * GeminiProvider
 * =================
 * bkz. ADR 0024. Web projesinin `gemini-client.ts`'inden UYARLANDI
 * (Deliverable — Sprint 6 Karşılaştırma Analizi):
 *   - Tembel başlatma (lazy init) — MANTIK taşındı, kaynak DEĞİŞTİ:
 *     web `process.env.GEMINI_API_KEY` (sunucu), biz Secure Storage
 *     (Android Keystore, `native/secureStorage.ts` — Modül 1'den beri
 *     hazır bekleyen `GEMINI_API_KEY` anahtarı, hiç değişmedi).
 *   - Retry stratejisi — BİREBİR mantık taşındı: `RESOURCE_EXHAUSTED`/
 *     4xx (kota/istemci hataları) retry YAPILMAZ (aynı hatayı tekrar
 *     üretir, kota israfı), sadece geçici (ağ/5xx) hatalar 2 deneme +
 *     üstel geri çekilmeyle yeniden denenir.
 *
 * İstemci CACHE'LENMİYOR (web'in aksine, bilinçli fark): kullanıcı
 * Ayarlar ekranından anahtarı HERHANGİ bir anda değiştirebilir — cache
 * eski anahtarla kalma riski taşırdı. `GoogleGenAI` nesnesi oluşturmak
 * gerçek bir ağ çağrısı YAPMIYOR (ucuz), bu yüzden her `sendMessage()`
 * çağrısında güncel anahtarla yeniden oluşturmak GÜVENLİ ve BASİT
 * (cache geçersizleştirme karmaşıklığından kaçınıyor — Kural 4).
 */

import { GoogleGenAI, type Content, type Part, type Tool } from "@google/genai";
import { secureStorage, SecureStorageKey } from "../../../native/secureStorage";
import { aiDiagnostics } from "../diagnostics/aiDiagnostics";
import type {
  AIMessage,
  AIProvider,
  AIProviderResponse,
  AIToolCallRequest,
  AIToolDefinition,
  AIToolResult,
} from "./AIProvider.interface";

/**
 * bkz. Bölüm 15 (AI Ayarları) — "AI sağlayıcı/model seçimi: Gemini (varsayılan)". Model seçimi bugün kullanıcıya sunulmuyor.
 *
 * bkz. Sprint 10.8. GERÇEK BULGU (Sprint 10.7'nin Diagnostic Build'i
 * kullanıcının cihazında henüz okunamadığı için, bu değişiklik
 * "kesin kök neden düzeltmesi" OLARAK SUNULMUYOR — dürüstçe
 * belirtilmesi gerekiyor):
 *
 * `gemini-2.5-flash` sabit model adı, resmi Google dokümantasyonunda
 * (ai.google.dev/gemini-api/docs/models, bu sprintte gerçekten
 * kontrol edildi) BUGÜN İTİBARIYLA hâlâ aktif model listesinde
 * görünüyor — "shut down" olarak işaretli DEĞİL. Ama GÜNCEL,
 * bağımsız bir Google AI Developer Forum raporu (bu sprintte
 * gerçekten arandı), bazı kullanıcıların BEKLENENDEN ÖNCE, bildirim
 * olmadan "This model models/gemini-2.5-flash is no longer
 * available" hatası aldığını gösteriyor.
 *
 * Google'ın KENDİ resmi dokümantasyonu, "latest" alias'ının TAM
 * OLARAK bu tür deprecation sürprizlerine karşı tasarlandığını
 * açıklıyor: "Points to the latest release for a specific model
 * variation... For breaking changes, a 2-week notice will be
 * provided through email before the version behind latest is
 * changed." `gemini-flash-latest`, BUGÜN Gemini 3.5 Flash GA
 * sürümüne işaret ediyor (resmi changelog'da doğrulandı).
 *
 * Bu, KANITLANMIŞ bir kök neden düzeltmesi değil — GERÇEK cihaz
 * teşhis verisi (Sprint 10.7'nin Diagnostic ekranı, bu sprintte
 * ayrıca düzeltildi) görülmeden kesinleştirilemez. Ama bu, Google'ın
 * kendi resmi tavsiyesine dayanan, düşük riskli bir dayanıklılık
 * iyileştirmesi — sabit bir model adının gelecekte de bugünküyle
 * aynı sorunu yaratma riskini ortadan kaldırıyor.
 */
const GEMINI_MODEL = "gemini-flash-latest";

/** Web projesindeki `MAX_GEMINI_RETRY_ATTEMPTS`/`GEMINI_RETRY_BASE_DELAY_MS` ile BİREBİR aynı değerler. */
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 1000;

/**
 * bkz. Sprint 10.7 (AI Diagnostic Build) — GERÇEK BULGU: SDK çağrısında
 * daha önce HİÇBİR timeout mekanizması YOKTU — bir istek sunucudan
 * yanıt gelene kadar (veya bağlantı düşük seviyede kesilene kadar)
 * SINIRSIZ süre bekliyordu. Bu, Fotoğraf Analizi'nin "sonsuz bekleme"
 * belirtisinin güçlü kanıtlanmış nedeniydi (bkz. kök neden raporu).
 * `HttpOptions.timeout` (resmi `@google/genai` tip tanımlarından
 * doğrulandı — ms cinsinden, SDK'nın KENDİ native mekanizması) burada
 * kullanılıyor. 45 saniye — normal bir mobil ağ isteği için cömert,
 * ama "sonsuz" değil; bu değer TEŞHİS amaçlı seçildi (bir isteğin
 * GERÇEKTEN "asılı kaldığını" ölçülebilir kılmak için) — kalıcı bir
 * kullanıcı deneyimi kararı DEĞİL, ayrı bir sprintte yeniden
 * değerlendirilebilir.
 */
const REQUEST_TIMEOUT_MS = 45_000;

/** Web projesinin `isRetryableGeminiError`'ından BİREBİR taşındı. */
function isRetryableGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const nonRetryableMarkers = ["RESOURCE_EXHAUSTED", '"code":429', '"code":400', '"code":401', '"code":403'];
  return !nonRetryableMarkers.some((marker) => message.includes(marker));
}

/** Web projesinin `callGeminiWithRetry`'inden BİREBİR taşındı. */
async function callGeminiWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS;
      if (isLastAttempt || !isRetryableGeminiError(error)) {
        throw error;
      }
      // bkz. Sprint 10.7, Madde "Retry Count" — GERÇEK yeniden deneme
      // sayısı artık gözlemlenebilir (Diagnostic ekranında gösterilir).
      aiDiagnostics.recordRetry();
      const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * `AIMessage[]` + (varsa) bekleyen araç sonuçlarını, Gemini'nin
 * GERÇEK `Content[]` formatına çevirir. `Content.role` SADECE
 * `'user'`/`'model'` kabul ediyor (resmi tip tanımlarından
 * doğrulandı) — `role: "tool"` mesajları burada FİLTRELENİYOR (Gemini
 * bunun yerine `functionResponse` Part'ı bekliyor).
 *
 * 🔴 GERÇEK BUG DÜZELTMESİ (AI X-Ray denetiminde bulundu, kanıtlandı
 * — bkz. `AIMessage.toolCalls`'ın belgesi): ÖNCEDEN, `role: "model"`
 * mesajları SADECE `m.content`'i (metin) bir `text` Part'ına
 * çeviriyordu — mesajın `toolCalls`'ı VARSA bile bu HİÇ dikkate
 * alınmıyordu. Bu, modelin kendi function-call talebinin history'den
 * TAMAMEN KAYBOLMASINA yol açıyordu — Gemini'nin resmi sözleşmesi
 * (`functionResponse`'un HEMEN ÖNCESİNDE eşleşen bir `functionCall`
 * içeren "model" turu OLMASI gerektiği) ihlal ediliyordu, bu da
 * gerçek kullanımda 400 Bad Request ile sonuçlanıyordu. DÜZELTME:
 * `toolCalls` varsa, HER biri için bir `functionCall` Part'ı üretilir
 * ve (varsa) metin Part'ıyla BİRLİKTE gönderilir.
 */
function buildContents(messages: AIMessage[], pendingToolResults?: AIToolResult[]): Content[] {
  const contents: Content[] = messages
    .filter((m) => m.role !== "tool")
    .map((m) => {
      const parts: Part[] = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      if (m.toolCalls && m.toolCalls.length > 0) {
        for (const call of m.toolCalls) {
          parts.push({ functionCall: { name: call.toolName, args: call.arguments } });
        }
      }
      // Teorik olarak content VE toolCalls ikisi de boş olmamalı (çağıran
      // katman ya metin ya araç çağrısı üretir) — ama BOŞ bir contents
      // Part dizisi Gemini API'sinde geçersiz bir istek olurdu, bu yüzden
      // güvenli bir fallback: boş metin.
      return { role: m.role, parts: parts.length > 0 ? parts : [{ text: "" }] };
    });

  if (pendingToolResults && pendingToolResults.length > 0) {
    const parts: Part[] = pendingToolResults.map((r) => ({
      functionResponse: { name: r.toolName, response: { output: r.result } },
    }));
    contents.push({ role: "user", parts });
  }

  return contents;
}

function buildTools(tools?: AIToolDefinition[]): Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parametersJsonSchema: t.parametersJsonSchema,
      })),
    },
  ];
}

class GeminiProvider implements AIProvider {
  readonly providerName = "gemini";

  private async getApiKey(): Promise<string> {
    const apiKey = await secureStorage.get(SecureStorageKey.GEMINI_API_KEY);
    // bkz. Sprint 10.7, Madde 1 — "API Key başarıyla okunuyor mu?
    // (Boş, null veya geçerli)" — GERÇEKTEN gözlemlenebilir hale
    // getirildi. Not: "configured" SADECE bir değerin VAR OLDUĞUNU
    // gösterir, Gemini'nin bu anahtarı GEÇERLİ sayıp saymadığını
    // GÖSTERMEZ (bu, ancak gerçek bir API çağrısı sonrası bilinebilir).
    aiDiagnostics.recordApiKeyStatus(apiKey ? "configured" : "empty");
    if (!apiKey) {
      // Ham teknik hata — UI katmanı (Error Code Standard) bunu
      // çevrilmiş bir mesaja eşler, burada Türkçe/İngilizce metin
      // YAZILMAZ (Globalization Policy).
      throw new Error("AI_PROVIDER_API_KEY_NOT_CONFIGURED");
    }
    return apiKey;
  }

  async sendMessage(
    messages: AIMessage[],
    options: {
      systemInstruction?: string;
      tools?: AIToolDefinition[];
      pendingToolResults?: AIToolResult[];
    } = {}
  ): Promise<AIProviderResponse> {
    aiDiagnostics.startNewRequest();
    aiDiagnostics.recordProvider(this.providerName);
    try {
      const apiKey = await this.getApiKey();
      const client = new GoogleGenAI({ apiKey });
      aiDiagnostics.recordStage("request_prepared");

      aiDiagnostics.recordStage("request_sent");
      const response = await callGeminiWithRetry(() => {
        aiDiagnostics.recordStage("awaiting_response");
        return client.models.generateContent({
          model: GEMINI_MODEL,
          contents: buildContents(messages, options.pendingToolResults),
          config: {
            systemInstruction: options.systemInstruction,
            tools: buildTools(options.tools),
            httpOptions: { timeout: REQUEST_TIMEOUT_MS },
          },
        });
      });
      aiDiagnostics.recordStage("response_received");

      const toolCalls: AIToolCallRequest[] = (response.functionCalls ?? [])
        .filter((fc) => fc.name)
        .map((fc) => ({ toolName: fc.name as string, arguments: fc.args ?? {} }));

      aiDiagnostics.recordStage("parsed");
      aiDiagnostics.finishRequest();
      return {
        text: response.text ?? null,
        toolCalls,
      };
    } catch (error) {
      aiDiagnostics.recordRawError(error);
      aiDiagnostics.finishRequest();
      throw error;
    }
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    aiDiagnostics.startNewRequest();
    aiDiagnostics.recordProvider(this.providerName);
    // bkz. Sprint 10.7, Madde 8 — "Fotoğraf boyutu / Base64 boyutu."
    // `imageBase64.length` karakter sayısı = byte sayısı (base64
    // ASCII karakterlerden oluşur, UTF-16 çift-byte riski YOK).
    // Orijinal dosya boyutu, base64'ün ~%75'i (4 karakter -> 3 byte).
    const base64SizeBytes = imageBase64.length;
    const estimatedFileSizeBytes = Math.round(base64SizeBytes * 0.75);
    aiDiagnostics.recordPhotoSizes(estimatedFileSizeBytes, base64SizeBytes);

    try {
      const apiKey = await this.getApiKey();
      const client = new GoogleGenAI({ apiKey });
      aiDiagnostics.recordStage("request_prepared");

      aiDiagnostics.recordStage("request_sent");
      const response = await callGeminiWithRetry(() => {
        aiDiagnostics.recordStage("awaiting_response");
        return client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            {
              role: "user",
              parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }],
            },
          ],
          config: { systemInstruction, httpOptions: { timeout: REQUEST_TIMEOUT_MS } },
        });
      });
      aiDiagnostics.recordStage("response_received");

      // Fotoğraf Analizi'nde tool calling YOK (Sprint 9.2 kapsamı
      // dışında) — sadece metin bekleniyor. `response.text` boşsa
      // (nadir, ör. güvenlik filtresi engeli) AÇIK bir hata fırlatılır
      // — UI katmanı bunu çevrilmiş bir mesaja eşler, "sessizce boş
      // sonuç" GÖSTERİLMEZ.
      if (!response.text) {
        throw new Error("AI_PHOTO_ANALYSIS_EMPTY_RESPONSE");
      }
      aiDiagnostics.recordStage("parsed");
      aiDiagnostics.finishRequest();
      return response.text;
    } catch (error) {
      aiDiagnostics.recordRawError(error);
      aiDiagnostics.finishRequest();
      throw error;
    }
  }
}

export const geminiProvider: AIProvider = new GeminiProvider();
