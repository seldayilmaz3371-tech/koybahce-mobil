/**
 * HarvestRepository Testleri
 * =============================
 * bkz. Sprint 8.1.
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
import { harvestRepository } from "./harvest.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createTestParcel() {
  return parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
}

describe("HarvestRepository — create/getById", () => {
  it("create() sonrası getById() ile aynı kaydı döndürür", async () => {
    const parcel = await createTestParcel();

    const created = await harvestRepository.create({
      parcelId: parcel.id,
      harvestDate: "2026-11-15",
      quantityKg: 640,
    });

    const found = await harvestRepository.getById(created.id);
    expect(found).toMatchObject({ parcelId: parcel.id, harvestDate: "2026-11-15", quantityKg: 640 });
  });

  it("treeId verilmeden (parsel geneli) bir kayıt oluşturulabilir", async () => {
    const parcel = await createTestParcel();

    const created = await harvestRepository.create({
      parcelId: parcel.id,
      harvestDate: "2026-11-15",
      quantityKg: 640,
    });

    expect(created.treeId).toBeNull();
  });

  it("var olmayan bir id için getById() null döner", async () => {
    const result = await harvestRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });

  it("var olmayan bir parcelId ile kayıt oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir", async () => {
    await expect(
      harvestRepository.create({ parcelId: "olmayan-parsel", harvestDate: "2026-01-01", quantityKg: 100 })
    ).rejects.toThrow();
  });
});

describe("HarvestRepository — listByParcel / listByTree (dual-scope)", () => {
  it("listByParcel() SADECE o parsele ait kayıtları döner", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await parcelRepository.create({ name: "B", cropType: "olive", areaDekar: 3 });
    await harvestRepository.create({ parcelId: parcelA.id, harvestDate: "2026-11-01", quantityKg: 100 });
    await harvestRepository.create({ parcelId: parcelB.id, harvestDate: "2026-11-01", quantityKg: 200 });

    const results = await harvestRepository.listByParcel(parcelA.id);

    expect(results).toHaveLength(1);
    expect(results[0].parcelId).toBe(parcelA.id);
  });

  it("listByParcel() ağaç-bağlamlı kayıtları da İÇERİR (parsel özeti toplamı göstermeli)", async () => {
    const parcel = await createTestParcel();
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    await harvestRepository.create({ parcelId: parcel.id, treeId: tree.id, harvestDate: "2026-11-01", quantityKg: 50 });

    const results = await harvestRepository.listByParcel(parcel.id);

    expect(results).toHaveLength(1);
    expect(results[0].treeId).toBe(tree.id);
  });

  it("listByTree() SADECE o ağaca ait kayıtları döner", async () => {
    const parcel = await createTestParcel();
    const treeA = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    const treeB = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-2", variety: "Gemlik" });
    await harvestRepository.create({ parcelId: parcel.id, treeId: treeA.id, harvestDate: "2026-11-01", quantityKg: 50 });
    await harvestRepository.create({ parcelId: parcel.id, treeId: treeB.id, harvestDate: "2026-11-01", quantityKg: 30 });

    const results = await harvestRepository.listByTree(treeA.id);

    expect(results).toHaveLength(1);
    expect(results[0].treeId).toBe(treeA.id);
  });

  it("kayıtlar harvest_date'e göre AZALAN sırada (en yeni önce) döner", async () => {
    const parcel = await createTestParcel();
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-11-01", quantityKg: 100 });
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-11-20", quantityKg: 200 });

    const results = await harvestRepository.listByParcel(parcel.id);

    expect(results.map((r) => r.harvestDate)).toEqual(["2026-11-20", "2026-11-01"]);
  });

  it("fromDate/toDate filtresi doğru çalışır", async () => {
    const parcel = await createTestParcel();
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2025-10-01", quantityKg: 100 });
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-11-01", quantityKg: 200 });

    const results = await harvestRepository.listByParcel(parcel.id, { fromDate: "2026-01-01" });

    expect(results).toHaveLength(1);
    expect(results[0].harvestDate).toBe("2026-11-01");
  });

  it("activeOnly varsayılan true — deactivate edilen kayıt listelenmez", async () => {
    const parcel = await createTestParcel();
    const record = await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-11-01", quantityKg: 100 });

    await harvestRepository.deactivate(record.id);

    const results = await harvestRepository.listByParcel(parcel.id);
    expect(results).toHaveLength(0);
  });
});

describe("HarvestRepository — update", () => {
  it("sadece verilen alanları değiştirir, diğerleri KORUNUR", async () => {
    const parcel = await createTestParcel();
    const record = await harvestRepository.create({
      parcelId: parcel.id,
      harvestDate: "2026-11-01",
      quantityKg: 100,
      notes: "ilk not",
    });

    await harvestRepository.update(record.id, { quantityKg: 150 });

    const updated = await harvestRepository.getById(record.id);
    expect(updated?.quantityKg).toBe(150);
    expect(updated?.notes).toBe("ilk not"); // değişmedi
  });

  it("boş bir değişiklik nesnesi hiçbir şey yapmaz (hata FIRLATMAZ)", async () => {
    const parcel = await createTestParcel();
    const record = await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-11-01", quantityKg: 100 });

    await expect(harvestRepository.update(record.id, {})).resolves.not.toThrow();
  });
});
