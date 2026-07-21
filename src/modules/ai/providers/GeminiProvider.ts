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
import type {
  AIMessage,
  AIProvider,
  AIProviderResponse,
  AIToolCallRequest,
  AIToolDefinition,
  AIToolResult,
} from "./AIProvider.interface";

/** bkz. Bölüm 15 (AI Ayarları) — "AI sağlayıcı/model seçimi: Gemini (varsayılan)". Model seçimi bugün kullanıcıya sunulmuyor. */
const GEMINI_MODEL = "gemini-2.5-flash";

/** Web projesindeki `MAX_GEMINI_RETRY_ATTEMPTS`/`GEMINI_RETRY_BASE_DELAY_MS` ile BİREBİR aynı değerler. */
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 1000;

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
    const apiKey = await this.getApiKey();
    const client = new GoogleGenAI({ apiKey });

    const response = await callGeminiWithRetry(() =>
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildContents(messages, options.pendingToolResults),
        config: {
          systemInstruction: options.systemInstruction,
          tools: buildTools(options.tools),
        },
      })
    );

    const toolCalls: AIToolCallRequest[] = (response.functionCalls ?? [])
      .filter((fc) => fc.name)
      .map((fc) => ({ toolName: fc.name as string, arguments: fc.args ?? {} }));

    return {
      text: response.text ?? null,
      toolCalls,
    };
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    const apiKey = await this.getApiKey();
    const client = new GoogleGenAI({ apiKey });

    const response = await callGeminiWithRetry(() =>
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }],
          },
        ],
        config: { systemInstruction },
      })
    );

    // Fotoğraf Analizi'nde tool calling YOK (Sprint 9.2 kapsamı
    // dışında) — sadece metin bekleniyor. `response.text` boşsa
    // (nadir, ör. güvenlik filtresi engeli) AÇIK bir hata fırlatılır
    // — UI katmanı bunu çevrilmiş bir mesaja eşler, "sessizce boş
    // sonuç" GÖSTERİLMEZ.
    if (!response.text) {
      throw new Error("AI_PHOTO_ANALYSIS_EMPTY_RESPONSE");
    }
    return response.text;
  }
}

export const geminiProvider: AIProvider = new GeminiProvider();
