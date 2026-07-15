// @vitest-environment jsdom
/**
 * TreesScreen Bileşen Testleri
 * ===============================
 * i18n init deseni TreeForm.test.tsx ile aynı; veritabanı test deseni
 * (createTestDatabaseExecutor) tree.repository.test.ts/useTrees.test.ts
 * ile aynı — iki mevcut test altyapısının birleşimi, yeni bir desen
 * icat edilmedi (Kural 12).
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
import { treeRepository } from "./data/tree.repository";
import { TreesScreen } from "./TreesScreen";

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
  const parcel = await parcelRepository.create({
    name: "Test Parseli",
    cropType: "olive",
    areaDekar: 5,
  });
  return parcel.id;
}

describe("TreesScreen", () => {
  it("Loading State: mount sonrası hemen yükleniyor mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} />);

    expect(screen.getByText("Loading…")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull());
  });

  it("Empty State: hiç ağaç yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} />);

    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
  });

  it("Error State: repository hatası hata kartında gösterilir", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: veritabanı bağlantısı simülasyonu başarısız");
    });

    render(<TreesScreen mode={{ mode: "parcel", parcelId: "herhangi-bir-id" }} />);

    await waitFor(() =>
      expect(screen.getByText("Test: veritabanı bağlantısı simülasyonu başarısız")).toBeTruthy()
    );
  });

  it("Listeleme (Parcel Mode): sadece verilen parselin ağaçlarını gösterir", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelB, treeNumber: "B-1", variety: "Ayvalık" });

    render(<TreesScreen mode={{ mode: "parcel", parcelId: parcelA }} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    expect(screen.queryByText("B-1")).toBeNull();
  });

  it("Reference Mode görünümü: tüm parsellerdeki referans ağaçları gösterir", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({
      parcelId: parcelA,
      treeNumber: "A-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-2", variety: "Gemlik" });
    await treeRepository.create({
      parcelId: parcelB,
      treeNumber: "B-1",
      variety: "Ayvalık",
      isReferenceTree: true,
    });

    render(<TreesScreen mode={{ mode: "reference" }} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    expect(screen.getByText("B-1")).toBeTruthy();
    expect(screen.queryByText("A-2")).toBeNull(); // referans değil, Reference Mode'da görünmemeli
  });

  it("Kullanıcı etkileşimi: bir ağaca dokunmak onSelect'i doğru ağaçla çağırır", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    const onSelect = vi.fn();

    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onSelect={onSelect} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    fireEvent.click(screen.getByText("A-1"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({ treeNumber: "A-1" });
  });

  it("onSelect verilmediğinde bir ağaca dokunmak hata fırlatmaz", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });

    render(<TreesScreen mode={{ mode: "parcel", parcelId }} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    expect(() => fireEvent.click(screen.getByText("A-1"))).not.toThrow();
  });
});
