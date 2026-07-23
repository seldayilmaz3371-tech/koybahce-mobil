/**
 * Salt-Okunur AI Araçları Testleri
 * ====================================
 * bkz. ADR 0024. GERÇEK repository'lere karşı (test executor) —
 * Gemini mock'lanmıyor (bu araçlar Gemini'yi hiç çağırmıyor, sadece
 * yerel SQLite sorguluyor).
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "../../trees/data/tree.repository";
import { observationRepository } from "../../observations/data/observation.repository";
import { maintenanceRepository } from "../../maintenance/data/maintenance.repository";
import { financeRepository } from "../../finance/data/finance.repository";
import { harvestRepository } from "../../harvest/data/harvest.repository";
import { parcelTool } from "./parcel.tool";
import { treeTool } from "./tree.tool";
import { observationTool } from "./observation.tool";
import { maintenanceTool } from "./maintenance.tool";
import { financeTool } from "./finance.tool";
import { harvestTool } from "./harvest.tool";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("parcelTool", () => {
  it("parcelId verilmeden çağrılırsa TÜM parselleri özetler", async () => {
    await parcelRepository.create({ name: "P1", cropType: "olive", areaDekar: 5 });
    await parcelRepository.create({ name: "P2", cropType: "olive", areaDekar: 3 });

    const result = (await parcelTool.execute({})) as { totalCount: number };

    expect(result.totalCount).toBe(2);
  });

  it("parcelId verilirse SADECE o parseli döner", async () => {
    const parcel = await parcelRepository.create({ name: "Tekil P", cropType: "olive", areaDekar: 5 });

    const result = await parcelTool.execute({ parcelId: parcel.id });

    expect(result).toMatchObject({ found: true, name: "Tekil P" });
  });

  it("var olmayan parcelId için found:false döner (hata FIRLATMAZ)", async () => {
    const result = await parcelTool.execute({ parcelId: "olmayan-id" });
    expect(result).toEqual({ found: false });
  });
});

describe("treeTool", () => {
  it("parcelId verilirse o parselin ağaçlarını listeler", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });

    const result = (await treeTool.execute({ parcelId: parcel.id })) as { totalCount: number };

    expect(result.totalCount).toBe(1);
  });

  it("ne parcelId ne treeId verilirse AÇIK bir hata mesajı döner (exception DEĞİL)", async () => {
    const result = await treeTool.execute({});
    expect(result).toEqual({ error: "parcelId veya treeId gerekli." });
  });
});

describe("observationTool", () => {
  it("en fazla 5 SON gözlemi döner (Token Optimizasyonu — ham döküm DEĞİL)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    for (let i = 0; i < 8; i++) {
      await observationRepository.create({
        parcelId: parcel.id,
        treeId: tree.id,
        observationType: "general",
        observedAt: `2026-0${(i % 9) + 1}-01T00:00:00.000Z`,
      });
    }

    const result = (await observationTool.execute({ treeId: tree.id })) as { recentCount: number };

    expect(result.recentCount).toBe(5); // 8 değil, sınırlı
  });
});

describe("maintenanceTool", () => {
  it("bir ağacın son bakım kayıtlarını döner", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    await maintenanceRepository.create({ parcelId: parcel.id, treeId: tree.id, maintenanceType: "irrigation" });

    const result = (await maintenanceTool.execute({ treeId: tree.id })) as { recentCount: number };

    expect(result.recentCount).toBe(1);
  });

  it("🔴 Sprint 10.15, GERÇEK KÖK NEDEN DÜZELTMESİ: ne parcelId NE treeId VERİLMEDEN çağrılırsa, ARTIK hata DÖNMEZ — sistem geneli sorgu yapar", async () => {
    const parcelA = await parcelRepository.create({ name: "PA", cropType: "olive", areaDekar: 5 });
    const parcelB = await parcelRepository.create({ name: "PB", cropType: "olive", areaDekar: 3 });
    await maintenanceRepository.create({ parcelId: parcelA.id, maintenanceType: "irrigation" });
    await maintenanceRepository.create({ parcelId: parcelB.id, maintenanceType: "fertilization" });

    const result = (await maintenanceTool.execute({})) as {
      totalCount: number;
      recentRecords: { parcelId: string }[];
    };

    expect(result.totalCount).toBeGreaterThanOrEqual(2);
    const returnedParcelIds = result.recentRecords.map((r) => r.parcelId);
    expect(returnedParcelIds).toContain(parcelA.id);
    expect(returnedParcelIds).toContain(parcelB.id);
  });

  it("🔴 Sprint 10.15: HER dönen kayıt, GERÇEKTEN hangi parsele ait olduğunu (parcelId) içerir — kullanıcı 'Hangi parsel?' sordurmadan cevap alabilir", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await maintenanceRepository.create({ parcelId: parcel.id, maintenanceType: "irrigation" });

    const result = (await maintenanceTool.execute({ parcelId: parcel.id })) as {
      recentRecords: { parcelId: string }[];
    };

    expect(result.recentRecords[0].parcelId).toBe(parcel.id);
  });

  it("🔴 Sprint 10.15: totalCount, GERÇEK toplam sayıyı döner — LIMIT'e (5) TAKILMAZ", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    for (let i = 0; i < 8; i++) {
      await maintenanceRepository.create({ parcelId: parcel.id, maintenanceType: "irrigation" });
    }

    const result = (await maintenanceTool.execute({ parcelId: parcel.id })) as {
      totalCount: number;
      recentCount: number;
    };

    expect(result.totalCount).toBe(8); // GERÇEK toplam
    expect(result.recentCount).toBe(5); // LIMIT'li liste (established davranış KORUNDU)
  });

  it("🔴 Sprint 10.15: maintenanceType filtresi AI tarafından GERÇEKTEN kullanılabilir", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await maintenanceRepository.create({ parcelId: parcel.id, maintenanceType: "irrigation" });
    await maintenanceRepository.create({ parcelId: parcel.id, maintenanceType: "pruning" });

    const result = (await maintenanceTool.execute({ maintenanceType: "irrigation" })) as {
      recentRecords: { type: string }[];
    };

    expect(result.recentRecords.every((r) => r.type === "irrigation")).toBe(true);
  });

  it("mevcut (parcelId İLE çağrılan) davranış TAMAMEN KORUNDU — geriye dönük uyumluluk", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await maintenanceRepository.create({ parcelId: parcel.id, maintenanceType: "irrigation" });

    const result = (await maintenanceTool.execute({ parcelId: parcel.id })) as { recentCount: number };

    expect(result.recentCount).toBe(1);
  });
});

describe("financeTool", () => {
  it("ham kayıt DEĞİL, TOPLAM maliyet/satış özeti döner", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await financeRepository.create({
      parcelId: parcel.id,
      recordType: "cost",
      amountMinor: 10000, // 100 TL
      recordDate: "2026-01-01T00:00:00.000Z",
    });
    await financeRepository.create({
      parcelId: parcel.id,
      recordType: "sale",
      amountMinor: 50000, // 500 TL
      recordDate: "2026-01-02T00:00:00.000Z",
    });

    const result = await financeTool.execute({ parcelId: parcel.id });

    expect(result).toEqual({
      recordCount: 2,
      totalCostTL: 100,
      totalSaleTL: 500,
      netTL: 400,
      currency: "TRY",
    });
  });

  it("parcelId verilmezse AÇIK bir hata mesajı döner", async () => {
    const result = await financeTool.execute({});
    expect(result).toEqual({ error: "parcelId gerekli." });
  });
});

describe("harvestTool (Sprint 10.6 — GERÇEK BULGU: AI daha önce Hasat verisine hiç erişemiyordu)", () => {
  it("ham kayıt DEĞİL, TOPLAM hasat miktarı (kg) özeti döner", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-09-01", quantityKg: 120 });
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-09-15", quantityKg: 80 });

    const result = await harvestTool.execute({ parcelId: parcel.id });

    expect(result).toEqual({ recordCount: 2, totalQuantityKg: 200 });
  });

  it("hiç hasat kaydı yoksa sıfır özet döner (hata FIRLATMAZ)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });

    const result = await harvestTool.execute({ parcelId: parcel.id });

    expect(result).toEqual({ recordCount: 0, totalQuantityKg: 0 });
  });

  it("parcelId verilmezse AÇIK bir hata mesajı döner", async () => {
    const result = await harvestTool.execute({});
    expect(result).toEqual({ error: "parcelId gerekli." });
  });
});
