/**
 * FinanceRepository Testleri
 * =============================
 * bkz. docs/adr/0018-test-stratejisi.md, Modül 4 Mimari Onayı.
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
import { financeRepository } from "./finance.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createTestParcelAndTree(): Promise<{ parcelId: string; treeId: string }> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  return { parcelId: parcel.id, treeId: tree.id };
}

describe("FinanceRepository", () => {
  it("create() sonrası getById() ile aynı kaydı döndürür", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 250.5,
      recordDate: "2026-01-01T00:00:00.000Z",
      notes: "Gübre alımı",
    });

    const found = await financeRepository.getById(created.id);

    expect(found).toMatchObject({ recordType: "cost", amount: 250.5, notes: "Gübre alımı" });
  });

  it("currencyCode formda verilmese bile sessizce 'TRY' olarak atanır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const record = await financeRepository.create({
      parcelId,
      recordType: "sale",
      amount: 1000,
      recordDate: "2026-01-01T00:00:00.000Z",
    });

    expect(record.currencyCode).toBe("TRY");
  });

  it("notes olmadan (isteğe bağlı) kayıt oluşturulabilir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      financeRepository.create({
        parcelId,
        recordType: "cost",
        amount: 100,
        recordDate: "2026-01-01T00:00:00.000Z",
      })
    ).resolves.toMatchObject({ notes: null });
  });

  it("listByParcel() TÜM kayıtları döndürür — ağaca özel olanlar DAHİL (Observation'dan bilinçli farklı)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 50,
      recordDate: "2026-01-01T00:00:00.000Z",
    });
    await financeRepository.create({
      parcelId,
      treeId,
      recordType: "cost",
      amount: 30,
      recordDate: "2026-01-02T00:00:00.000Z",
    });

    const list = await financeRepository.listByParcel(parcelId);

    expect(list).toHaveLength(2);
  });

  it("listByTree() SADECE o ağaca bağlı kayıtları döndürür", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 50,
      recordDate: "2026-01-01T00:00:00.000Z",
    });
    await financeRepository.create({
      parcelId,
      treeId,
      recordType: "sale",
      amount: 500,
      recordDate: "2026-01-02T00:00:00.000Z",
    });

    const list = await financeRepository.listByTree(treeId);

    expect(list).toHaveLength(1);
    expect(list[0].recordType).toBe("sale");
  });

  it("kayıtlar en yeni tarih önce sıralanır (record_date DESC)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 10,
      recordDate: "2026-01-01T00:00:00.000Z",
    });
    await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 20,
      recordDate: "2026-03-01T00:00:00.000Z",
    });
    await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 30,
      recordDate: "2026-02-01T00:00:00.000Z",
    });

    const list = await financeRepository.listByParcel(parcelId);

    expect(list.map((r) => r.amount)).toEqual([20, 30, 10]);
  });

  it("update() sadece verilen alanları değiştirir, parcelId/treeId hiç değişemez", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 100,
      recordDate: "2026-01-01T00:00:00.000Z",
    });

    await financeRepository.update(created.id, { amount: 150 });

    const updated = await financeRepository.getById(created.id);
    expect(updated?.amount).toBe(150);
    expect(updated?.recordType).toBe("cost"); // değişmemeli
    expect(updated?.parcelId).toBe(parcelId); // hiç değişemez (tip sisteminde yok)
  });

  it("deactivate() sonrası listByParcel() bu kaydı göstermez", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await financeRepository.create({
      parcelId,
      recordType: "cost",
      amount: 100,
      recordDate: "2026-01-01T00:00:00.000Z",
    });

    await financeRepository.deactivate(created.id);

    const list = await financeRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });

  it("record_type CHECK kısıtı 'harvest' de dahil geçersiz bir kodu reddeder (bilinçli kapsam dışı — Modül 4 onayı)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      financeRepository.create({
        parcelId,
        // @ts-expect-error - bilerek geçersiz/kapsam-dışı bir tip deneniyor
        recordType: "harvest",
        amount: 100,
        recordDate: "2026-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir parcelId ile kayıt oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir (ADR 0022)", async () => {
    await expect(
      financeRepository.create({
        parcelId: "var-olmayan-parsel",
        recordType: "cost",
        amount: 100,
        recordDate: "2026-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await financeRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });

  it("list({ limit, offset }) sayfalamayı destekler (Observation deseniyle tutarlı)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await financeRepository.create({
        parcelId,
        recordType: "cost",
        amount: i,
        recordDate: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const firstPage = await financeRepository.listByParcel(parcelId);
    expect(firstPage).toHaveLength(50);

    const secondPage = await financeRepository.listByParcel(parcelId, { offset: 50 });
    expect(secondPage).toHaveLength(5);
  });
});
