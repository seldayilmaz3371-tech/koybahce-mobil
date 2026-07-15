// @vitest-environment jsdom
/**
 * TreesScreen Bileşen Testleri
 * ===============================
 * Sprint 2.5: CRUD akışı (Create/Edit/Delete/Cancel) + Navigation
 * (onBack) testleri eklendi, eski onSelect testleri (Sprint 2.4)
 * kaldırıldı — bileşen artık dokunulan ağacı doğrudan düzenleme
 * moduna açıyor (ParcelsScreen deseniyle tutarlı, Kural 12).
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
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} />);

    expect(screen.getByText("Loading…")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull());
  });

  it("Empty State: hiç ağaç yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
  });

  it("Error State: repository hatası hata kartında gösterilir", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: veritabanı bağlantısı simülasyonu başarısız");
    });

    render(<TreesScreen mode={{ mode: "parcel", parcelId: "herhangi-bir-id" }} onBack={() => {}} />);

    await waitFor(() =>
      expect(screen.getByText("Test: veritabanı bağlantısı simülasyonu başarısız")).toBeTruthy()
    );
  });

  it("Listeleme (Parcel Mode): sadece verilen parselin ağaçlarını gösterir", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelB, treeNumber: "B-1", variety: "Ayvalık" });

    render(<TreesScreen mode={{ mode: "parcel", parcelId: parcelA }} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    expect(screen.queryByText("B-1")).toBeNull();
  });

  it("Reference Mode görünümü: tüm parsellerdeki referans ağaçları gösterir, 'Ekle' butonu YOK", async () => {
    const parcelA = await createTestParcel();
    await treeRepository.create({
      parcelId: parcelA,
      treeNumber: "A-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });

    render(<TreesScreen mode={{ mode: "reference" }} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    // Reference Mode'da 'Ekle' butonu bilinçli olarak gösterilmiyor (bkz. TreesScreen.tsx mimari notu).
    expect(screen.queryByText("Add Tree")).toBeNull();
  });

  it("Navigation: 'Parsellere Dön' butonu onBack'i çağırır", async () => {
    const parcelId = await createTestParcel();
    const onBack = vi.fn();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={onBack} />);

    fireEvent.click(screen.getByText("Back to Parcels"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Create: 'Ağaç Ekle' → form doldur → kaydet → yeni ağaç listede görünür", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Tree"));
    expect(screen.getByText("New Tree")).toBeTruthy(); // form açıldı

    fireEvent.change(screen.getByLabelText("Tree Number"), { target: { value: "A-1" } });
    fireEvent.change(screen.getByLabelText("Variety"), { target: { value: "Gemlik" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    expect(screen.queryByText("New Tree")).toBeNull(); // listeye dönüldü
  });

  it("Edit: bir ağaca dokunmak düzenleme formunu doğru verilerle açar, kaydetmek listeyi günceller", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());

    fireEvent.click(screen.getByText("A-1"));

    expect(screen.getByText("Edit Tree")).toBeTruthy();
    expect((screen.getByLabelText("Tree Number") as HTMLInputElement).value).toBe("A-1");

    fireEvent.change(screen.getByLabelText("Variety"), { target: { value: "Ayvalık" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(screen.getByText("Ayvalık")).toBeTruthy());
  });

  it("Delete: düzenleme formundan silme, onay sonrası ağacı listeden kaldırır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());

    fireEvent.click(screen.getByText("A-1"));
    fireEvent.click(screen.getByText("Delete Tree"));

    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Cancel: formda İptal, listeye döner, hiçbir değişiklik kaydedilmez", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());

    fireEvent.click(screen.getByText("A-1"));
    fireEvent.change(screen.getByLabelText("Variety"), { target: { value: "DEĞİŞTİRİLMEMELİ" } });
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("A-1")).toBeTruthy();
    expect(screen.queryByText("DEĞİŞTİRİLMEMELİ")).toBeNull();
  });
});
