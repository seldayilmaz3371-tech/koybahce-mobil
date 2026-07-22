/**
 * aiDiagnostics.ts — Merkezi AI Teşhis Kaydedici
 * ==================================================
 * bkz. Sprint 10.7 (AI Diagnostic Build). AMAÇ: Kullanıcının gerçek
 * cihazda yaşadığı iki hatayı (AI Sohbet'te genel "Bir şeyler ters
 * gitti" mesajı, Fotoğraf Analizi'nde sonsuz bekleme) KESİN TEKNİK
 * KANITLA teşhis etmek — TAHMİN değil.
 *
 * TASARIM KARARI (bilinçli sadelik): Kalıcı saklama YOK — bu, SADECE
 * "SON isteğin" anlık görüntüsünü bellekte tutan bir singleton.
 * Migration/repository GEREKMEDİ çünkü bu veri tanım gereği geçicidir
 * (bir sonraki istek, önceki teşhis verisinin üzerine yazar) — Sprint
 * 9.1'in "necessity analizi" ile AYNI mantık (kalıcılığın TEK gerçek
 * tüketicisi olmadığı sürece, KALICI SAKLAMA YOK).
 *
 * GÖRÜNÜRLÜK: Bu modülün KENDİSİ her zaman veri kaydeder (maliyeti
 * düşük — sadece bellek nesnesi güncelleme). Kullanıcıya GÖSTERİLİP
 * GÖSTERİLMEMESİ, `AiDiagnosticScreen`'in `settings.debugMode`
 * kontrolüne bağlıdır (bkz. o dosyanın kendi notu) — Release
 * kullanıcıları bu ekrana hiç erişemez, ama diagnostic veri kaydı
 * KENDİSİ devre dışı bırakılmaz (ihtiyaç anında hemen kullanılabilir
 * olması için — kapatıp açmak gerektirmez).
 */

export type AiRequestStage =
  | "idle"
  | "provider_obtained"
  | "request_prepared"
  | "request_sent"
  | "awaiting_response"
  | "response_received"
  | "parsed"
  | "ui_updated"
  | "error"
  | "timeout";

export interface AiDiagnosticSnapshot {
  /** bkz. Sprint 10.9. Her isteğin kısa, benzersiz bir kimliği — kullanıcının aynı anda birden fazla isteği (ör. hızlı ard arda gönderme) birbirinden ayırt edebilmesi için. */
  requestId: string | null;
  /** "empty" = kullanıcı hiç girmemiş, "configured" = SecureStorage'da bir değer var (GEÇERLİLİĞİ doğrulanmadı — sadece VARLIĞI). */
  apiKeyStatus: "empty" | "configured" | "unknown";
  providerName: string | null;
  /** bkz. Sprint 10.9 — GERÇEK istekte kullanılan model adı (ör. "gemini-flash-latest"). */
  model: string | null;
  stage: AiRequestStage;
  httpStatusCode: number | null;
  /** GERÇEK `ApiError` nesnesinin (varsa) ham alanları — mapAiError'ın YORUMU değil, SDK'nın kendi verdiği HAM veri. */
  rawError: {
    message: string;
    status: number | null;
    name: string;
    stack: string | null;
  } | null;
  /** mapAiError()'ın bu ham hatayı hangi ErrorCode'a çevirdiği — Madde 10. */
  mappedErrorCode: string | null;
  requestStartedAt: number | null;
  requestEndedAt: number | null;
  durationMs: number | null;
  timedOut: boolean;
  retryCount: number;
  /** Sadece Fotoğraf Analizi akışında dolu. */
  photo: {
    fileSizeBytes: number | null;
    base64SizeBytes: number | null;
  } | null;
}

function emptySnapshot(): AiDiagnosticSnapshot {
  return {
    requestId: null,
    apiKeyStatus: "unknown",
    providerName: null,
    model: null,
    stage: "idle",
    httpStatusCode: null,
    rawError: null,
    mappedErrorCode: null,
    requestStartedAt: null,
    requestEndedAt: null,
    durationMs: null,
    timedOut: false,
    retryCount: 0,
    photo: null,
  };
}

