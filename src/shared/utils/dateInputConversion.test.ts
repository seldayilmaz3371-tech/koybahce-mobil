import { describe, expect, it } from "vitest";
import {
  combineDateAndTimeToIso,
  dateInputValueToIso,
  isoToDateInputValue,
  isoToTimeInputValue,
  nowAsDateInputValue,
  nowAsTimeInputValue,
  todayAsDateInputValue,
} from "./dateInputConversion";

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

describe("combineDateAndTimeToIso (Sprint 10.4)", () => {
  it("YEREL tarih+saat girdisini GERÇEK bir UTC ISO timestamp'e çevirir (Z etiketini YANLIŞLIKLA yerel değere yapıştırmaz)", () => {
    const iso = combineDateAndTimeToIso("2026-07-19", "08:00");

    // Sonuç GERÇEKTEN geçerli bir ISO 8601 UTC timestamp OLMALI.
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // Yerel 08:00'i GERİ ÇEVİRDİĞİMİZDE (isoToTimeInputValue ile) AYNI "08:00" GELMELİ —
    // bu, GİDİŞ-DÖNÜŞ tutarlılığının GERÇEK kanıtı (saat dilimi kayması OLMADIĞININ kanıtı).
    expect(isoToTimeInputValue(iso)).toBe("08:00");
  });

  it("gidiş-dönüş: combineDateAndTimeToIso -> isoToTimeInputValue orijinal saati KORUR (saat dilimi kayması YOK)", () => {
    const testCases = ["00:00", "06:15", "12:30", "23:59"];
    for (const time of testCases) {
      const iso = combineDateAndTimeToIso("2026-01-15", time);
      expect(isoToTimeInputValue(iso)).toBe(time);
    }
  });

  it("gidiş-dönüş: combineDateAndTimeToIso -> isoToDateInputValue orijinal tarihi KORUR", () => {
    const iso = combineDateAndTimeToIso("2026-07-19", "14:30");
    // Not: isoToDateInputValue HAM UTC tarih kısmını alır (Finans'ın
    // mevcut, DEĞİŞTİRİLMEYEN deseni) — gün sınırına YAKIN saatlerde
    // (ör. gece yarısına çok yakın) UTC/yerel FARKI teorik olarak
    // tarihi KAYDIRABİLİR, ama GÜNDÜZ saatlerinde (test senaryosu)
    // bu risk YOK.
    expect(isoToDateInputValue(iso)).toBe("2026-07-19");
  });
});

describe("nowAsTimeInputValue / nowAsDateInputValue (Sprint 10.4)", () => {
  it("nowAsTimeInputValue HH:MM formatında GERÇEK bir değer döner", () => {
    const result = nowAsTimeInputValue();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("nowAsDateInputValue YYYY-MM-DD formatında GERÇEK bir değer döner (yerel tarih)", () => {
    const result = nowAsDateInputValue();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
