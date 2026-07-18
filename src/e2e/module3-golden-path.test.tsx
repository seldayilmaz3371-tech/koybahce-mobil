// @vitest-environment jsdom
/**
 * Modül 3 — Golden Path E2E Testi (Sprint 3.9)
 * ================================================
 * bkz. Sprint 3.9 Kabul Test Planı (onaylandı 2026-07-15).
 *
 * Parsel→Ağaç→Gözlem→2 Fotoğraf→Düzenle→Geri Dön→Veri Bütünlüğü
 * TEK bir uçtan uca akış olarak, GERÇEK UI etkileşimleriyle (fireEvent),
 * GERÇEK repository katmanına karşı (mock repository YOK) doğrulanıyor.
 *
 * Her ekran, App.tsx'in gerçekte yaptığı gibi AYRI AYRI render edilip
 * `cleanup()` ile kaldırılıyor (App.tsx tek bir sürekli komponent
 * ağacı değil, ekranlar arası geçişte önceki komponenti tamamen
 * kaldırıp yenisini monte ediyor) — bu, testin gerçek çalışma zamanı
 * davranışını birebir yansıtmasını sağlıyor. Ekranlar arası veri
 * akışı SADECE ortak test veritabanı üzerinden (gerçek repository
 * çağrılarıyla) sağlanıyor, App.tsx'in kendi navigasyon state'i
 * taklit edilmiyor (zaten ayrı ayrı test edildi).
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
import { photoRepository } from "../modules/photos/data/photo.repository";
import { ParcelsScreen } from "../modules/parcels/ParcelsScreen";
import { TreesScreen } from "../modules/trees/TreesScreen";
import { ObservationScreen } from "../modules/observations/ObservationScreen";
import { PhotoGalleryScreen } from "../modules/photos/PhotoGalleryScreen";

let takePhotoMock = vi.fn();
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
  Camera: {
    takePhoto: (...args: unknown[]) => takePhotoMock(...args),
    chooseFromGallery: vi.fn(),
  },
}));

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    copy: vi.fn().mockImplementation(async ({ to }: { to: string }) => ({
      uri: `/data/data/app/files/${to}`,
    })),
  },
  Directory: { Data: "DATA" },
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
  takePhotoMock = vi.fn().mockResolvedValue({
    uri: "/cache/temp.jpg",
    webPath: "capacitor://temp.jpg",
    saved: false,
    type: "photo",
  });
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("Modül 3 — Golden Path (Sprint 3.9)", () => {
  it("Parsel→Ağaç→Gözlem→2 Fotoğraf→Düzenle→Geri Dön→Veri Bütünlüğü", async () => {
    // ============ 1. YENİ PARSEL ============
    render(<ParcelsScreen onViewTrees={vi.fn()} onViewReferenceTrees={vi.fn()} onViewFinance={vi.fn()} onViewMaintenance={vi.fn()} onViewHarvest={vi.fn()} onViewAiChat={vi.fn()} onViewParcelAiChat={vi.fn()} onViewSettings={vi.fn()} onViewDashboard={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Add Parcel")).toBeTruthy());
    fireEvent.click(screen.getByText("Add Parcel"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Golden Path Parseli" } });
    fireEvent.change(screen.getByLabelText("Area (decares)"), { target: { value: "12.5" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    await waitFor(() => expect(screen.getByText("Golden Path Parseli")).toBeTruthy());
    cleanup();

    const parcels = await parcelRepository.list();
    const parcel = parcels.find((p) => p.name === "Golden Path Parseli");
    expect(parcel).toBeTruthy();

    // ============ 2. YENİ AĞAÇ ============
    render(
      <TreesScreen
        mode={{ mode: "parcel", parcelId: parcel!.id }}
        onBack={vi.fn()}
        onViewObservations={vi.fn()}
      onViewMaintenance={vi.fn()} onViewHarvest={vi.fn()} onViewAiChat={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText("Add Tree")).toBeTruthy());
    fireEvent.click(screen.getByText("Add Tree"));
    fireEvent.change(screen.getByLabelText("Tree Number"), { target: { value: "GP-1" } });
    fireEvent.change(screen.getByLabelText("Variety"), { target: { value: "Gemlik" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    await waitFor(() => expect(screen.getByText("GP-1")).toBeTruthy());
    cleanup();

    const trees = await treeRepository.listByParcel(parcel!.id);
    const tree = trees.find((t) => t.treeNumber === "GP-1");
    expect(tree).toBeTruthy();
    expect(tree!.parcelId).toBe(parcel!.id);

    // ============ 3. YENİ GÖZLEM ============
    render(
      <ObservationScreen
        scope={{ mode: "tree", treeId: tree!.id }}
        parcelId={parcel!.id}
        onBack={vi.fn()}
        onViewPhotos={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText("Add Observation")).toBeTruthy());
    fireEvent.click(screen.getByText("Add Observation"));
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "İlk gözlem notu" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    await waitFor(() => expect(screen.getByText(/İlk gözlem notu/)).toBeTruthy());
    cleanup();

    const observations = await observationRepository.listByTree(tree!.id);
    expect(observations).toHaveLength(1);
    const observation = observations[0];
    expect(observation.treeId).toBe(tree!.id);
    expect(observation.parcelId).toBe(parcel!.id);

    // ============ 4. 2 FOTOĞRAF ============
    render(<PhotoGalleryScreen observationId={observation.id} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    for (let i = 0; i < 2; i++) {
      await act(async () => {
        fireEvent.click(screen.getByText("Take Photo"));
      });
      expect(screen.getByText("Preview")).toBeTruthy();
      await act(async () => {
        fireEvent.click(screen.getByText("Save"));
      });
      await waitFor(() => expect(screen.queryByText("Preview")).toBeNull());
    }
    cleanup();

    const photos = await photoRepository.listByObservation(observation.id);
    expect(photos).toHaveLength(2);
    photos.forEach((p) => expect(p.observationId).toBe(observation.id));

    // ============ 5. DÜZENLE ============
    render(
      <ObservationScreen
        scope={{ mode: "tree", treeId: tree!.id }}
        parcelId={parcel!.id}
        onBack={vi.fn()}
        onViewPhotos={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText(/İlk gözlem notu/)).toBeTruthy());
    fireEvent.click(screen.getByText(/İlk gözlem notu/));
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "GÜNCELLENMİŞ not" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    await waitFor(() => expect(screen.getByText(/GÜNCELLENMİŞ not/)).toBeTruthy());
    cleanup();

    // ============ 6. "TEKRAR AÇ" — sıfırdan, sadece repository'lerle sorgula ============
    const finalParcel = await parcelRepository.getById(parcel!.id);
    const finalTree = await treeRepository.getById(tree!.id);
    const finalObservation = await observationRepository.getById(observation.id);
    const finalPhotos = await photoRepository.listByObservation(observation.id);

    // ============ VERİ BÜTÜNLÜĞÜ — TAM ZİNCİR ============
    expect(finalParcel).toMatchObject({ id: parcel!.id, name: "Golden Path Parseli", areaDekar: 12.5 });
    expect(finalTree).toMatchObject({ id: tree!.id, parcelId: finalParcel!.id, treeNumber: "GP-1" });
    expect(finalObservation).toMatchObject({
      id: observation.id,
      treeId: finalTree!.id,
      parcelId: finalParcel!.id,
      note: "GÜNCELLENMİŞ not",
    });
    expect(finalPhotos).toHaveLength(2);
    finalPhotos.forEach((p) => expect(p.observationId).toBe(finalObservation!.id));
  });
});
