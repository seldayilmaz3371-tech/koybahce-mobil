// @vitest-environment jsdom
/**
 * BulkOperationsScreen Bileşen Testleri
 * ========================================
 * bkz. Sprint 10.2. Alt formların (Bulk*Form) KENDİ testleri AYRI —
 * burada SADECE menüden doğru forma geçişin ÇALIŞTIĞI kanıtlanıyor.
 */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import { BulkOperationsScreen } from "./BulkOperationsScreen";

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
});

describe("BulkOperationsScreen", () => {
  it("menü GERÇEK ağaç sayısını ve 6 işlem seçeneğini (Gözlem + 5 Bakım) gösterir", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-2", variety: "Gemlik" });

    render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("2 trees in this parcel")).toBeTruthy());
    expect(screen.getByText("Bulk Observation")).toBeTruthy();
    expect(screen.getByText("Irrigation")).toBeTruthy();
    expect(screen.getByText("Fertilization")).toBeTruthy();
    expect(screen.getByText("Pesticide")).toBeTruthy();
    expect(screen.getByText("Pruning")).toBeTruthy();
    expect(screen.getByText("Mowing")).toBeTruthy();
  });

  it("'Bulk Observation'a tıklamak GERÇEKTEN BulkObservationForm'u açar", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });

    render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Bulk Observation")).toBeTruthy());
    fireEvent.click(screen.getByText("Bulk Observation"));

    expect(screen.getByText("Apply to All Trees (0)")).toBeTruthy();
  });

  it("bir bakım türüne tıklamak GERÇEKTEN BulkMaintenanceForm'u açar", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });

    render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Irrigation")).toBeTruthy());
    fireEvent.click(screen.getByText("Irrigation"));

    expect(screen.getByText("Bulk Maintenance Record")).toBeTruthy();
  });
});

describe("BulkOperationsScreen — Menü→Form Tür Aktarımı (Sprint 10.4 Düzeltme Paketi)", () => {
  it.each([
    ["Irrigation", "irrigation"],
    ["Fertilization", "fertilization"],
    ["Pesticide", "pesticide"],
    ["Pruning", "pruning"],
    ["Mowing", "other"],
  ])(
    "menüde '%s'e tıklamak, formu GERÇEKTEN '%s' türü seçili olarak açar (önceden HER ZAMAN 'irrigation' açılıyordu)",
    async (buttonLabel, expectedValue) => {
      const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });

      render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);
      await waitFor(() => expect(screen.getByText(buttonLabel)).toBeTruthy());
      fireEvent.click(screen.getByText(buttonLabel));

      await waitFor(() => expect(screen.getByText("Bulk Maintenance Record")).toBeTruthy());
      const select = screen.getByLabelText("Type") as HTMLSelectElement;
      expect(select.value).toBe(expectedValue);
    }
  );
});
