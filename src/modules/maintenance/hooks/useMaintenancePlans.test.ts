// @vitest-environment jsdom
/**
 * useMaintenancePlans Hook Testleri
 * ====================================
 * bkz. useMaintenanceRecords.test.ts (Sprint 5.2) — aynı desen.
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
import { maintenancePlanRepository } from "../data/maintenancePlan.repository";
import { MaintenanceType } from "../domain/maintenance.types";
import { useMaintenancePlans } from "./useMaintenancePlans";

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

describe("useMaintenancePlans", () => {
  it("Parcel Mode: parseldeki tüm planları (ağaç-özel dahil) getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    await maintenancePlanRepository.create({
      parcelId,
      treeId,
      maintenanceType: MaintenanceType.Pruning,
      intervalDays: 180,
      nextDueDate: "2026-11-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.plans).toHaveLength(2);
  });

  it("Tree Mode: sadece o ağaca bağlı planları getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    await maintenancePlanRepository.create({
      parcelId,
      treeId,
      maintenanceType: MaintenanceType.Pruning,
      intervalDays: 180,
      nextDueDate: "2026-11-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useMaintenancePlans({ mode: "tree", treeId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.plans).toHaveLength(1);
    expect(result.current.plans[0].maintenanceType).toBe("pruning");
  });

  it("Empty State: hiç plan yoksa boş dizi ve 'ready' döner", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.plans).toEqual([]);
  });

  it("Sayfalama: hasMore/loadMore Maintenance Record deseniyle çalışır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await maintenancePlanRepository.create({
        parcelId,
        maintenanceType: MaintenanceType.Irrigation,
        intervalDays: 7,
        nextDueDate: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.plans).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);

    await result.current.loadMore();

    await waitFor(() => expect(result.current.plans).toHaveLength(55));
    expect(result.current.hasMore).toBe(false);
  });

  it("Refresh: createPlan() sonrası liste otomatik güncellenir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.createPlan({
      parcelId,
      maintenanceType: MaintenanceType.Fertilization,
      intervalDays: 30,
      nextDueDate: "2026-05-01T00:00:00.000Z",
    });

    await waitFor(() => expect(result.current.plans).toHaveLength(1));
  });

  it("updatePlan() sonrası liste otomatik güncellenir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.updatePlan(created.id, { intervalDays: 14 });

    await waitFor(() => expect(result.current.plans[0].intervalDays).toBe(14));
  });

  it("deactivatePlan() sonrası plan listeden kalkar", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.plans).toHaveLength(1));

    await result.current.deactivatePlan(created.id);

    await waitFor(() => expect(result.current.plans).toHaveLength(0));
  });

  it("Error State: repository hatası 'error' durumuna ve errorCode'a yol açar", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: simülasyon hatası");
    });

    const { result } = renderHook(() => useMaintenancePlans({ mode: "parcel", parcelId: "herhangi-id" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toContain("simülasyon hatası");
    expect(result.current.errorCode).not.toBeNull();
  });
});
