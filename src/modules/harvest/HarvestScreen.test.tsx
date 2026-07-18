// @vitest-environment jsdom
/**
 * HarvestScreen Bileşen Testleri
 * =================================
 * bkz. MaintenanceScreen.test.tsx — aynı desen. Bakım'ın aksine Hasat
 * formunda GERÇEK zorunlu alanlar var — testler bunu yansıtıyor
 * (boş "Save" ile GEÇME testi YOK, çünkü form bunu REDDEDER).
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
import { harvestRepository } from "./data/harvest.repository";
import { HarvestScreen } from "./HarvestScreen";

vi.mock("@capacitor/app", () => ({
  App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }), exitApp: vi.fn() },
}));

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

async function createTestParcel(): Promise<string> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  return parcel.id;
}

describe("HarvestScreen", () => {
  it("Empty State: hiç kayıt yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<HarvestScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("No harvest records yet.")).toBeTruthy());
  });

  it("Create: formu doldurup Kaydet → kart listede görünür", async () => {
    const parcelId = await createTestParcel();
    render(<HarvestScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No harvest records yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Harvest Record"));
    fireEvent.change(screen.getByLabelText("Harvest Date"), { target: { value: "2026-11-15" } });
    fireEvent.change(screen.getByLabelText("Quantity (kg)"), { target: { value: "640" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/640 kg/)).toBeTruthy());
    expect(screen.queryByText("New Harvest Record")).toBeNull();
  });

  it("Edit: karta dokunmak düzenleme formunu doğru verilerle açar, kaydetmek listeyi günceller", async () => {
    const parcelId = await createTestParcel();
    await harvestRepository.create({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });
    render(<HarvestScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/100 kg/)).toBeTruthy());

    fireEvent.click(screen.getByText(/100 kg/));
    expect(screen.getByText("Edit Harvest Record")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Quantity (kg)"), { target: { value: "150" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/150 kg/)).toBeTruthy());
    const updated = await harvestRepository.listByParcel(parcelId);
    expect(updated[0].quantityKg).toBe(150);
  });

  it("Delete: düzenleme formunda Sil'e basıp onaylamak kaydı listeden kaldırır", async () => {
    const parcelId = await createTestParcel();
    await harvestRepository.create({ parcelId, harvestDate: "2026-11-01", quantityKg: 100 });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<HarvestScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/100 kg/)).toBeTruthy());

    fireEvent.click(screen.getByText(/100 kg/));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete Record"));
    });

    await waitFor(() => expect(screen.getByText("No harvest records yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Error State: repository hatası çevrilmiş bir hata mesajı gösterir (ham hata DEĞİL)", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("simülasyon hatası");
    });

    render(<HarvestScreen scope={{ mode: "parcel", parcelId: "herhangi-id" }} parcelId="herhangi-id" onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy());
    expect(screen.queryByText(/simülasyon hatası/)).toBeNull();
  });
});
