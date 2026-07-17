// @vitest-environment jsdom
/**
 * useMaintenanceRecords Hook Testleri
 * ======================================
 * bkz. useFinanceRecords.test.ts (Sprint 4.2) — aynı desen.
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
import { maintenanceRepository } from "../data/maintenance.repository";
import { MaintenanceType } from "../domain/maintenance.types";
import { useMaintenanceRecords } from "./useMaintenanceRecords";

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

describe("useMaintenanceRecords", () => {
  it("Parcel Mode: parseldeki tüm kayıtları (ağaç-özel dahil) getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.Irrigation });
    await maintenanceRepository.create({ parcelId, treeId, maintenanceType: MaintenanceType.Pruning });

    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toHaveLength(2);
  });

  it("Tree Mode: sadece o ağaca bağlı kayıtları getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.Irrigation });
    await maintenanceRepository.create({ parcelId, treeId, maintenanceType: MaintenanceType.Pruning });

    const { result } = renderHook(() => useMaintenanceRecords({ mode: "tree", treeId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].maintenanceType).toBe("pruning");
  });

  it("Empty State: hiç kayıt yoksa boş dizi ve 'ready' döner", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toEqual([]);
  });

  it("Sayfalama: hasMore/loadMore Finance deseniyle çalışır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await maintenanceRepository.create({
        parcelId,
        maintenanceType: MaintenanceType.Irrigation,
        completedDate: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.records).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);

    await result.current.loadMore();

    await waitFor(() => expect(result.current.records).toHaveLength(55));
    expect(result.current.hasMore).toBe(false);
  });

  it("Refresh: createRecord() sonrası liste otomatik güncellenir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.createRecord({ parcelId, maintenanceType: MaintenanceType.Fertilization });

    await waitFor(() => expect(result.current.records).toHaveLength(1));
  });

  it("updateRecord() sonrası liste otomatik güncellenir (status değişimi dahil)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      status: "planned",
      scheduledDate: "2026-05-01T00:00:00.000Z",
    });
    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.updateRecord(created.id, { status: "completed" });

    await waitFor(() => expect(result.current.records[0].status).toBe("completed"));
  });

  it("deactivateRecord() sonrası kayıt listeden kalkar", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
    });
    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.records).toHaveLength(1));

    await result.current.deactivateRecord(created.id);

    await waitFor(() => expect(result.current.records).toHaveLength(0));
  });

  it("Error State: repository hatası 'error' durumuna ve errorCode'a yol açar", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: simülasyon hatası");
    });

    const { result } = renderHook(() => useMaintenanceRecords({ mode: "parcel", parcelId: "herhangi-id" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toContain("simülasyon hatası");
    expect(result.current.errorCode).not.toBeNull();
  });
});
