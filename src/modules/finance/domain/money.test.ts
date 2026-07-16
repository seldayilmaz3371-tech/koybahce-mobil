import { describe, expect, it } from "vitest";
import { toMinorUnits, toMajorUnits } from "./money";

describe("toMinorUnits", () => {
  it("TL tutarını doğru kuruşa çevirir (temel durumlar)", () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(1500.5)).toBe(150050);
    expect(toMinorUnits(0.1)).toBe(10);
    expect(toMinorUnits(250.75)).toBe(25075);
  });

  it("KRİTİK — Math.round olmadan hatalı sonuç verecek değerlerde bile DOĞRU sonuç üretir", () => {
    // Bu deger, JS'te ham `* 100` ile 1998.9999999999998 verir — eğer
    // Math.round olmasaydı (ör. Math.floor veya doğrudan Number()
    // dönüşümü kullanılsaydı), sonuç 1998 (YANLIŞ) olurdu.
    expect(toMinorUnits(19.99)).toBe(1999);
    // Ham JS ifadesiyle karşılaştırarak, bu testin gerçekten neyi
    // kanıtladığını doğruluyoruz:
    expect(19.99 * 100).not.toBe(1999); // ham ifade YANLIŞ (float hatası)
    expect(Math.floor(19.99 * 100)).not.toBe(1999); // Math.floor de YANLIŞ olurdu
  });

  it("tam sayı TL tutarlarında da doğru çalışır", () => {
    expect(toMinorUnits(100)).toBe(10000);
    expect(toMinorUnits(0)).toBe(0);
  });
});

describe("toMajorUnits", () => {
  it("kuruşu doğru TL'ye çevirir", () => {
    expect(toMajorUnits(1999)).toBe(19.99);
    expect(toMajorUnits(150050)).toBe(1500.5);
    expect(toMajorUnits(0)).toBe(0);
  });
});

describe("toMinorUnits ↔ toMajorUnits round-trip", () => {
  it("gidiş-dönüş dönüşümü orijinal değeri korur (yaygın TL tutarlarında)", () => {
    const amounts = [19.99, 1500.5, 0.1, 250.75, 999.99, 100, 1234.56];
    for (const amount of amounts) {
      expect(toMajorUnits(toMinorUnits(amount))).toBeCloseTo(amount, 2);
    }
  });
});
