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
