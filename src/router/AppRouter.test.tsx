// @vitest-environment jsdom
/**
 * AppRouter Testleri (Sprint 4.0.1)
 * ====================================
 * Router wiring'in KENDİSİNİ test ediyor — Screen bileşenlerinin iç
 * mantığı zaten kendi test dosyalarında kapsanıyor (buraya tekrar
 * edilmiyor, Kural 12). Odak: doğru rota → doğru ekran → doğru
 * prop'lar, `navigate()` zinciri, `ObservationScreenRoute`'un
 * `treeId`'den `Tree` çekme mantığı, geri tuşu boşluk-kapatıcı.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/locales/en/common.json";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../data/db/migrations/schema";
import { parcelRepository } from "../modules/parcels/data/parcel.repository";
import { treeRepository } from "../modules/trees/data/tree.repository";
import { observationRepository } from "../modules/observations/data/observation.repository";
import { maintenanceRepository } from "../modules/maintenance/data/maintenance.repository";
import { AppRouter } from "./AppRouter";

const backButtonListeners: Array<() => void> = [];
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((_e: string, cb: () => void) => {
      backButtonListeners.push(cb);
      return Promise.resolve({ remove: vi.fn() });
    }),
    exitApp: vi.fn(),
  },
}));
vi.mock("@capacitor/camera", () => ({
  Camera: { takePhoto: vi.fn(), chooseFromGallery: vi.fn() },
}));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { mkdir: vi.fn(), copy: vi.fn() },
  Directory: { Data: "DATA" },
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { convertFileSrc: (p: string) => `capacitor://localhost/_capacitor_file_${p}` },
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
  backButtonListeners.length = 0;
  window.location.hash = "";
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("AppRouter — Rota Yönlendirme", () => {
  it("uygulama ilk açıldığında (hash boş) Parsellere yönlendirir", async () => {
    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
    expect(window.location.hash).toBe("#/parcels");
  });

  it("bilinmeyen bir rota Parsellere yönlendirir (404 fallback)", async () => {
    window.location.hash = "#/hicbir-yer";
    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });

  it("Parsel → Ağaç: 'View Trees' doğru parcelId ile TreesScreen'e gider", async () => {
    const parcel = await parcelRepository.create({ name: "Test P", cropType: "olive", areaDekar: 5 });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Test P")).toBeTruthy());
    fireEvent.click(screen.getByText("Test P"));
    await waitFor(() => expect(screen.getByText("View Trees")).toBeTruthy());
    fireEvent.click(screen.getByText("View Trees"));

    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    expect(window.location.hash).toBe(`#/parcels/${parcel.id}/trees`);
  });

  it("Ağaç → Parsel: geri tuşu (navigate(-1)) doğru şekilde döner", async () => {
    const parcel = await parcelRepository.create({ name: "Test P", cropType: "olive", areaDekar: 5 });
    window.location.hash = `#/parcels/${parcel.id}/trees`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());

    act(() => {
      backButtonListeners[backButtonListeners.length - 1]();
    });

    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });

  it("Ağaç → Gözlem: ObservationScreenRoute, treeId'den Tree'yi doğru çeker (parcelId + contextLabel)", async () => {
    const parcel = await parcelRepository.create({ name: "Test P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    window.location.hash = `#/parcels/${parcel.id}/trees`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("A-1")).toBeTruthy());
    fireEvent.click(screen.getByText("A-1"));
    await waitFor(() => expect(screen.getByText("View Observations")).toBeTruthy());
    fireEvent.click(screen.getByText("View Observations"));

    // contextLabel doğru Tree verisinden üretildi (treeNumber — variety).
    await waitFor(() => expect(screen.getByText("A-1 — Gemlik")).toBeTruthy());
    expect(window.location.hash).toBe(`#/trees/${tree.id}/observations`);
  });

  it("Geçersiz/var olmayan treeId ile ObservationScreenRoute Parsellere yönlendirir", async () => {
    window.location.hash = "#/trees/var-olmayan-id/observations";

    render(<AppRouter />);

    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });

  it("Gözlem → Fotoğraf: onViewPhotos doğru observationId ile PhotoGalleryScreen'e gider", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    const observation = await observationRepository.create({
      parcelId: parcel.id,
      treeId: tree.id,
      observationType: "general",
      note: "Test gözlemi",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    window.location.hash = `#/trees/${tree.id}/observations`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText(/Test gözlemi/)).toBeTruthy());
    fireEvent.click(screen.getByText(/Test gözlemi/));
    await waitFor(() => expect(screen.getByText("View Photos")).toBeTruthy());
    fireEvent.click(screen.getByText("View Photos"));

    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());
    expect(window.location.hash).toBe(`#/observations/${observation.id}/photos`);
  });

  it("Referans Ağaçlar: doğru rotaya gider, sadece referans ağaçları listeler", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    await treeRepository.create({
      parcelId: parcel.id,
      treeNumber: "REF-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "B-1", variety: "Ayvalık" });

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Reference Trees")).toBeTruthy());
    fireEvent.click(screen.getByText("Reference Trees"));

    await waitFor(() => expect(screen.getByText("REF-1")).toBeTruthy());
    expect(screen.queryByText("B-1")).toBeNull();
    expect(window.location.hash).toBe("#/reference-trees");
  });

  it("Uçtan uca zincir: Parsel→Ağaç→Gözlem→Fotoğraf ileri git, sonra 3 kez geri tuşuyla Parsellere dön", async () => {
    const parcel = await parcelRepository.create({ name: "Zincir P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "Z-1", variety: "Gemlik" });
    await observationRepository.create({
      parcelId: parcel.id,
      treeId: tree.id,
      observationType: "general",
      note: "Zincir gözlemi",
      observedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Zincir P")).toBeTruthy());
    fireEvent.click(screen.getByText("Zincir P"));
    fireEvent.click(await screen.findByText("View Trees"));
    fireEvent.click(await screen.findByText("Z-1"));
    fireEvent.click(await screen.findByText("View Observations"));
    await waitFor(() => expect(screen.getByText(/Zincir gözlemi/)).toBeTruthy());
    fireEvent.click(screen.getByText(/Zincir gözlemi/));
    fireEvent.click(await screen.findByText("View Photos"));
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    // Fotoğraf ekranı → Gözlem ekranına dön.
    act(() => backButtonListeners[backButtonListeners.length - 1]());
    await waitFor(() => expect(screen.getByText(/Zincir gözlemi/)).toBeTruthy());

    // Gözlem ekranı → Ağaç ekranına dön.
    act(() => backButtonListeners[backButtonListeners.length - 1]());
    await waitFor(() => expect(screen.getByText("Z-1")).toBeTruthy());

    // Ağaç ekranı → Parsel ekranına dön.
    act(() => backButtonListeners[backButtonListeners.length - 1]());
    await waitFor(() => expect(screen.getByText("Zincir P")).toBeTruthy());
  });

  it("Parsel → Finans: 'View Finance' doğru parcelId ile FinanceScreen'e gider, kayıt oluşturma çalışır (Sprint 4.3)", async () => {
    const parcel = await parcelRepository.create({ name: "Finans P", cropType: "olive", areaDekar: 5 });

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Finans P")).toBeTruthy());
    fireEvent.click(screen.getByText("Finans P"));
    await waitFor(() => expect(screen.getByText("View Finance")).toBeTruthy());
    fireEvent.click(screen.getByText("View Finance"));

    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());
    expect(window.location.hash).toBe(`#/parcels/${parcel.id}/finance`);

    fireEvent.click(screen.getByText("Add Record"));
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "750" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/750/)).toBeTruthy());
  });

  it("Finans → Parsel: geri tuşu (navigate(-1)) doğru şekilde döner (Sprint 4.3)", async () => {
    const parcel = await parcelRepository.create({ name: "Finans P", cropType: "olive", areaDekar: 5 });
    window.location.hash = `#/parcels/${parcel.id}/finance`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("No finance records yet.")).toBeTruthy());

    act(() => backButtonListeners[backButtonListeners.length - 1]());

    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });

  it("Parsel → Bakım: 'View Maintenance' doğru parcelId ile MaintenanceScreen'e gider, kayıt oluşturma çalışır (Sprint 5.3)", async () => {
    const parcel = await parcelRepository.create({ name: "Bakım P", cropType: "olive", areaDekar: 5 });

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("Bakım P")).toBeTruthy());
    fireEvent.click(screen.getByText("Bakım P"));
    await waitFor(() => expect(screen.getByText("View Maintenance")).toBeTruthy());
    fireEvent.click(screen.getByText("View Maintenance"));

    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());
    // Parametre aktarımı — doğru parcelId ile rotaya gidildi.
    expect(window.location.hash).toBe(`#/parcels/${parcel.id}/maintenance`);

    fireEvent.click(screen.getByText("Add Record"));
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Irrigation/)).toBeTruthy());
  });

  it("Bakım → Parsel: geri tuşu doğru şekilde döner (Sprint 5.3)", async () => {
    const parcel = await parcelRepository.create({ name: "Bakım P", cropType: "olive", areaDekar: 5 });
    window.location.hash = `#/parcels/${parcel.id}/maintenance`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());

    act(() => backButtonListeners[backButtonListeners.length - 1]());

    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });

  it("Ağaç → Bakım: 'View Maintenance' doğru treeId ile TreeMaintenanceScreenRoute'a gider, Tree'den DOĞRU parcelId çekilir (Sprint 5.3, Context Preservation)", async () => {
    const parcel = await parcelRepository.create({ name: "Ağaç Bakım P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "M-1", variety: "Gemlik" });
    window.location.hash = `#/parcels/${parcel.id}/trees`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("M-1")).toBeTruthy());
    fireEvent.click(screen.getByText("M-1"));
    await waitFor(() => expect(screen.getByText("View Maintenance")).toBeTruthy());
    fireEvent.click(screen.getByText("View Maintenance"));

    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());
    expect(window.location.hash).toBe(`#/trees/${tree.id}/maintenance`);

    // Kayıt oluştur — DOĞRU parcelId ile ilişkilendirildiğini
    // (Tree'den doğru çekildiğini) dolaylı olarak kanıtlıyoruz: kayıt
    // parselin GENEL bakım listesinde de görünmeli.
    fireEvent.click(screen.getByText("Add Record"));
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    await waitFor(() => expect(screen.getByText(/Irrigation/)).toBeTruthy());

    const parcelWideRecords = await maintenanceRepository.listByParcel(parcel.id);
    expect(parcelWideRecords).toHaveLength(1);
    expect(parcelWideRecords[0].treeId).toBe(tree.id);
  });

  it("Geçersiz/var olmayan treeId ile Bakım rotası Parsellere yönlendirir (Sprint 5.3)", async () => {
    window.location.hash = "#/trees/var-olmayan-id/maintenance";

    render(<AppRouter />);

    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });

  it("Referans Ağaç → Bakım: Referans Modu'ndan da AYNI şekilde çalışır (Sprint 5.3, Madde 4 — özel bir ayrım yok)", async () => {
    const parcel = await parcelRepository.create({ name: "Ref P", cropType: "olive", areaDekar: 5 });
    const referenceTree = await treeRepository.create({
      parcelId: parcel.id,
      treeNumber: "REF-M-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    window.location.hash = "#/reference-trees";

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("REF-M-1")).toBeTruthy());
    fireEvent.click(screen.getByText("REF-M-1"));
    await waitFor(() => expect(screen.getByText("View Maintenance")).toBeTruthy());
    fireEvent.click(screen.getByText("View Maintenance"));

    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());
    expect(window.location.hash).toBe(`#/trees/${referenceTree.id}/maintenance`);
  });

  it("Bakım (Ağaç Modu) → geri tuşu doğru şekilde döner (Sprint 5.3)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    window.location.hash = `#/trees/${tree.id}/maintenance`;

    render(<AppRouter />);
    await waitFor(() => expect(screen.getByText("No maintenance records yet.")).toBeTruthy());

    act(() => backButtonListeners[backButtonListeners.length - 1]());

    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
  });
});
