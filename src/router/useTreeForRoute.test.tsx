// @vitest-environment jsdom
/**
 * useTreeForRoute Testleri
 * ===========================
 * bkz. Sprint 7.1 — `ObservationScreenRoute`/`TreeMaintenanceScreenRoute`'tan
 * çıkarılan ortak mantık. Bu testler, ÖNCEDEN `AppRouter.test.tsx`
 * içinde DOLAYLI olarak (Observation/Maintenance akışları üzerinden)
 * test edilen davranışı artık DOĞRUDAN kanıtlıyor.
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../data/db/migrations/schema";
import { parcelRepository } from "../modules/parcels/data/parcel.repository";
import { treeRepository } from "../modules/trees/data/tree.repository";
import { useTreeForRoute } from "./useTreeForRoute";

vi.mock("@capacitor/app", () => ({
  App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }), exitApp: vi.fn() },
}));

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("useTreeForRoute", () => {
  it("treeId undefined iken hiçbir sorgu yapmaz, 'loading' döner", async () => {
    const { result } = renderHook(() => useTreeForRoute(undefined), { wrapper });
    expect(result.current).toBe("loading");
  });

  it("geçerli bir treeId için GERÇEK Tree nesnesini döner", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });

    const { result } = renderHook(() => useTreeForRoute(tree.id), { wrapper });

    await waitFor(() => expect(result.current).not.toBe("loading"));
    expect(result.current).toMatchObject({ id: tree.id, treeNumber: "A-1" });
  });

  it("var olmayan bir treeId için null döner (bulunamadı)", async () => {
    const { result } = renderHook(() => useTreeForRoute("var-olmayan-id"), { wrapper });

    await waitFor(() => expect(result.current).not.toBe("loading"));
    expect(result.current).toBeNull();
  });

  it("treeId DEĞİŞTİĞİNDE yeni ağacı çeker (eski sonuç sızmaz)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const treeA = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    const treeB = await treeRepository.create({ parcelId: parcel.id, treeNumber: "B-1", variety: "Ayvalık" });

    const { result, rerender } = renderHook(({ id }) => useTreeForRoute(id), {
      wrapper,
      initialProps: { id: treeA.id },
    });
    await waitFor(() => expect(result.current).not.toBe("loading"));
    expect((result.current as { treeNumber: string }).treeNumber).toBe("A-1");

    act(() => rerender({ id: treeB.id }));

    await waitFor(() => expect((result.current as { treeNumber: string })?.treeNumber).toBe("B-1"));
  });
});
