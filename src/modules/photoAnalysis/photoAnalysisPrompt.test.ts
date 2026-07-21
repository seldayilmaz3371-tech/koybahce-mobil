/**
 * photoAnalysisPrompt.test.ts
 * ==============================
 * bkz. Sprint 10.6 (Production Ready, Öncelik 5). GERÇEK BULGU: bu
 * promptun içeriğini DOĞRUDAN doğrulayan hiçbir test yoktu (sadece
 * dolaylı olarak usePhotoAnalysis/PhotoAnalysisScreen testleri
 * üzerinden çağrılıyordu, metnin İÇERİĞİ hiç kontrol edilmiyordu).
 * Bu testler, HEM güvenlik sınırlarının (yasakların) HEM yeni eklenen
 * gözlem rehberliğinin metinde GERÇEKTEN var olduğunu kanıtlıyor —
 * gelecekte biri bu sınırları yanlışlıkla kaldırırsa, bu testler
 * bunu yakalar (regresyon koruması).
 */

import { describe, expect, it } from "vitest";
import { buildPhotoAnalysisSystemPrompt } from "./photoAnalysisPrompt";

describe("buildPhotoAnalysisSystemPrompt — Güvenlik Sınırları (Sprint 9.2'den korunuyor)", () => {
  it("KESİN teşhis YASAĞINI içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("Do NOT provide a definitive diagnosis");
  });

  it("tedavi/ilaç ÖNERİSİ YASAĞINI içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("Do NOT recommend any treatment");
  });

  it("karşılaştırmalı analiz YASAĞINI içerir (tek fotoğraf sınırı)", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("Do NOT compare this photo to any previous photo");
  });

  it("profesyonel teşhisin YERİNE GEÇMEDİĞİ uyarısını içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("NOT a substitute for professional diagnosis");
  });
});

describe("buildPhotoAnalysisSystemPrompt — Gözlem Kalitesi Rehberliği (Sprint 10.6, Öncelik 5)", () => {
  it("yaprak/dal/meyve gözlem kategorilerini içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("leaves are visible");
    expect(prompt).toContain("fruit is visible");
    expect(prompt).toContain("bark, branches");
  });

  it("belirsizlik durumunda AÇIKÇA belirtme talimatını içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("If you are not confident");
  });

  it("bulanık/kalitesiz fotoğraf durumunda TAHMİN ETMEME talimatını içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("blurry, poorly lit");
  });
});

describe("buildPhotoAnalysisSystemPrompt — Dil Ayarı (mevcut davranış, DEĞİŞMEDİ)", () => {
  it("responseLanguage='en' iken İngilizce talimatı içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("en");
    expect(prompt).toContain("Always respond in English");
  });

  it("responseLanguage='tr' iken Türkçe talimatı içerir", () => {
    const prompt = buildPhotoAnalysisSystemPrompt("tr");
    expect(prompt).toContain("Always respond in Turkish");
  });
});
