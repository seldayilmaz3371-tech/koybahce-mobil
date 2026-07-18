// @vitest-environment jsdom
/**
 * useDashboardSummary Hook Testleri
 * ====================================
 * bkz. Sprint 8.4.
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
import { maintenancePlanRepository } from "../../maintenance/data/maintenancePlan.repository";
import { MaintenanceType } from "../../maintenance/domain/maintenance.types";
import { observationRepository } from "../../observations/data/observation.repository";
import { harvestRepository } from "../../harvest/data/harvest.repository";
import { useDashboardSummary } from "./useDashboardSummary";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("useDashboardSummary", () => {
  it("hiç parsel yoksa sıfır değerlerle 'ready' döner (hata FIRLATMAZ)", async () => {
    const { result } = renderHook(() => useDashboardSummary());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary).toEqual({
      totalParcels: 0,
      totalTrees: 0,
      overdueMaintenanceCount: 0,
      upcomingMaintenanceCount: 0,
      recentObservations: [],
      totalHarvestKg: 0,
    });
  });

  it("totalParcels/totalTrees BİRDEN FAZLA parsel genelinde DOĞRU toplanır", async () => {
    const parcelA = await parcelRepository.create({ name: "A", cropType: "olive", areaDekar: 5 });
    const parcelB = await parcelRepository.create({ name: "B", cropType: "olive", areaDekar: 3 });
    await treeRepository.create({ parcelId: parcelA.id, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelA.id, treeNumber: "A-2", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelB.id, treeNumber: "B-1", variety: "Gemlik" });

    const { result } = renderHook(() => useDashboardSummary());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary?.totalParcels).toBe(2);
    expect(result.current.summary?.totalTrees).toBe(3);
  });

  it("overdueMaintenanceCount TÜM parseller genelinde DOĞRU toplanır", async () => {
    const parcelA = await parcelRepository.create({ name: "A", cropType: "olive", areaDekar: 5 });
    const parcelB = await parcelRepository.create({ name: "B", cropType: "olive", areaDekar: 3 });
    // "Geciken" — referans tarihten (bugün) ÖNCEKİ next_due_date.
    const pastDate = "2020-01-01";
    await maintenancePlanRepository.create({
      parcelId: parcelA.id,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: pastDate,
    });
    await maintenancePlanRepository.create({
      parcelId: parcelB.id,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: pastDate,
    });

    const { result } = renderHook(() => useDashboardSummary());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary?.overdueMaintenanceCount).toBe(2);
  });

  it("totalHarvestKg TÜM parseller genelinde DOĞRU toplanır", async () => {
    const parcelA = await parcelRepository.create({ name: "A", cropType: "olive", areaDekar: 5 });
    const parcelB = await parcelRepository.create({ name: "B", cropType: "olive", areaDekar: 3 });
    await harvestRepository.create({ parcelId: parcelA.id, harvestDate: "2026-11-01", quantityKg: 100 });
    await harvestRepository.create({ parcelId: parcelB.id, harvestDate: "2026-11-01", quantityKg: 250 });

    const { result } = renderHook(() => useDashboardSummary());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary?.totalHarvestKg).toBe(350);
  });

  it("recentObservations TÜM parseller genelinde BİRLEŞTİRİLİR, en yeni önce, en fazla 5", async () => {
    const parcelA = await parcelRepository.create({ name: "A", cropType: "olive", areaDekar: 5 });
    const parcelB = await parcelRepository.create({ name: "B", cropType: "olive", areaDekar: 3 });
    await observationRepository.create({
      parcelId: parcelA.id,
      observationType: "general",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    await observationRepository.create({
      parcelId: parcelB.id,
      observationType: "health_concern",
      observedAt: "2026-06-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useDashboardSummary());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.summary?.recentObservations).toHaveLength(2);
    // En yeni (2026-06-01, parcelB) ÖNCE gelmeli.
    expect(result.current.summary?.recentObservations[0].parcelId).toBe(parcelB.id);
  });

  it("Error State: repository hatası 'error' durumuna ve errorCode'a yol açar", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: simülasyon hatası");
    });

    const { result } = renderHook(() => useDashboardSummary());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).not.toBeNull();
  });
});
