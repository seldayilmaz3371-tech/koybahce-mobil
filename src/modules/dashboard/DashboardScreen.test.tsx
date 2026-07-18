// @vitest-environment jsdom
/**
 * DashboardScreen Bileşen Testleri
 * ===================================
 * bkz. Sprint 8.4.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
import { harvestRepository } from "../harvest/data/harvest.repository";
import { DashboardScreen } from "./DashboardScreen";

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

describe("DashboardScreen", () => {
  it("hiç veri yokken sıfır değerleri GERÇEKTEN gösterir (uydurma veri DEĞİL)", async () => {
    render(<DashboardScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Dashboard")).toBeTruthy());
    expect(screen.getByText("Total Parcels")).toBeTruthy();
    expect(screen.getByText("No recent observations.")).toBeTruthy();
  });

  it("gerçek parsel/ağaç/hasat verisi DOĞRU şekilde toplanıp gösterilir", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-2", variety: "Gemlik" });
    await harvestRepository.create({ parcelId: parcel.id, harvestDate: "2026-11-01", quantityKg: 640 });

    render(<DashboardScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Dashboard")).toBeTruthy());
    // "1" (toplam parsel) ve "2" (toplam ağaç) gerçek DOM'da görünmeli.
    const values = screen.getAllByText(/^\d+$/).map((el) => el.textContent);
    expect(values).toContain("1");
    expect(values).toContain("2");
    expect(screen.getByText("640 kg")).toBeTruthy();
  });

  it("Error State: repository hatası çevrilmiş bir hata mesajı gösterir (ham hata DEĞİL)", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("simülasyon hatası");
    });

    render(<DashboardScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy());
    expect(screen.queryByText(/simülasyon hatası/)).toBeNull();
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();
    render(<DashboardScreen onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    screen.getByText("Back").click();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
