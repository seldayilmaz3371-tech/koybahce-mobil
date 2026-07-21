import { beforeEach, describe, expect, it } from "vitest";
import { aiDiagnostics } from "./aiDiagnostics";

describe("aiDiagnostics", () => {
  beforeEach(() => {
    aiDiagnostics.reset();
  });

  it("startNewRequest() ÖNCEKİ isteğin verisini GERÇEKTEN temizler", () => {
    aiDiagnostics.recordApiKeyStatus("configured");
    aiDiagnostics.recordProvider("gemini");
    aiDiagnostics.recordStage("response_received");

    aiDiagnostics.startNewRequest();

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.apiKeyStatus).toBe("unknown");
    expect(snapshot.providerName).toBeNull();
    expect(snapshot.stage).toBe("provider_obtained");
    expect(snapshot.requestStartedAt).not.toBeNull();
  });

  it("recordApiKeyStatus GERÇEK durumu kaydeder", () => {
    aiDiagnostics.recordApiKeyStatus("empty");
    expect(aiDiagnostics.getSnapshot().apiKeyStatus).toBe("empty");

    aiDiagnostics.recordApiKeyStatus("configured");
    expect(aiDiagnostics.getSnapshot().apiKeyStatus).toBe("configured");
  });

  it("recordStage, İSTEĞİN hangi aşamada olduğunu GERÇEKTEN kaydeder", () => {
    aiDiagnostics.recordStage("request_prepared");
    expect(aiDiagnostics.getSnapshot().stage).toBe("request_prepared");

    aiDiagnostics.recordStage("awaiting_response");
    expect(aiDiagnostics.getSnapshot().stage).toBe("awaiting_response");
  });

  it("recordRetry, GERÇEK deneme sayısını ARTIRIR (kümülatif)", () => {
    aiDiagnostics.recordRetry();
    aiDiagnostics.recordRetry();

    expect(aiDiagnostics.getSnapshot().retryCount).toBe(2);
  });

  it("recordPhotoSizes, dosya/base64 boyutlarını GERÇEKTEN kaydeder", () => {
    aiDiagnostics.recordPhotoSizes(1_500_000, 2_000_000);

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.photo).toEqual({ fileSizeBytes: 1_500_000, base64SizeBytes: 2_000_000 });
  });

  it("recordRawError, GERÇEK Error nesnesinin TÜM önemli alanlarını (message/status/name/stack) kaydeder", () => {
    class FakeApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
      }
    }
    const error = new FakeApiError("API key not valid. Please pass a valid API key.", 400);

    aiDiagnostics.recordRawError(error);

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.rawError?.message).toBe("API key not valid. Please pass a valid API key.");
    expect(snapshot.rawError?.status).toBe(400);
    expect(snapshot.rawError?.name).toBe("ApiError");
    expect(snapshot.rawError?.stack).not.toBeNull();
    expect(snapshot.httpStatusCode).toBe(400);
    expect(snapshot.stage).toBe("error");
  });

  it("recordRawError, error.name 'AbortError' İSE timedOut'u GERÇEKTEN true yapar (JS'in kendi standardı, varsayım DEĞİL)", () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";

    aiDiagnostics.recordRawError(abortError);

    expect(aiDiagnostics.getSnapshot().timedOut).toBe(true);
  });

  it("recordRawError, normal bir hata İÇİN timedOut'u false BIRAKIR (TAHMİN yürütülmez)", () => {
    aiDiagnostics.recordRawError(new Error("normal hata"));

    expect(aiDiagnostics.getSnapshot().timedOut).toBe(false);
  });

  it("recordMappedErrorCode, mapAiError'ın hangi koda karar verdiğini GERÇEKTEN kaydeder", () => {
    aiDiagnostics.recordMappedErrorCode("AI_006");

    expect(aiDiagnostics.getSnapshot().mappedErrorCode).toBe("AI_006");
  });

  it("finishRequest, GERÇEK süreyi (ms) hesaplar", async () => {
    aiDiagnostics.startNewRequest();
    await new Promise((resolve) => setTimeout(resolve, 20));

    aiDiagnostics.finishRequest();

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.durationMs).not.toBeNull();
    expect(snapshot.durationMs!).toBeGreaterThanOrEqual(15);
  });

  it("getSnapshot, DIŞARIDAN mutasyona karşı KORUNMUŞ bir kopya döner (iç state doğrudan değiştirilemez)", () => {
    const snapshot = aiDiagnostics.getSnapshot();
    snapshot.apiKeyStatus = "configured";

    expect(aiDiagnostics.getSnapshot().apiKeyStatus).toBe("unknown");
  });
});
