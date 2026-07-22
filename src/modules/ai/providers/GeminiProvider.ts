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
 * bkz. Sprint 10.11, GERÇEK KESİN KANIT (Sprint 10.7'nin `httpOptions.
 * timeout` çözümü GERÇEKTEN ÇALIŞMIYORDU): Resmi, güncel bir
 * `@google/genai` GitHub Issue'su (googleapis/js-genai#1277 —
 * "Support for `config.httpOptions.timeout` option is BROKEN for
 * `models.generateContent`" — "No matter what's set to
 * `config.httpOptions.timeout` it doesn't have effect") bu SDK
 * özelliğinin BİLİNEN, AÇIK bir bug olduğunu kanıtlıyor. Bu, gerçek
 * cihazda Fotoğraf Analizi'nin ve tool-calling akışının
 * "awaiting_response" aşamasında SONSUZA kadar takılı kalmasının
 * (Retry: 0, Error: Yok — hiçbir hata ASLA oluşmuyor) kesin
 * açıklamasıdır — `httpOptions.timeout` hiçbir zaman devreye girmiyordu.
 *
 * DÜZELTME: SDK'nın kendi (bozuk) timeout mekanizması yerine, gerçek
 * bir `AbortController` kullanılıyor — `config.abortSignal` (resmi tip
 * tanımlarından doğrulandı, `GenerateContentConfig`'in ayrı bir alanı)
 * SDK'nın DOĞRUDAN desteklediği, `httpOptions.timeout`'tan FARKLI bir
 * mekanizma. `AbortController.abort()`, JavaScript'in temel,
 * platform-seviyesi bir API'sidir — SDK'nın kendi HTTP katmanındaki
 * bug'ından ETKİLENMEZ.
 */
const REQUEST_TIMEOUT_MS = 45_000;

/**
 * bkz. Sprint 10.11. Kullanıcının talep ettiği `[AI]` etiketli log
 * stratejisi — gerçek cihaz Logcat'inde zincirin adım adım takip
 * edilebilmesi için. `console.log` kullanılıyor (`console.error`
 * DEĞİL — bunlar hata değil, normal akış bilgisi).
 */
function logAiStage(message: string): void {
  console.log(`[AI] ${message}`);
}

/**
 * bkz. Sprint 10.11, GERÇEK KÖK NEDEN DÜZELTMESİ. `httpOptions.timeout`
 * yerine gerçek bir `AbortController` oluşturur — `REQUEST_TIMEOUT_MS`
 * sonunda `abort()` çağrılır, bu da SDK'nın `fetch` çağrısını GERÇEKTEN
 * iptal eder (SDK'nın bozuk `httpOptions.timeout`'undan bağımsız,
 * platform-seviyesi bir mekanizma). Çağıran taraf, işlem bitince
 * `clearTimeout` ile temizlemekten SORUMLUDUR (bellek sızıntısını
 * önlemek için).
 */
function createRequestAbortController(): { controller: AbortController; timeoutHandle: ReturnType<typeof setTimeout> } {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    logAiStage(`Request Timeout — ${REQUEST_TIMEOUT_MS}ms içinde yanıt gelmedi, istek İPTAL ediliyor`);
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  return { controller, timeoutHandle };
}

/**
 * bkz. Sprint 10.10, GERÇEK KÖK NEDEN DÜZELTMESİ (kesin kanıtla
 * doğrulandı — bkz. kök neden raporu, "mapAiError/ApiError
 * uyumsuzluğu"). ÖNCEDEN bu fonksiyon `error.message`'ın İÇİNDE
 * `'"code":400'` gibi bir JSON alt-dizesi arıyordu — ama gerçek
 * `ApiError` sınıfı (resmi tip tanımlarından doğrulandı), durum
 * kodunu AYRI, sayısal bir `status` alanında taşıyor, `message`'ın
 * içine JSON olarak GÖMMÜYOR. Bu yüzden hiçbir marker ASLA
 * eşleşmiyordu — TÜM hatalar (400/401/403/429 dahil) "retry
 * edilebilir" olarak YANLIŞ sınıflandırılıyordu.
 *
 * SOMUT ETKİSİ (kullanıcının gerçek cihaz test sırasıyla tutarlı):
 * Her "thought_signature eksik" (400) hatası, GERÇEKTEN 3 kez (1 ilk
 * deneme + `MAX_RETRY_ATTEMPTS=2` retry) Gemini'ye istek
 * gönderiyordu — bu, kota tüketimini 3 katına çıkarıyordu. Test
 * 5-6'da (400 hataları) yaşanan kota tüketimi, Test 8-9'daki
 * RESOURCE_EXHAUSTED (429) hatasının gerçek bir katkı nedenidir.
 */
/**
 * bkz. Sprint 10.12, GERÇEK KÖK NEDEN DÜZELTMESİ (kesin kod kanıtı):
 * `AbortController.abort()` (Sprint 10.11'de eklenen timeout
 * mekanizması) tetiklendiğinde, fırlatılan hata bir DOM `AbortError`
 * (`DOMException`) — bu, gerçek bir `ApiError` DEĞİL, `status` alanı
 * YOK. Bu fonksiyon `status === null` durumunda `true` (retry
 * edilebilir) döndürüyordu — bu yüzden HER 45 saniyelik timeout,
 * GERÇEKTEN 3 kez (1 ilk + 2 retry) tekrar deneniyordu, yani ~135
 * saniye boyunca 3 AYRI gerçek Gemini isteği açık kalıyordu. Bu,
 * tool-calling akışlarının (2 round-trip = potansiyel olarak 6 gerçek
 * istek) basit sohbete (1 round-trip = potansiyel 3 istek) göre çok
 * daha fazla gerçek API çağrısı yapmasına yol açan, KANITLANMIŞ bir
 * kota/rate-limit tüketim kaynağıdır.
 */
function isRetryableGeminiError(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    // Timeout'un kendisi zaten "yanıt gelmedi" demek — tekrar denemek
    // aynı süreyi tekrar bekletir, hem kullanıcı deneyimini kötüleştirir
    // hem de gerçek API çağrı sayısını (ve kota/rate-limit tüketimini)
    // gereksiz yere katlar.
    return false;
  }
  const status =
    error instanceof Error && "status" in error && typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : null;
  if (status !== null) {
    // 400 (geçersiz istek — ör. thought_signature eksik), 401/403
    // (kimlik doğrulama), 429 (rate limit/kota) — hiçbiri retry ile
    // düzelmez, aynı hatayı tekrar üretir (kota israfı).
    const nonRetryableStatuses = [400, 401, 403, 429];
    return !nonRetryableStatuses.includes(status);
  }
  // `status` alanı yoksa VE AbortError da DEĞİLSE (gerçek bir ağ
  // hatası gibi), önceki davranış korunuyor: retry edilebilir
  // varsayılır (geçici ağ sorunları için doğru davranış).
  return true;
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
          // bkz. Sprint 10.10, GERÇEK KÖK NEDEN DÜZELTMESİ.
          // `thoughtSignature`, `functionCall`'ın KENDİSİNİN bir
          // alanı DEĞİL, `Part`'ın (functionCall ile KARDEŞ) bir
          // alanı — resmi tip tanımlarından doğrulandı. Bu yüzden
          // ayrı bir Part alanı olarak (functionCall'ın YANINA, İÇİNE
          // DEĞİL) ekleniyor.
          const part: Part = { functionCall: { name: call.toolName, args: call.arguments } };
          if (call.thoughtSignature) {
            part.thoughtSignature = call.thoughtSignature;
          }
          parts.push(part);
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
    // bkz. Sprint 10.10, Madde 5 — "Gerçekten kullanılan API Key nasıl
    // doğrulandı? Maskeli göster." Kod seviyesinde TEK bir sabit
    // SecureStorage anahtarı var (`SecureStorageKey.GEMINI_API_KEY`) —
    // bu maskeli kayıt, kullanıcının gerçek cihazda "aynı anahtar mı
    // kullanılıyor" sorusunu, anahtarı ifşa etmeden doğrulamasını sağlar.
    aiDiagnostics.recordApiKeyMasked(apiKey);
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
    logAiStage("Request Created (sendMessage)");
    aiDiagnostics.recordProvider(this.providerName);
    aiDiagnostics.recordModel(GEMINI_MODEL);
    try {
      const apiKey = await this.getApiKey();
      const client = new GoogleGenAI({ apiKey });
      aiDiagnostics.recordStage("request_prepared");
      logAiStage("Provider Created");

      aiDiagnostics.recordStage("request_sent");
      logAiStage("Gemini Request Started");
      const response = await callGeminiWithRetry(() => {
        aiDiagnostics.recordStage("awaiting_response");
        const { controller, timeoutHandle } = createRequestAbortController();
        return client.models
          .generateContent({
            model: GEMINI_MODEL,
            contents: buildContents(messages, options.pendingToolResults),
            config: {
              systemInstruction: options.systemInstruction,
              tools: buildTools(options.tools),
              // bkz. Sprint 10.11 — `httpOptions.timeout` KANITLANMIŞ
              // olarak çalışmıyor (bkz. yukarıdaki dosya-seviyesi not).
              // Gerçek iptal mekanizması `abortSignal`.
              abortSignal: controller.signal,
            },
          })
          .finally(() => clearTimeout(timeoutHandle));
      });
      logAiStage("Gemini Response Received");
      aiDiagnostics.recordStage("response_received");

      // bkz. Sprint 10.10, GERÇEK KÖK NEDEN DÜZELTMESİ (kesin kanıtla
      // doğrulandı — bkz. `AIToolCallRequest.thoughtSignature`'ın
      // belgesi). ÖNCEDEN `response.functionCalls` (SDK'nın kendi
      // "convenience" getter'ı, SADECE `FunctionCall[]` döner) kullanılıyordu
      // — bu, `thoughtSignature`'ı (bir `Part` alanı, `FunctionCall`'ın
      // DEĞİL) YAPISAL OLARAK YAKALAYAMAZ (resmi tip tanımlarından
      // doğrulandı: `functionCalls` getter'ı `FunctionCall[]` döner,
      // `Part[]` değil). DÜZELTME: artık `response.candidates[0].content.parts`
      // doğrudan okunuyor — her `functionCall` Part'ının kendi
      // `thoughtSignature`'ı (varsa) BİRLİKTE çıkarılıyor.
      const responseParts = response.candidates?.[0]?.content?.parts ?? [];
      const toolCalls: AIToolCallRequest[] = responseParts
        .filter((part): part is typeof part & { functionCall: NonNullable<typeof part.functionCall> } =>
          Boolean(part.functionCall?.name)
        )
        .map((part) => ({
          toolName: part.functionCall.name as string,
          arguments: part.functionCall.args ?? {},
          thoughtSignature: part.thoughtSignature,
        }));

      // bkz. Sprint 10.10, Madde 7-8 — "Tool seçildi mi? Hangi tool?"
      aiDiagnostics.recordToolCallsRequested(
        toolCalls.map((c) => ({ name: c.toolName, hasThoughtSignature: Boolean(c.thoughtSignature) }))
      );
      if (toolCalls.length > 0) {
        logAiStage(`Tool Selected: ${toolCalls.map((c) => c.toolName).join(", ")}`);
      }

      aiDiagnostics.recordStage("parsed");
      aiDiagnostics.finishRequest();
      logAiStage("Final Response Ready (sendMessage)");
      return {
        text: response.text ?? null,
        toolCalls,
      };
    } catch (error) {
      logAiStage(`Request Failed — ${error instanceof Error ? error.name : "UnknownError"}`);
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
    logAiStage("Request Created (analyzeImage)");
    aiDiagnostics.recordProvider(this.providerName);
    aiDiagnostics.recordModel(GEMINI_MODEL);
    // bkz. Sprint 10.7, Madde 8 — "Fotoğraf boyutu / Base64 boyutu."
    // `imageBase64.length` karakter sayısı = byte sayısı (base64
    // ASCII karakterlerden oluşur, UTF-16 çift-byte riski YOK).
    // Orijinal dosya boyutu, base64'ün ~%75'i (4 karakter -> 3 byte).
    const base64SizeBytes = imageBase64.length;
    const estimatedFileSizeBytes = Math.round(base64SizeBytes * 0.75);
    aiDiagnostics.recordPhotoSizes(estimatedFileSizeBytes, base64SizeBytes);
    logAiStage(`Photo Size: ~${(estimatedFileSizeBytes / 1024 / 1024).toFixed(2)}MB (base64: ${(base64SizeBytes / 1024 / 1024).toFixed(2)}MB)`);

    try {
      const apiKey = await this.getApiKey();
      const client = new GoogleGenAI({ apiKey });
      aiDiagnostics.recordStage("request_prepared");
      logAiStage("Provider Created");

      aiDiagnostics.recordStage("request_sent");
      logAiStage("Gemini Request Started");
      const response = await callGeminiWithRetry(() => {
        aiDiagnostics.recordStage("awaiting_response");
        const { controller, timeoutHandle } = createRequestAbortController();
        return client.models
          .generateContent({
            model: GEMINI_MODEL,
            contents: [
              {
                role: "user",
                parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }],
              },
            ],
            // bkz. Sprint 10.11 — `httpOptions.timeout` KANITLANMIŞ
            // olarak çalışmıyor (bkz. dosya-seviyesi not). Gerçek
            // iptal mekanizması `abortSignal`.
            config: { systemInstruction, abortSignal: controller.signal },
          })
          .finally(() => clearTimeout(timeoutHandle));
      });
      logAiStage("Gemini Response Received");
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
      logAiStage("Final Response Ready (analyzeImage)");
      return response.text;
    } catch (error) {
      logAiStage(`Request Failed — ${error instanceof Error ? error.name : "UnknownError"}`);
      aiDiagnostics.recordRawError(error);
      aiDiagnostics.finishRequest();
      throw error;
    }
  }
}

export const geminiProvider: AIProvider = new GeminiProvider();
