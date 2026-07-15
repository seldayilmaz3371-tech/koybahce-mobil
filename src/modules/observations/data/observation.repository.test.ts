/**
 * ObservationRepository Testleri
 * =================================
 * bkz. docs/adr/0018-test-stratejisi.md, docs/observation-domain-review.md
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
import { observationRepository } from "./observation.repository";

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

describe("ObservationRepository", () => {
  it("create() sonrası listByTree() ile aynı gözlemi döndürür", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    const created = await observationRepository.create({
      parcelId,
      treeId,
      observationType: "health_concern",
      note: "Yaprak sararması gözlendi",
      observedAt: "2026-02-01T00:00:00.000Z",
    });

    const list = await observationRepository.listByTree(treeId);

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: created.id,
      observationType: "health_concern",
      note: "Yaprak sararması gözlendi",
    });
  });

  it("listByTree() en yeni gözlemi önce döndürür (ORDER BY observed_at DESC)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await observationRepository.create({
      treeId,
      parcelId,
      observationType: "general",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    await observationRepository.create({
      treeId,
      parcelId,
      observationType: "general",
      observedAt: "2026-03-01T00:00:00.000Z",
    });
    await observationRepository.create({
      treeId,
      parcelId,
      observationType: "general",
      observedAt: "2026-02-01T00:00:00.000Z",
    });

    const list = await observationRepository.listByTree(treeId);

    expect(list.map((o) => o.observedAt)).toEqual([
      "2026-03-01T00:00:00.000Z",
      "2026-02-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    ]);
  });

  it("listByParcel() SADECE parsel geneli (tree_id IS NULL) gözlemleri döndürür, ağaç gözlemlerini tekrarlamaz", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await observationRepository.create({
      parcelId,
      treeId: null,
      observationType: "weather_impact",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    await observationRepository.create({
      parcelId,
      treeId,
      observationType: "health_concern",
      observedAt: "2026-01-02T00:00:00.000Z",
    });

    const parcelList = await observationRepository.listByParcel(parcelId);

    expect(parcelList).toHaveLength(1);
    expect(parcelList[0].observationType).toBe("weather_impact");
    expect(parcelList[0].treeId).toBeNull();
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await observationRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });

  it("update() sadece verilen alanları değiştirir, parcelId/treeId hiç değiştirilemez (sözleşmede yok)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    const created = await observationRepository.create({
      parcelId,
      treeId,
      observationType: "general",
      note: "İlk not",
      observedAt: "2026-01-01T00:00:00.000Z",
    });

    await observationRepository.update(created.id, { note: "Güncellenmiş not" });

    const updated = await observationRepository.getById(created.id);
    expect(updated?.note).toBe("Güncellenmiş not");
    expect(updated?.observationType).toBe("general"); // değişmemeli
    expect(updated?.parcelId).toBe(parcelId); // hiç değişemez (tip sisteminde yok)
  });

  it("deactivate() sonrası listByTree() bu gözlemi göstermez", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    const created = await observationRepository.create({
      parcelId,
      treeId,
      observationType: "general",
      observedAt: "2026-01-01T00:00:00.000Z",
    });

    await observationRepository.deactivate(created.id);

    const list = await observationRepository.listByTree(treeId);
    expect(list).toHaveLength(0);
  });

  it("note olmadan (sadece observationType) gözlem oluşturulabilir — şema seviyesinde zorunlu değil", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await expect(
      observationRepository.create({
        parcelId,
        treeId,
        observationType: "general",
        observedAt: "2026-01-01T00:00:00.000Z",
      })
    ).resolves.toMatchObject({ note: null });
  });

  it("observation_type CHECK kısıtı geçersiz bir kodu reddeder", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await expect(
      observationRepository.create({
        parcelId,
        treeId,
        // @ts-expect-error - bilerek geçersiz enum-kod deneniyor
        observationType: "gecersiz-tip",
        observedAt: "2026-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir tree_id ile gözlem oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir (ADR 0022)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      observationRepository.create({
        parcelId,
        treeId: "var-olmayan-agac",
        observationType: "general",
        observedAt: "2026-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("list({ limit, offset }) sayfalamayı destekler (Domain Review onayı — Parsel deseni)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await observationRepository.create({
        parcelId,
        treeId,
        observationType: "general",
        observedAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const firstPage = await observationRepository.listByTree(treeId);
    expect(firstPage).toHaveLength(50);

    const secondPage = await observationRepository.listByTree(treeId, { offset: 50 });
    expect(secondPage).toHaveLength(5);
  });
});
