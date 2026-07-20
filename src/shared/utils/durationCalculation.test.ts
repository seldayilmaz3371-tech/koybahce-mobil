import { describe, expect, it } from "vitest";
import { calculateDuration } from "./durationCalculation";

describe("calculateDuration (Sprint 10.4)", () => {
  it("kullanıcının kendi örneğini GERÇEKTEN doğru hesaplar: 06:15 -> 08:05 = 1 saat 50 dakika", () => {
    const result = calculateDuration("06:15", "08:05");

    expect(result).toEqual({ hours: 1, minutes: 50 });
  });

  it("tam saatlik bir aralığı doğru hesaplar", () => {
    expect(calculateDuration("06:00", "08:00")).toEqual({ hours: 2, minutes: 0 });
  });

  it("60 dakikadan az bir aralığı doğru hesaplar (0 saat)", () => {
    expect(calculateDuration("06:00", "06:45")).toEqual({ hours: 0, minutes: 45 });
  });

  it("başlangıç ve bitiş AYNIYSA null döner (0 dakikalık bir sulama anlamsız)", () => {
    expect(calculateDuration("06:00", "06:00")).toBeNull();
  });

  it("bitiş, başlangıçtan ÖNCEYSE null döner (gece yarısını geçen senaryo desteklenmiyor — bilinçli sınır)", () => {
    expect(calculateDuration("22:00", "02:00")).toBeNull();
  });

  it("gün sonuna yakın bir aralığı doğru hesaplar", () => {
    expect(calculateDuration("23:00", "23:59")).toEqual({ hours: 0, minutes: 59 });
  });
});
