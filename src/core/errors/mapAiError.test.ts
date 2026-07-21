import { describe, expect, it } from "vitest";
import { mapAiError } from "./mapAiError";
import { ErrorCode } from "./errorCodes";

describe("mapAiError", () => {
  it("AI_NOT_ENABLED -> AI_001", () => {
    expect(mapAiError(new Error("AI_NOT_ENABLED"))).toBe(ErrorCode.AI_001);
  });

  it("AI_INTERNET_PERMISSION_DENIED -> AI_002", () => {
    expect(mapAiError(new Error("AI_INTERNET_PERMISSION_DENIED"))).toBe(ErrorCode.AI_002);
  });

  it("AI_PROVIDER_NOT_REGISTERED -> AI_003", () => {
    expect(mapAiError(new Error("AI_PROVIDER_NOT_REGISTERED"))).toBe(ErrorCode.AI_003);
  });

  it("AI_PROVIDER_API_KEY_NOT_CONFIGURED -> AI_004", () => {
    expect(mapAiError(new Error("AI_PROVIDER_API_KEY_NOT_CONFIGURED"))).toBe(ErrorCode.AI_004);
  });

  it("AI_PHOTO_ANALYSIS_EMPTY_RESPONSE -> AI_005", () => {
    expect(mapAiError(new Error("AI_PHOTO_ANALYSIS_EMPTY_RESPONSE"))).toBe(ErrorCode.AI_005);
  });

  it("bilinmeyen bir hata SYS_001'e düşer (fallback)", () => {
    expect(mapAiError(new Error("hiç bilinmeyen bir hata"))).toBe(ErrorCode.SYS_001);
  });
});

describe("mapAiError — Sprint 10.6 (Gerçek Gemini Hata Kodlarının Ayrıştırılması)", () => {
  it("401 (kimlik doğrulama) -> AI_006", () => {
    expect(mapAiError(new Error('{"error":{"code":401,"message":"API key not valid"}}'))).toBe(ErrorCode.AI_006);
  });

  it("403 (yetki reddi) -> AI_006 (401 ile AYNI kod — ikisi de kimlik doğrulama sorunu)", () => {
    expect(mapAiError(new Error('{"error":{"code":403,"message":"Permission denied"}}'))).toBe(ErrorCode.AI_006);
  });

  it("RESOURCE_EXHAUSTED (kota tükenmesi) -> AI_007", () => {
    expect(mapAiError(new Error('{"error":{"status":"RESOURCE_EXHAUSTED"}}'))).toBe(ErrorCode.AI_007);
  });

  it("RESOURCE_EXHAUSTED, 429 durum koduyla BİRLİKTE gelse bile AI_007'ye düşer (AI_008'e DEĞİL) — sıralama testi", () => {
    expect(mapAiError(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'))).toBe(ErrorCode.AI_007);
  });

  it("SADECE 429 (RESOURCE_EXHAUSTED OLMADAN) -> AI_008 (geçici rate limit)", () => {
    expect(mapAiError(new Error('{"error":{"code":429,"message":"Too many requests"}}'))).toBe(ErrorCode.AI_008);
  });

  it("400 (geçersiz istek) -> AI_009", () => {
    expect(mapAiError(new Error('{"error":{"code":400,"message":"Invalid argument"}}'))).toBe(ErrorCode.AI_009);
  });

  it("Ağ hatası (tarayıcının GERÇEK standart hata mesajı) -> AI_010", () => {
    expect(mapAiError(new TypeError("Failed to fetch"))).toBe(ErrorCode.AI_010);
  });

  it("Timeout (AbortError) -> AI_011", () => {
    expect(mapAiError(new Error("AbortError: request timeout"))).toBe(ErrorCode.AI_011);
  });

  it("AI_TOOL_NOT_FOUND (model var olmayan bir araç istedi) -> AI_012", () => {
    expect(mapAiError(new Error("AI_TOOL_NOT_FOUND: hayaliArac"))).toBe(ErrorCode.AI_012);
  });
});

describe("mapAiError — Sprint 10.7 (Diagnostic Kaydı — Madde 10)", () => {
  it("mapAiError() ÇAĞRILDIĞINDA, aiDiagnostics GERÇEKTEN hangi kodun seçildiğini kaydeder", async () => {
    const { aiDiagnostics } = await import("../../modules/ai/diagnostics/aiDiagnostics");
    aiDiagnostics.reset();

    mapAiError(new Error("AI_NOT_ENABLED"));

    expect(aiDiagnostics.getSnapshot().mappedErrorCode).toBe(ErrorCode.AI_001);
  });

  it("mapAiError() SYS_001'e (fallback) düştüğünde de BUNU GERÇEKTEN kaydeder", async () => {
    const { aiDiagnostics } = await import("../../modules/ai/diagnostics/aiDiagnostics");
    aiDiagnostics.reset();

    mapAiError(new Error("hiç tanınmayan bir hata"));

    expect(aiDiagnostics.getSnapshot().mappedErrorCode).toBe(ErrorCode.SYS_001);
  });
});
