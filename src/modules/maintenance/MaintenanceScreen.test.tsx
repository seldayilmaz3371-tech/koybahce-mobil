// @vitest-environment jsdom
/**
 * MaintenanceScreen Bileşen Testleri
 * =====================================
 * bkz. FinanceScreen.test.tsx (Sprint 4.2) — aynı desen.
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
import { maintenanceRepository } from "./data/maintenance.repository";
import { MaintenanceScreen } from "./MaintenanceScreen";

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

describe("MaintenanceScreen", () => {
  it("Empty State: hiç kayıt yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());
  });

  it("Create: varsayılan değerlerle (Irrigation, Completed) direkt Kaydet → kart listede görünür", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Record"));
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Irrigation/)).toBeTruthy());
    expect(screen.queryByText("New Maintenance Record")).toBeNull();
  });

  it("Edit: karta dokunmak düzenleme formunu doğru verilerle açar, kaydetmek listeyi günceller", async () => {
    const parcelId = await createTestParcel();
    await maintenanceRepository.create({
      parcelId,
      maintenanceType: "pruning",
      completedDate: "2026-01-01T00:00:00.000Z",
    });
    render(<MaintenanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Pruning/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Pruning/));
    expect(screen.getByText("Edit Maintenance Record")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Kış budaması tamamlandı" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Pruning/)).toBeTruthy());
    const updated = await maintenanceRepository.listByParcel(parcelId);
    expect(updated[0].notes).toBe("Kış budaması tamamlandı");
  });

  it("Status Değişimi: düzenleme formunda status değiştirmek gerçekten kaydediliyor (audit log tetikleniyor)", async () => {
    const parcelId = await createTestParcel();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: "irrigation",
      status: "planned",
      scheduledDate: "2026-05-01T00:00:00.000Z",
    });
    render(<MaintenanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Planned/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Planned/));
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "completed" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Completed/)).toBeTruthy());
    const updated = await maintenanceRepository.getById(created.id);
    expect(updated?.status).toBe("completed");
  });

  it("Delete: düzenleme formundan silme, onay sonrası kart listeden kalkar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const parcelId = await createTestParcel();
    await maintenanceRepository.create({ parcelId, maintenanceType: "fertilization" });
    render(<MaintenanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Fertilization/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Fertilization/));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete Record"));
    });

    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Cancel: formda İptal, listeye döner, hiçbir değişiklik kaydedilmez", async () => {
    const parcelId = await createTestParcel();
    render(<MaintenanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Record"));
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());
    const list = await maintenanceRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });
});

describe("MaintenanceScreen — Error Code Standard (Sprint 5.2, kurulu standart tekrar kullanıldı)", () => {
  it("Bilinen bir hata koduna karşılık ÇEVRİLMİŞ mesaj gösterir, ham hata mesajı ASLA görünmez", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("SQLITE_CONSTRAINT: FOREIGN KEY constraint failed at line 42");
    });

    render(
      <MaintenanceScreen
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
