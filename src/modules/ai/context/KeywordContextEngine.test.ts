/**
 * KeywordContextEngine Testleri
 * ================================
 * bkz. ADR 0024 Karar 5. Sıfır AI çağrısı — tamamen deterministik.
 */

import { describe, expect, it } from "vitest";
import { keywordContextEngine } from "./KeywordContextEngine";

describe("KeywordContextEngine", () => {
  it("'sulama' geçen bir soru queryMaintenanceData'yı önerir", async () => {
    const result = await keywordContextEngine.buildContext("Bu ay kaç sulama yaptım?", {});
    expect(result.suggestedToolNames).toContain("queryMaintenanceData");
  });

  it("'maliyet' geçen bir soru queryFinanceSummary'i önerir", async () => {
    const result = await keywordContextEngine.buildContext("Bu parselin toplam maliyeti ne?", {});
    expect(result.suggestedToolNames).toContain("queryFinanceSummary");
  });

  it("büyük/küçük harf DUYARSIZ eşleşir", async () => {
    const result = await keywordContextEngine.buildContext("SULAMA ne zaman yapıldı?", {});
    expect(result.suggestedToolNames).toContain("queryMaintenanceData");
  });

  it("birden fazla anahtar kelime içeren bir soru BİRDEN FAZLA aracı önerir (tekrarsız)", async () => {
    const result = await keywordContextEngine.buildContext("Sulama ve gübreleme maliyetim ne kadar?", {});
    expect(result.suggestedToolNames).toContain("queryMaintenanceData");
    expect(result.suggestedToolNames).toContain("queryFinanceSummary");
    // Tekrarsız — Set kullanıldığı için 'sulama' ve 'gübreleme' AYNI
    // aracı önerse bile listede BİR KEZ görünür.
    const maintenanceCount = result.suggestedToolNames.filter((t) => t === "queryMaintenanceData").length;
    expect(maintenanceCount).toBe(1);
  });

  it("hiçbir anahtar kelime eşleşmezse BOŞ bir öneri listesi döner (hata FIRLATMAZ)", async () => {
    const result = await keywordContextEngine.buildContext("Merhaba, nasılsın?", {});
    expect(result.suggestedToolNames).toEqual([]);
  });

  it("screenContext.parcelId verilirse contextText'e DAHİL edilir", async () => {
    const result = await keywordContextEngine.buildContext("soru", { parcelId: "p1" });
    expect(result.contextText).toContain("p1");
  });

  it("screenContext BOŞSA contextText BOŞ string döner (hata FIRLATMAZ)", async () => {
    const result = await keywordContextEngine.buildContext("soru", {});
    expect(result.contextText).toBe("");
  });

  it("hem parcelId hem treeId verilirse İKİSİ DE contextText'e dahil edilir", async () => {
    const result = await keywordContextEngine.buildContext("soru", { parcelId: "p1", treeId: "t1" });
    expect(result.contextText).toContain("p1");
    expect(result.contextText).toContain("t1");
  });
});
