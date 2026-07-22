import { describe, expect, it } from "vitest";
import { mapDataManagementError } from "./mapDataManagementError";
import { ErrorCode } from "./errorCodes";

describe("mapDataManagementError", () => {
  it("GEÇERLİ bir DM_XXX kodu STRİNG olarak verilirse, OLDUĞU gibi döner", () => {
    expect(mapDataManagementError("DM_002")).toBe(ErrorCode.DM_002);
    expect(mapDataManagementError("DM_005")).toBe(ErrorCode.DM_005);
  });

  it("BİLİNMEYEN bir string VERİLİRSE, SYS_001'e düşer", () => {
    expect(mapDataManagementError("DM_999")).toBe(ErrorCode.SYS_001);
  });

  it("GERÇEK bir Error nesnesi VERİLİRSE, SYS_001'e düşer (servis katmanının ÖNGÖRMEDİĞİ durum)", () => {
    expect(mapDataManagementError(new Error("beklenmeyen bir hata"))).toBe(ErrorCode.SYS_001);
  });

  it("null/undefined VERİLİRSE, çökmeden SYS_001'e düşer", () => {
    expect(mapDataManagementError(null)).toBe(ErrorCode.SYS_001);
    expect(mapDataManagementError(undefined)).toBe(ErrorCode.SYS_001);
  });
});
