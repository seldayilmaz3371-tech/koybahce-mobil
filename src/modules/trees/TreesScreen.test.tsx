// @vitest-environment jsdom
/**
 * TreesScreen Bileşen Testleri
 * ===============================
 * Sprint 2.5: CRUD akışı (Create/Edit/Delete/Cancel) + Navigation
 * (onBack) testleri eklendi, eski onSelect testleri (Sprint 2.4)
 * kaldırıldı — bileşen artık dokunulan ağacı doğrudan düzenleme
 * moduna açıyor (ParcelsScreen deseniyle tutarlı, Kural 12).
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
import { treeRepository } from "./data/tree.repository";
import { TreesScreen } from "./TreesScreen";

/** bkz. ParcelsScreen.test.tsx'teki aynı mock deseni. */
const backButtonListeners: Array<() => void> = [];

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((_event: string, callback: () => void) => {
      backButtonListeners.push(callback);
      return Promise.resolve({ remove: vi.fn() });
    }),
    exitApp: vi.fn(),
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
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);

    expect(screen.getByText("Loading…")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull());
  });

  it("Empty State: hiç ağaç yoksa boş durum mesajı gösterir", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
  });

  it("Error State: repository hatası ÇEVRİLMİŞ mesajla gösterilir, ham hata ASLA görünmez (Sprint 4.3.1)", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: veritabanı bağlantısı simülasyonu başarısız");
    });

    render(<TreesScreen mode={{ mode: "parcel", parcelId: "herhangi-bir-id" }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy());
    expect(screen.queryByText(/simülasyonu başarısız/)).toBeNull();
  });

  it("Listeleme (Parcel Mode): sadece verilen parselin ağaçlarını gösterir", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelB, treeNumber: "B-1", variety: "Ayvalık" });

    render(<TreesScreen mode={{ mode: "parcel", parcelId: parcelA }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);

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

    render(<TreesScreen mode={{ mode: "reference" }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    // Reference Mode'da 'Ekle' butonu bilinçli olarak gösterilmiyor (bkz. TreesScreen.tsx mimari notu).
    expect(screen.queryByText("Add Tree")).toBeNull();
  });

  it("Navigation: 'Parsellere Dön' butonu onBack'i çağırır", async () => {
    const parcelId = await createTestParcel();
    const onBack = vi.fn();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={onBack} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);

    fireEvent.click(screen.getByText("Back to Parcels"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Create: 'Ağaç Ekle' → form doldur → kaydet → yeni ağaç listede görünür", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
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
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
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
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());

    fireEvent.click(screen.getByText("A-1"));
    fireEvent.click(screen.getByText("Delete Tree"));

    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Cancel: formda İptal, listeye döner, hiçbir değişiklik kaydedilmez", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());

    fireEvent.click(screen.getByText("A-1"));
    fireEvent.change(screen.getByLabelText("Variety"), { target: { value: "DEĞİŞTİRİLMEMELİ" } });
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("A-1")).toBeTruthy();
    expect(screen.queryByText("DEĞİŞTİRİLMEMELİ")).toBeNull();
  });
});

