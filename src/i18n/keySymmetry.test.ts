/**
 * i18n Anahtar Simetri Denetimi
 * ================================
 * bkz. Sprint 7.2 (APK öncesi kalite kontrolleri). GERÇEK bir boşluk
 * bulundu: EN/TR çeviri dosyalarının aynı anahtar kümesine sahip
 * olduğunu doğrulayan HİÇBİR otomatik test yoktu — 30+ sprint
 * boyunca manuel disiplinle (her ekleme çift dilde yapıldı) korundu,
 * ama bu, otomatik bir GÜVENCE değildi. Bu test, "yetim anahtar"
 * (bir dilde var, diğerinde yok) durumunu KALICI olarak engeller.
 */

import { describe, expect, it } from "vitest";
import en from "./locales/en/common.json";
import tr from "./locales/tr/common.json";

/** İç içe geçmiş bir çeviri nesnesini "a.b.c" formatında düz bir anahtar dizisine çevirir. */
function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe("i18n — EN/TR Anahtar Simetrisi", () => {
  it("EN'de olup TR'de OLMAYAN hiçbir anahtar yok", () => {
    const enKeys = new Set(flattenKeys(en));
    const trKeys = new Set(flattenKeys(tr));

    const missingInTr = [...enKeys].filter((key) => !trKeys.has(key));

    expect(missingInTr).toEqual([]);
  });

  it("TR'de olup EN'de OLMAYAN hiçbir anahtar yok", () => {
    const enKeys = new Set(flattenKeys(en));
    const trKeys = new Set(flattenKeys(tr));

    const missingInEn = [...trKeys].filter((key) => !enKeys.has(key));

    expect(missingInEn).toEqual([]);
  });

  it("hiçbir anahtarın değeri BOŞ string değil (her iki dilde de)", () => {
    function findEmptyValues(obj: unknown, prefix = ""): string[] {
      if (typeof obj === "string") {
        return obj.trim() === "" ? [prefix] : [];
      }
      if (typeof obj !== "object" || obj === null) {
        return [];
      }
      return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
        findEmptyValues(value, prefix ? `${prefix}.${key}` : key)
      );
    }

    expect(findEmptyValues(en)).toEqual([]);
    expect(findEmptyValues(tr)).toEqual([]);
  });
});
