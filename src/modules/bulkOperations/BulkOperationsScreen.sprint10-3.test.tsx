// @vitest-environment jsdom
/**
 * BulkOperationsScreen — Sprint 10.3 Testleri
 * ===============================================
 * "Son Kullanılan İşlem" hızlı erişimi + Ardışık İşlem Sihirbazı.
 * Temel menü testleri `BulkOperationsScreen.test.tsx`'te (Sprint
 * 10.2) — burada TEKRAR edilmiyor.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Preferences } from "@capacitor/preferences";
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

beforeEach(async () => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
  await Preferences.clear(); // testler arası state sızıntısını önle
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

describe("BulkOperationsScreen — Son Kullanılan İşlem (Sprint 10.3)", () => {
  it("hiç geçmiş işlem yoksa 'Son Kullanılan' butonu GÖRÜNMEZ", async () => {
    const { parcel } = await createParcelWithTrees(2);

    render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Bulk Observation")).toBeTruthy());
    expect(screen.queryByText(/Last Used:/)).toBeNull();
  });

  it("bir işlem uygulandıktan sonra, EKRAN YENİDEN AÇILDIĞINDA 'Son Kullanılan' GERÇEKTEN görünür", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel } = await createParcelWithTrees(2);

    const { unmount } = render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Irrigation")).toBeTruthy());
    fireEvent.click(screen.getByText("Irrigation"));
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("2 records created. 0 errors.")).toBeTruthy());
    unmount();

    // Ekranı YENİDEN monte et (uygulamanın "yeniden açılışını" simüle ediyor).
    render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Last Used: Irrigation")).toBeTruthy());
  });
});

describe("BulkOperationsScreen — Ardışık İşlem Sihirbazı (Sprint 10.3, Madde 5)", () => {
  it("'Apply Another Operation'a basmak, AYNI ağaç seçimini YENİ forma AKTARIR (kullanıcı TEKRAR seçmez)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel } = await createParcelWithTrees(3);

    render(<BulkOperationsScreen parcelId={parcel.id} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Irrigation")).toBeTruthy());

    // 1. Sulama uygula (Tüm ağaçlara).
    fireEvent.click(screen.getByText("Irrigation"));
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("3 records created. 0 errors.")).toBeTruthy());

    // 2. "Aynı Ağaçlara Başka İşlem Uygula" ile menüye dön.
    fireEvent.click(screen.getByText("Apply Another Operation to Same Trees"));
    await waitFor(() => expect(screen.getByText(/3 trees carried over/)).toBeTruthy());

    // 3. Gübreleme seç — GERÇEK 3 ağaç ÖNCEDEN SEÇİLİ olmalı (select moduna otomatik geçmiş).
    fireEvent.click(screen.getByText("Fertilization"));
    await waitFor(() => expect(screen.getByText("3 trees selected")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("3 records created. 0 errors.")).toBeTruthy());
  });
});
