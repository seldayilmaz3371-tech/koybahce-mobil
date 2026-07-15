/**
 * Modül 3 — Statik Mimari Uyumluluk Testleri (Sprint 3.9, Madde 6/9)
 * =====================================================================
 * Bu testler, kaynak kodun KENDİSİNİ tarayarak (çalışma zamanı
 * davranışı değil, statik metin analizi) mimari ilkelerin ihlal
 * edilmediğini kanıtlıyor. "Offline çalışıyor" gibi bir iddia için en
 * güçlü kanıt, ağ çağrısının YAPISAL OLARAK hiç var olmadığını
 * göstermektir.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = join(__dirname, "..");

function walkSourceFiles(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkSourceFiles(fullPath, results);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

const PRODUCTION_FILES = walkSourceFiles(SRC_ROOT);

describe("Modül 3 — Offline-First Statik Doğrulaması (Sprint 3.9, Madde 6)", () => {
  it("hiçbir üretim dosyasında ağ çağrısı (fetch/axios/XMLHttpRequest) yok", () => {
    const networkCallPattern = /\bfetch\s*\(|\baxios\b|XMLHttpRequest/;
    const offenders: string[] = [];

    for (const file of PRODUCTION_FILES) {
      const content = readFileSync(file, "utf-8");
      if (networkCallPattern.test(content)) {
        offenders.push(file.replace(SRC_ROOT, "src"));
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("Modül 3 — Soft-Delete-Only Statik Doğrulaması (Sprint 3.9, Madde 9 — Dijital Bahçe Hafızası)", () => {
  it("hiçbir repository'de fiziksel 'DELETE FROM' SQL ifadesi yok (deactivate/soft-delete dışında)", () => {
    const physicalDeletePattern = /DELETE\s+FROM/i;
    const offenders: string[] = [];

    const repositoryFiles = PRODUCTION_FILES.filter((f) => f.includes("repository") && !f.includes("base.repository"));

    for (const file of repositoryFiles) {
      const content = readFileSync(file, "utf-8");
      if (physicalDeletePattern.test(content)) {
        offenders.push(file.replace(SRC_ROOT, "src"));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("fotoğraf dosyaları hiçbir zaman native görsel işleme API'siyle değiştirilmiyor (sadece Filesystem.copy)", () => {
    const content = readFileSync(join(SRC_ROOT, "native/filesystem.ts"), "utf-8");
    // editPhoto/editURIPhoto (Camera plugin'in görsel DÜZENLEME API'si)
    // hiç kullanılmamalı — sadece copy() (ham kopyalama).
    expect(content).not.toMatch(/editPhoto|editURIPhoto/);
    expect(content).toMatch(/Filesystem\.copy/);
  });
});
