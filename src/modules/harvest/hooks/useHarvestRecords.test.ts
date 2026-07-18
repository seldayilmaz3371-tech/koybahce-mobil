// @vitest-environment jsdom
/**
 * useHarvestRecords Hook Testleri
 * ==================================
 * bkz. useMaintenanceRecords.test.ts — aynı desen.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "../../trees/data/tree.repository";
import { harvestRepository } from "../data/harvest.repository";
import { useHarvestRecords } from "./useHarvestRecords";

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

describe("useHarvestRecords", () => {
  it("Parcel Mode: parseldeki tüm kayıtları (ağaç-özel dahil) getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await harvestRepository.create({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });
    await harvestRepository.create({ parcelId, treeId, harvestDate: "2026-11-01", quantityKg: 50 });

    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toHaveLength(2);
  });

  it("Tree Mode: sadece o ağaca bağlı kayıtları getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await harvestRepository.create({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });
    await harvestRepository.create({ parcelId, treeId, harvestDate: "2026-11-01", quantityKg: 50 });

    const { result } = renderHook(() => useHarvestRecords({ mode: "tree", treeId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].quantityKg).toBe(50);
  });

  it("Empty State: hiç kayıt yoksa boş dizi ve 'ready' döner", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toEqual([]);
  });

  it("Sayfalama: hasMore/loadMore Bakım/Finance deseniyle çalışır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await harvestRepository.create({
        parcelId,
        harvestDate: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
        quantityKg: 10,
      });
    }

    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);

    await result.current.loadMore();

    await waitFor(() => expect(result.current.records).toHaveLength(55));
    expect(result.current.hasMore).toBe(false);
  });

  it("Refresh: createRecord() sonrası liste otomatik güncellenir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.createRecord({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });

    await waitFor(() => expect(result.current.records).toHaveLength(1));
  });

  it("updateRecord() sonrası liste otomatik güncellenir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await harvestRepository.create({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });
    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.updateRecord(created.id, { quantityKg: 150 });

    await waitFor(() => expect(result.current.records[0].quantityKg).toBe(150));
  });

  it("deactivateRecord() sonrası kayıt listeden kalkar", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await harvestRepository.create({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });
    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.records).toHaveLength(1));

    await result.current.deactivateRecord(created.id);

    await waitFor(() => expect(result.current.records).toHaveLength(0));
  });

  it("Error State: repository hatası 'error' durumuna ve errorCode'a yol açar", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: simülasyon hatası");
    });

    const { result } = renderHook(() => useHarvestRecords({ mode: "parcel", parcelId: "herhangi-id" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toContain("simülasyon hatası");
    expect(result.current.errorCode).not.toBeNull();
  });
});
