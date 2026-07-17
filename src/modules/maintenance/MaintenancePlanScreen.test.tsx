// @vitest-environment jsdom
/**
 * MaintenancePlanScreen Bileşen Testleri
 * ==========================================
 * bkz. MaintenanceScreen.test.tsx (Sprint 5.2) — aynı desen.
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
import { maintenancePlanRepository } from "./data/maintenancePlan.repository";
import { MaintenancePlanScreen } from "./MaintenancePlanScreen";

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

describe("MaintenancePlanScreen", () => {
  it("Empty State: hiç plan yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenancePlanScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("No maintenance plans yet.")).toBeTruthy());
  });

  it("Create: geçerli veriyle Kaydet → kart listede görünür", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenancePlanScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No maintenance plans yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Plan"));
    fireEvent.change(screen.getByLabelText("Interval (Days)"), { target: { value: "7" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Irrigation/)).toBeTruthy());
    expect(screen.queryByText("New Maintenance Plan")).toBeNull();
  });

  it("Boş formla (intervalDays yok) Kaydet — doğrulama hatası gösterir, LİSTEYE GEÇİLMEZ", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenancePlanScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No maintenance plans yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Plan"));
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Interval must be a positive whole number of days.")).toBeTruthy();
    const list = await maintenancePlanRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });

  it("Edit: karta dokunmak düzenleme formunu doğru verilerle açar, kaydetmek listeyi günceller", async () => {
    const parcelId = await createTestParcel();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: "pruning",
      intervalDays: 180,
      nextDueDate: "2026-11-01T00:00:00.000Z",
    });
    render(<MaintenancePlanScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Pruning/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Pruning/));
    expect(screen.getByText("Edit Maintenance Plan")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Interval (Days)"), { target: { value: "365" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/365/)).toBeTruthy());
  });

  it("Delete: düzenleme formundan silme, onay sonrası kart listeden kalkar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const parcelId = await createTestParcel();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: "fertilization",
      intervalDays: 30,
      nextDueDate: "2026-05-01T00:00:00.000Z",
    });
    render(<MaintenancePlanScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Fertilization/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Fertilization/));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete Plan"));
    });

    await waitFor(() => expect(screen.getByText("No maintenance plans yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Cancel: formda İptal, listeye döner, hiçbir değişiklik kaydedilmez", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenancePlanScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No maintenance plans yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Plan"));
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => expect(screen.getByText("No maintenance plans yet.")).toBeTruthy());
    const list = await maintenancePlanRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });
});

describe("MaintenancePlanScreen — Error Code Standard", () => {
  it("Bilinen bir hata koduna karşılık ÇEVRİLMİŞ mesaj gösterir, ham hata mesajı ASLA görünmez", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("SQLITE_CONSTRAINT: FOREIGN KEY constraint failed at line 42");
    });

    render(
      <MaintenancePlanScreen
        scope={{ mode: "parcel", parcelId: "herhangi-id" }}
        parcelId="herhangi-id"
        onBack={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByText("A related record could not be found.")).toBeTruthy());
    expect(screen.queryByText(/SQLITE_CONSTRAINT/)).toBeNull();
    expect(screen.queryByText(/line 42/)).toBeNull();
  });
});
