import { describe, expect, it } from "vitest";
import { dateInputValueToIso, isoToDateInputValue, todayAsDateInputValue } from "./dateInputConversion";

describe("dateInputValueToIso", () => {
  it("YYYY-MM-DD'yi gece yarısı UTC ISO string'ine çevirir", () => {
    expect(dateInputValueToIso("2026-03-15")).toBe("2026-03-15T00:00:00.000Z");
  });
});

describe("isoToDateInputValue", () => {
  it("ISO string'ten sadece tarih kısmını (YYYY-MM-DD) çıkarır", () => {
    expect(isoToDateInputValue("2026-03-15T14:23:45.123Z")).toBe("2026-03-15");
  });
});

describe("todayAsDateInputValue", () => {
  it("bugünün tarihini YYYY-MM-DD formatında döner", () => {
    const result = todayAsDateInputValue();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe("gidiş-dönüş dönüşümü", () => {
  it("dateInputValueToIso -> isoToDateInputValue orijinal değeri korur", () => {
    expect(isoToDateInputValue(dateInputValueToIso("2026-07-04"))).toBe("2026-07-04");
  });
});
