// @vitest-environment jsdom
/**
 * ParcelsScreen Bileşen Testleri
 * =================================
 * Sprint 2.5 öncesi bu bileşen için hiç component testi yoktu (sadece
 * ParcelForm test edilmişti). Şimdi eklenmesinin gerekçesi: yeni
 * navigasyon callback'lerinin (onViewTrees/onViewReferenceTrees)
 * gerçekten doğru tetiklendiğini doğrulamak — bu, Sprint 2.5'in
 * "Parcel → Trees navigasyonu" kabul kriterinin gerçek kanıtı.
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
import { parcelRepository } from "./data/parcel.repository";
import { ParcelsScreen } from "./ParcelsScreen";

/**
 * `@capacitor/app` mock'u — gerçek native köprü olmadan geri tuşu
 * mantığını izole test etmek için. Kaydedilen dinleyiciyi elle
 * tetikleyerek "kullanıcı geri tuşuna bastı" senaryosunu simüle
 * ediyoruz (bkz. native/appBackButton.ts).
 */
const backButtonListeners: Array<() => void> = [];
const exitAppMock = vi.fn();

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((_event: string, callback: () => void) => {
      backButtonListeners.push(callback);
      return Promise.resolve({ remove: vi.fn() });
    }),
    exitApp: () => exitAppMock(),
  },
}));

function pressBackButton() {
  act(() => {
    const latest = backButtonListeners[backButtonListeners.length - 1];
    latest();
  });
}

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
  backButtonListeners.length = 0;
  exitAppMock.mockClear();
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("ParcelsScreen — Navigasyon", () => {
  it("'Reference Trees' butonu onViewReferenceTrees'i çağırır", () => {
    const onViewReferenceTrees = vi.fn();
    render(<ParcelsScreen onViewTrees={vi.fn()} onViewReferenceTrees={onViewReferenceTrees} />);

    fireEvent.click(screen.getByText("Reference Trees"));

    expect(onViewReferenceTrees).toHaveBeenCalledTimes(1);
  });

  it("bir parseli düzenlerken 'View Trees' onViewTrees'i DOĞRU parselle çağırır", async () => {
    const parcel = await parcelRepository.create({
      name: "Kuzey Zeytinliği",
      cropType: "olive",
      areaDekar: 8,
    });
    const onViewTrees = vi.fn();

    render(<ParcelsScreen onViewTrees={onViewTrees} onViewReferenceTrees={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Kuzey Zeytinliği")).toBeTruthy());
    fireEvent.click(screen.getByText("Kuzey Zeytinliği"));

    await waitFor(() => expect(screen.getByText("View Trees")).toBeTruthy());
    fireEvent.click(screen.getByText("View Trees"));

    expect(onViewTrees).toHaveBeenCalledTimes(1);
    expect(onViewTrees.mock.calls[0][0]).toMatchObject({ id: parcel.id, name: "Kuzey Zeytinliği" });
  });

  it("oluşturma modunda (henüz kaydedilmemiş parsel) 'View Trees' butonu gösterilmez", async () => {
    render(<ParcelsScreen onViewTrees={vi.fn()} onViewReferenceTrees={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("No parcels yet. Tap \"Add Parcel\" to create your first one.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Parcel"));

    expect(screen.getByText("New Parcel")).toBeTruthy();
    expect(screen.queryByText("View Trees")).toBeNull();
  });
});

describe("ParcelsScreen — Android Geri Tuşu", () => {
  it("form açıkken geri tuşu, kaydetmeden listeye döner (İptal ile aynı)", async () => {
    render(<ParcelsScreen onViewTrees={vi.fn()} onViewReferenceTrees={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Parcel"));
    expect(screen.getByText("New Parcel")).toBeTruthy();

    pressBackButton();

    expect(screen.queryByText("New Parcel")).toBeNull();
    expect(screen.getByText("Add Parcel")).toBeTruthy(); // listeye dönüldü
  });

  it("ana listedeyken geri tuşu uygulamadan çıkışı tetikler (exitApp)", async () => {
    render(<ParcelsScreen onViewTrees={vi.fn()} onViewReferenceTrees={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());

    pressBackButton();

    expect(exitAppMock).toHaveBeenCalledTimes(1);
  });
});
