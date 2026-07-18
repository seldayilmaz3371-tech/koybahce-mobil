// @vitest-environment jsdom
/**
 * BulkObservationForm Bileşen Testleri
 * =======================================
 * bkz. Sprint 10.2. `BulkMaintenanceForm.test.tsx` ile AYNI desen,
 * daha KISA bir set (aynı ortak bileşenleri — TreeSelectorList/
 * useTreeSelection — kullandığı için tekrar test edilmiyor).
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../data/db/migrations/schema";
import { parcelRepository } from "../parcels/data/parcel.repository";
import { treeRepository } from "../trees/data/tree.repository";
import { observationRepository } from "../observations/data/observation.repository";
import { BulkObservationForm } from "./BulkObservationForm";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
  vi.restoreAllMocks();
});

async function createParcelWithTrees(count: number) {
  const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
  const trees = [];
  for (let i = 0; i < count; i++) {
    trees.push(await treeRepository.create({ parcelId: parcel.id, treeNumber: `T-${i}`, variety: "Gemlik" }));
  }
  return { parcel, trees };
}

describe("BulkObservationForm", () => {
  it("Tüm Ağaçlara Uygula ile GERÇEKTEN TÜM ağaçlara gözlem oluşturulur", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(5);

    render(<BulkObservationForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("5 records created. 0 errors.")).toBeTruthy());
    const totalCreated = (
      await Promise.all(trees.map((tree) => observationRepository.listByTree(tree.id)))
    ).flat();
    expect(totalCreated).toHaveLength(5);
  });

  it("'Undo' butonu OLUŞTURULAN gözlemleri GERÇEKTEN geri alır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(2);

    render(<BulkObservationForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("2 records created. 0 errors.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
    });

    await waitFor(async () => {
      const remaining = (
        await Promise.all(trees.map((tree) => observationRepository.listByTree(tree.id)))
      ).flat();
      expect(remaining).toHaveLength(0);
    });
  });
});