let current: AiDiagnosticSnapshot = emptySnapshot();
let requestCounter = 0;

export const aiDiagnostics = {
  /**
   * Yeni bir isteğe başlarken ÖNCEKİ isteğin verisini temizler.
   *
   * bkz. Sprint 10.9, GERÇEK BULGU (kullanıcının gerçek cihaz
   * testlerinde "Stage hiçbir zaman değişmiyor, hep idle kalıyor"
   * gözlemiyle KANITLANDI): ÖNCEDEN bu fonksiyon SADECE
   * `GeminiProvider.sendMessage()`/`analyzeImage()`'ın İÇİNDE
   * çağrılıyordu. Ama `getActiveAiProvider()`'ın kendi izin kontrolü
   * (AI_NOT_ENABLED/AI_INTERNET_PERMISSION_DENIED/
   * AI_PROVIDER_NOT_REGISTERED) BAŞARISIZ olduğunda, akış
   * `GeminiProvider`'a HİÇ ULAŞAMIYORDU — bu yüzden `stage` HER ZAMAN
   * "idle" kalıyordu, kullanıcı gerçek nedeni GÖREMİYORDU. DÜZELTME:
   * artık `getActiveAiProvider()`'ın KENDİSİ de bu fonksiyonu
   * çağırıyor (bkz. o dosyanın güncellenmiş kodu) — izin kontrolü
   * başarısız olsa bile stage artık `idle`'da TAKILI KALMIYOR.
   */
  startNewRequest(): void {
    requestCounter += 1;
    current = emptySnapshot();
    current.requestId = `req-${Date.now()}-${requestCounter}`;
    current.requestStartedAt = Date.now();
    current.stage = "provider_obtained";
  },

  recordApiKeyStatus(status: "empty" | "configured"): void {
    current.apiKeyStatus = status;
  },

  recordProvider(providerName: string): void {
    current.providerName = providerName;
  },

  recordModel(model: string): void {
    current.model = model;
  },

  recordStage(stage: AiRequestStage): void {
    current.stage = stage;
  },

  recordRetry(): void {
    current.retryCount += 1;
  },

  recordPhotoSizes(fileSizeBytes: number, base64SizeBytes: number): void {
    current.photo = { fileSizeBytes, base64SizeBytes };
  },

  /** GERÇEK `ApiError` (ya da herhangi bir hata) nesnesinin HAM alanlarını kaydeder — Madde 5. */
  recordRawError(error: unknown): void {
    const isApiError = error instanceof Error;
    const statusValue =
      isApiError && "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : null;
    const errorName = isApiError ? error.name : "UnknownError";
    current.rawError = {
      message: isApiError ? error.message : String(error),
      status: statusValue,
      name: errorName,
      stack: isApiError ? (error.stack ?? null) : null,
    };
    current.httpStatusCode = statusValue;
    // bkz. Sprint 10.7, Madde 8 — "Timeout oluştu mu?" GERÇEK JavaScript/
    // Node.js standart davranışı: bir istek `AbortController`/SDK
    // timeout'u tarafından iptal edildiğinde, fırlatılan hatanın `name`
    // alanı standart olarak "AbortError" veya "TimeoutError" olur —
    // bu bir VARSAYIM değil, DOM/Node standardı (MDN: AbortSignal
    // "reason" belgesi). Eşleşmezse `timedOut` false kalır — TAHMİN
    // yürütülmez, sadece GERÇEKTEN gözlemlenen isim kaydedilir.
    if (errorName === "AbortError" || errorName === "TimeoutError") {
      current.timedOut = true;
    }
    current.stage = "error";
  },

  recordMappedErrorCode(code: string): void {
    current.mappedErrorCode = code;
  },

  recordTimeout(): void {
    current.timedOut = true;
    current.stage = "timeout";
  },

  finishRequest(): void {
    current.requestEndedAt = Date.now();
    if (current.requestStartedAt !== null) {
      current.durationMs = current.requestEndedAt - current.requestStartedAt;
    }
  },

  getSnapshot(): AiDiagnosticSnapshot {
    return { ...current };
  },

  reset(): void {
    current = emptySnapshot();
  },
};
