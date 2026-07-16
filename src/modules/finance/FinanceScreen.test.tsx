// @vitest-environment jsdom
/**
 * FinanceScreen Bileşen Testleri
 * =================================
 * bkz. ObservationScreen.test.tsx (Sprint 3.4) — aynı desen. Ek olarak:
 * Error Code Standard'ın gerçekten UI'da tüketildiğini (ham hata
 * mesajının ASLA gösterilmediğini) kanıtlayan testler.
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
import { financeRepository } from "./data/finance.repository";
import { FinanceScreen } from "./FinanceScreen";

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

describe("FinanceScreen", () => {
  it("Empty State: hiç kayıt yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<FinanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());
  });

  it("Create: varsayılan değerlerle (Cost, bugün) direkt Kaydet → kart listede görünür", async () => {
    const parcelId = await createTestParcel();
    render(<FinanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Record"));
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "500" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Cost/)).toBeTruthy());
    expect(screen.queryByText("New Finance Record")).toBeNull();
  });

  it("Edit: karta dokunmak düzenleme formunu doğru verilerle açar, kaydetmek listeyi günceller", async () => {
    const parcelId = await createTestParcel();
    await financeRepository.create({
      parcelId,
      recordType: "cost",
      amountMinor: 10000,
      recordDate: "2026-01-01T00:00:00.000Z",
    });
    render(<FinanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Cost/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Cost/));
    expect(screen.getByText("Edit Finance Record")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "999" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/999/)).toBeTruthy());
  });

  it("Delete: düzenleme formundan silme, onay sonrası kart listeden kalkar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const parcelId = await createTestParcel();
    await financeRepository.create({
      parcelId,
      recordType: "sale",
      amountMinor: 10000,
      recordDate: "2026-01-01T00:00:00.000Z",
    });
    render(<FinanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Sale/)).toBeTruthy());

    fireEvent.click(screen.getByText(/Sale/));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete Record"));
    });

    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Cancel: formda İptal, listeye döner, hiçbir değişiklik kaydedilmez", async () => {
    const parcelId = await createTestParcel();
    render(<FinanceScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Record"));
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());
  });
});

describe("FinanceScreen — Error Code Standard (Modül 4 Mimari Onayı madde 5)", () => {
  it("Bilinen bir hata koduna (DB_005) karşılık ÇEVRİLMİŞ mesaj gösterir, ham hata mesajı ASLA görünmez", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("SQLITE_CONSTRAINT: FOREIGN KEY constraint failed at line 42");
    });

    render(
      <FinanceScreen scope={{ mode: "parcel", parcelId: "herhangi-id" }} parcelId="herhangi-id" onBack={() => {}} />
    );

    await waitFor(() => expect(screen.getByText("A related record could not be found.")).toBeTruthy());
    // Ham SQLite hata metni HİÇBİR YERDE görünmemeli.
    expect(screen.queryByText(/SQLITE_CONSTRAINT/)).toBeNull();
    expect(screen.queryByText(/line 42/)).toBeNull();
  });

  it("Eşlenmemiş/sınıflandırılamayan bir hata için genel (ama yine ÇEVRİLMİŞ) mesaja düşer", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("tamamen beklenmedik, sınıflandırılamayan bir native hata");
    });

    render(
      <FinanceScreen scope={{ mode: "parcel", parcelId: "herhangi-id" }} parcelId="herhangi-id" onBack={() => {}} />
    );

    await waitFor(() => expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy());
    expect(screen.queryByText(/sınıflandırılamayan/)).toBeNull();
  });
});