describe("TreesScreen — Android Geri Tuşu", () => {
  it("form açıkken geri tuşu, kaydetmeden listeye döner", async () => {
    const parcelId = await createTestParcel();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Tree"));
    expect(screen.getByText("New Tree")).toBeTruthy();

    pressBackButton();

    expect(screen.queryByText("New Tree")).toBeNull();
    expect(screen.getByText("Add Tree")).toBeTruthy(); // listeye dönüldü
  });

  it("liste görünümündeyken geri tuşu onBack'i çağırır (Parsellere döner, uygulamadan ÇIKMAZ)", async () => {
    const parcelId = await createTestParcel();
    const onBack = vi.fn();
    render(<TreesScreen mode={{ mode: "parcel", parcelId }} onBack={onBack} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());

    pressBackButton();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("TreesScreen — Gözlemlere Yönlendirme (Sprint 3.5)", () => {
  it("bir ağacı düzenlerken 'View Observations' onViewObservations'ı DOĞRU ağaçla çağırır", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    const onViewObservations = vi.fn();

    render(
      <TreesScreen
        mode={{ mode: "parcel", parcelId }}
        onBack={() => {}}
        onViewObservations={onViewObservations}
      onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    fireEvent.click(screen.getByText("A-1"));

    await waitFor(() => expect(screen.getByText("View Observations")).toBeTruthy());
    fireEvent.click(screen.getByText("View Observations"));

    expect(onViewObservations).toHaveBeenCalledTimes(1);
    expect(onViewObservations.mock.calls[0][0]).toMatchObject({ treeNumber: "A-1", parcelId });
  });
});

describe("TreesScreen — Toplu Ağaç Oluşturma (Sprint 3.10)", () => {
  it("'Bulk Create' butonu SADECE Parcel Mode'da gösterilir", async () => {
    const parcelId = await createTestParcel();
    render(
      <TreesScreen
        mode={{ mode: "parcel", parcelId }}
        onBack={() => {}}
        onViewObservations={vi.fn()}
      onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText("Bulk Create")).toBeTruthy());

    cleanup();

    render(<TreesScreen mode={{ mode: "reference" }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
    expect(screen.queryByText("Bulk Create")).toBeNull();
  });

  it("Madde 3 — canlı önizleme, başlangıç/adet girilirken güncellenir ('151 → 155 · Total: 5 Trees')", async () => {
    const parcelId = await createTestParcel();
    render(
      <TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Bulk Create")).toBeTruthy());
    fireEvent.click(screen.getByText("Bulk Create"));

    fireEvent.change(screen.getByLabelText("Start Number"), { target: { value: "151" } });
    fireEvent.change(screen.getByLabelText("Number of Trees"), { target: { value: "5" } });

    expect(screen.getByText("151 → 155 · Total: 5 Trees")).toBeTruthy();
  });

  it("variety BOŞ bırakılarak (isteğe bağlı) toplu oluşturma başarıyla tamamlanır", async () => {
    const parcelId = await createTestParcel();
    render(
      <TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Bulk Create")).toBeTruthy());
    fireEvent.click(screen.getByText("Bulk Create"));

    fireEvent.change(screen.getByLabelText("Start Number"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Number of Trees"), { target: { value: "3" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    // Madde 4 — başarı özeti gösterilir.
    await waitFor(() => expect(screen.getByText("Trees Created")).toBeTruthy());
    expect(screen.getByText("3 trees created (1-3)")).toBeTruthy();

    fireEvent.click(screen.getByText("OK"));

    await waitFor(() => expect(screen.getByText("1")).toBeTruthy());
    const created = await treeRepository.listByParcel(parcelId);
    expect(created).toHaveLength(3);
    created.forEach((t) => expect(t.variety).toBe(""));
  });

  it("Madde 2 — çakışan numara varsa, ÇEVRİLMİŞ ve AÇIK bir hata gösterilir, ham SQLite hatası GÖSTERİLMEZ", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "5", variety: "Gemlik" });

    render(
      <TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Bulk Create")).toBeTruthy());
    fireEvent.click(screen.getByText("Bulk Create"));

    fireEvent.change(screen.getByLabelText("Start Number"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Number of Trees"), { target: { value: "10" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(
      screen.getByText("The following tree numbers already exist in this parcel: 5")
    ).toBeTruthy();
    expect(screen.queryByText(/UNIQUE constraint/)).toBeNull();
    expect(screen.queryByText("Trees Created")).toBeNull(); // başarı ekranına GEÇİLMEDİ

    // Hiçbir yeni ağaç oluşmadı — sadece önceden var olan "5".
    const allTrees = await treeRepository.listByParcel(parcelId);
    expect(allTrees).toHaveLength(1);
  });

  it("Cancel: toplu oluşturma formunda vazgeçmek listeye döner, HİÇBİR ağaç oluşturulmaz", async () => {
    const parcelId = await createTestParcel();
    render(
      <TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Bulk Create")).toBeTruthy());
    fireEvent.click(screen.getByText("Bulk Create"));

    fireEvent.change(screen.getByLabelText("Start Number"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Number of Trees"), { target: { value: "5" } });
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());
    const allTrees = await treeRepository.listByParcel(parcelId);
    expect(allTrees).toHaveLength(0);
  });
});

describe("TreesScreen — Bakıma Yönlendirme (Sprint 5.3)", () => {
  it("bir ağacı düzenlerken 'View Maintenance' onViewMaintenance'i DOĞRU ağaçla çağırır", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "M-1", variety: "Gemlik" });
    const onViewMaintenance = vi.fn();

    render(
      <TreesScreen
        mode={{ mode: "parcel", parcelId }}
        onBack={() => {}}
        onViewObservations={vi.fn()}
        onViewMaintenance={onViewMaintenance} onViewAiChat={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText("M-1")).toBeTruthy());
    fireEvent.click(screen.getByText("M-1"));

    await waitFor(() => expect(screen.getByText("View Maintenance")).toBeTruthy());
    fireEvent.click(screen.getByText("View Maintenance"));

    expect(onViewMaintenance).toHaveBeenCalledTimes(1);
    expect(onViewMaintenance.mock.calls[0][0]).toMatchObject({ treeNumber: "M-1", parcelId });
  });

  it("Referans Modu'nda da 'View Maintenance' AYNI şekilde çalışır (Sprint 5.3, özel bir ayrım yok)", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({
      parcelId,
      treeNumber: "REF-M-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    const onViewMaintenance = vi.fn();

    render(
      <TreesScreen
        mode={{ mode: "reference" }}
        onBack={() => {}}
        onViewObservations={vi.fn()}
        onViewMaintenance={onViewMaintenance} onViewAiChat={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText("REF-M-1")).toBeTruthy());
    fireEvent.click(screen.getByText("REF-M-1"));
    await waitFor(() => expect(screen.getByText("View Maintenance")).toBeTruthy());
    fireEvent.click(screen.getByText("View Maintenance"));

    expect(onViewMaintenance).toHaveBeenCalledTimes(1);
  });

  it("oluşturma modunda (henüz kaydedilmemiş ağaç) 'View Maintenance' butonu gösterilmez", async () => {
    const parcelId = await createTestParcel();
    render(
      <TreesScreen mode={{ mode: "parcel", parcelId }} onBack={() => {}} onViewObservations={vi.fn()} onViewMaintenance={vi.fn()} onViewAiChat={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Add Tree")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Tree"));

    expect(screen.queryByText("View Maintenance")).toBeNull();
  });
});
