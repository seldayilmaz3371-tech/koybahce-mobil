// @vitest-environment jsdom
/**
 * useObservations Hook Testleri
 * ================================
 * bkz. useTrees.test.ts (Sprint 2.2) — aynı desen.
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
import { observationRepository } from "../data/observation.repository";
import { useObservations } from "./useObservations";

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

describe("useObservations", () => {
  it("Tree Mode: sadece verilen ağacın gözlemlerini getirir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await observationRepository.create({
      parcelId,
      treeId,
      observationType: "general",
      observedAt: "2026-01-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useObservations({ mode: "tree", treeId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.observations).toHaveLength(1);
  });

  it("Parcel Mode: sadece parsel geneli (tree_id yok) gözlemleri getirir", async () => {
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

    const { result } = renderHook(() => useObservations({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.observations).toHaveLength(1);
    expect(result.current.observations[0].observationType).toBe("weather_impact");
  });

  it("Empty State: hiç gözlem yoksa boş dizi ve 'ready' döner", async () => {
    const { treeId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useObservations({ mode: "tree", treeId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.observations).toEqual([]);
  });

  it("Sayfalama: hasMore/loadMore Parsel deseniyle çalışır (Domain Review onayı)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await observationRepository.create({
        parcelId,
        treeId,
        observationType: "general",
        observedAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const { result } = renderHook(() => useObservations({ mode: "tree", treeId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.observations).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);

    await result.current.loadMore();

    await waitFor(() => expect(result.current.observations).toHaveLength(55));
    expect(result.current.hasMore).toBe(false);
  });

  it("Refresh: createObservation() sonrası liste otomatik güncellenir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    const { result } = renderHook(() => useObservations({ mode: "tree", treeId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.createObservation({
      parcelId,
      treeId,
      observationType: "growth_stage",
      observedAt: "2026-01-01T00:00:00.000Z",
    });

    await waitFor(() => expect(result.current.observations).toHaveLength(1));
  });

  it("Error State (Okuma Yolu): repository hatası 'error' durumuna ve errorCode'a yol açar", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: simülasyon hatası");
    });

    const { result } = renderHook(() => useObservations({ mode: "tree", treeId: "herhangi-id" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toContain("simülasyon hatası");
    expect(result.current.errorCode).not.toBeNull();
  });
});
