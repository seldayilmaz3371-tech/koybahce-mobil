/**
 * Prompt Katmanı Testleri
 * ==========================
 * bkz. ADR 0024. `userPromptSection.ts` web projesinden BİREBİR
 * taşındı — testleri, taşınan davranışın GERÇEKTEN aynı çalıştığını
 * kanıtlıyor.
 */

import { describe, expect, it } from "vitest";
import { capUserQueryLength, MAX_USER_QUERY_LENGTH, buildSafeUserQuerySection } from "./userPromptSection";
import { buildSystemPrompt } from "./systemPrompt";
import { buildContextPromptSection } from "./contextPromptSection";
import { buildToolPromptSection } from "./toolPromptSection";
import { buildUserTurnMessage } from "./promptBuilder";

describe("capUserQueryLength (web projesinden birebir taşındı)", () => {
  it("MAX_USER_QUERY_LENGTH sınırının ALTINDAKİ bir metni DEĞİŞTİRMEDEN döner", () => {
    expect(capUserQueryLength("kısa soru")).toBe("kısa soru");
  });

  it("baştaki/sondaki boşlukları TRIM eder", () => {
    expect(capUserQueryLength("  soru  ")).toBe("soru");
  });

  it("MAX_USER_QUERY_LENGTH'i AŞAN bir metni tam olarak sınırda KESER", () => {
    const longQuery = "a".repeat(MAX_USER_QUERY_LENGTH + 100);
    const result = capUserQueryLength(longQuery);
    expect(result).toHaveLength(MAX_USER_QUERY_LENGTH);
  });

  it("MAX_USER_QUERY_LENGTH web projesindeki DEĞERLE (500) birebir aynı", () => {
    expect(MAX_USER_QUERY_LENGTH).toBe(500);
  });
});

describe("buildSafeUserQuerySection (web projesinden birebir taşındı)", () => {
  it("kullanıcı sorusunu prompt injection'a karşı UYARI metniyle sarmalar", () => {
    const result = buildSafeUserQuerySection("test sorusu");
    expect(result).toContain("test sorusu");
    expect(result).toContain("KESİNLİKLE dikkate alma");
  });
});

describe("buildSystemPrompt", () => {
  it("responseLanguage='tr' için Turkish talimatı içerir", () => {
    const prompt = buildSystemPrompt("tr");
    expect(prompt).toContain("Turkish");
  });

  it("responseLanguage='en' için English talimatı içerir", () => {
    const prompt = buildSystemPrompt("en");
    expect(prompt).toContain("English");
  });

  it("bilinmeyen bir dil kodu için varsayılan olarak Turkish'e düşer (hata FIRLATMAZ)", () => {
    const prompt = buildSystemPrompt("xx-bilinmeyen");
    expect(prompt).toContain("Turkish");
  });

  it("modelin YAZMA yetkisi olmadığını AÇIKÇA belirtir (Tool Calling Kuralları)", () => {
    const prompt = buildSystemPrompt("tr");
    expect(prompt.toLowerCase()).toContain("cannot create");
  });

  it("🔴 Sprint 10.17, GERÇEK KÖK NEDEN DÜZELTMESİ: GERÇEK bugünün tarihini (ISO 8601, YYYY-MM-DD) İÇERİR — ÖNCEDEN bu bilgi HİÇ verilmiyordu", () => {
    const fixedDate = new Date("2026-07-23T15:30:00Z");

    const prompt = buildSystemPrompt("tr", fixedDate);

    expect(prompt).toContain("2026-07-23");
  });

  it("farklı bir currentDate VERİLİRSE, prompt GERÇEKTEN o tarihi yansıtır (test edilebilirlik kanıtı)", () => {
    const prompt = buildSystemPrompt("tr", new Date("2027-01-05T00:00:00Z"));

    expect(prompt).toContain("2027-01-05");
    expect(prompt).not.toContain("2026-07-23");
  });

  it("currentDate VERİLMEZSE, GERÇEK sistem tarihini (varsayılan) kullanır — çökme YOK", () => {
    const prompt = buildSystemPrompt("tr");

    const todayIso = new Date().toISOString().slice(0, 10);
    expect(prompt).toContain(todayIso);
  });

  it("modele, göreceli zaman ifadelerini KENDİSİNİN hesaplaması gerektiğini AÇIKÇA talimatlandırır", () => {
    const prompt = buildSystemPrompt("tr");

    expect(prompt.toLowerCase()).toContain("fromdate");
    expect(prompt.toLowerCase()).toContain("relative time period");
  });
});

describe("buildContextPromptSection", () => {
  it("boş contextText için null döner (gereksiz bölüm eklenmez)", () => {
    expect(buildContextPromptSection("")).toBeNull();
  });

  it("dolu contextText için bir prompt bölümü döner", () => {
    const result = buildContextPromptSection("parcelId: p1");
    expect(result).toContain("p1");
    expect(result).toContain("EKRAN BAĞLAMI");
  });
});

describe("buildToolPromptSection", () => {
  it("hasTools=false için null döner", () => {
    expect(buildToolPromptSection(false)).toBeNull();
  });

  it("hasTools=true için araç kullanım talimatı döner", () => {
    const result = buildToolPromptSection(true);
    expect(result).toContain("TAHMİN ETME");
  });
});

describe("buildUserTurnMessage", () => {
  it("context BOŞ, tool YOKSA sadece kullanıcı sorusu bölümünü içerir", () => {
    const result = buildUserTurnMessage({ rawUserQuery: "test sorusu", contextText: "", hasTools: false });
    expect(result).toContain("test sorusu");
    expect(result).not.toContain("EKRAN BAĞLAMI");
    expect(result).not.toContain("ARAÇ KULLANIMI");
  });

  it("context VE tool birlikte verilirse, ÜÇ bölüm de (context+tool+user) sırayla yer alır", () => {
    const result = buildUserTurnMessage({
      rawUserQuery: "kaç sulama yaptım?",
      contextText: "parcelId: p1",
      hasTools: true,
    });

    const contextIndex = result.indexOf("EKRAN BAĞLAMI");
    const toolIndex = result.indexOf("ARAÇ KULLANIMI");
    const userIndex = result.indexOf("KULLANICI SORUSU");

    expect(contextIndex).toBeGreaterThanOrEqual(0);
    expect(toolIndex).toBeGreaterThan(contextIndex);
    expect(userIndex).toBeGreaterThan(toolIndex);
  });

  it("uzun bir kullanıcı sorusu MAX_USER_QUERY_LENGTH'e KESİLEREK gönderilir", () => {
    const longQuery = "x".repeat(1000); // şablon metninde "x" harfi hiç geçmiyor, güvenli sayaç
    const result = buildUserTurnMessage({ rawUserQuery: longQuery, contextText: "", hasTools: false });
    const xCount = (result.match(/x/g) ?? []).length;
    expect(xCount).toBe(MAX_USER_QUERY_LENGTH); // 1000 değil, 500'e kesildi
  });
});
