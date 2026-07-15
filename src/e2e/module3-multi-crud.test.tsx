// @vitest-environment jsdom
/**
 * Modül 3 — Çoklu Gözlem/Fotoğraf + Düzenleme/Silme (Sprint 3.9, Madde 2)
 * ===========================================================================
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
import { ObservationScreen } from "../modules/observations/ObservationScreen";
import { PhotoGalleryScreen } from "../modules/photos/PhotoGalleryScreen";

let takePhotoMock = vi.fn();
vi.mock("@capacitor/app", () => ({
  App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }), exitApp: vi.fn() },
}));
vi.mock("@capacitor/camera", () => ({
  Camera: { takePhoto: (...args: unknown[]) => takePhotoMock(...args), chooseFromGallery: vi.fn() },
}));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    copy: vi.fn().mockImplementation(async ({ to }: { to: string }) => ({ uri: `/data/${to}` })),
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

async function createTestParcelAndTree(): Promise<{ parcelId: string; treeId: string }> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  return { parcelId: parcel.id, treeId: tree.id };
}

async function capturePhoto() {
  await act(async () => {
    fireEvent.click(screen.getByText("Take Photo"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Save"));
  });
  await waitFor(() => expect(screen.queryByText("Preview")).toBeNull());
}

describe("Modül 3 — Çoklu Gözlem/Fotoğraf + Düzenleme/Silme (Sprint 3.9, Madde 2)", () => {
  it("bir ağaca 3 gözlem eklenir, her birine 2 fotoğraf eklenir — hepsi doğru ilişkilerle kalır", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();

    const observationIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const obs = await observationRepository.create({
        parcelId,
        treeId,
        observationType: "general",
        observedAt: `2026-0${i + 1}-01T00:00:00.000Z`,
      });
      observationIds.push(obs.id);

      render(<PhotoGalleryScreen observationId={obs.id} onBack={() => {}} />);
      await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());
      await capturePhoto();
      await capturePhoto();
      cleanup();
    }

    const allObservations = await observationRepository.listByTree(treeId);
    expect(allObservations).toHaveLength(3);

    for (const obsId of observationIds) {
      const photos = await photoRepository.listByObservation(obsId);
      expect(photos).toHaveLength(2);
      photos.forEach((p) => expect(p.observationId).toBe(obsId));
    }
  });

  it("bir gözlemi düzenlemek diğer gözlemleri/fotoğraflarını ETKİLEMEZ", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    const obsA = await observationRepository.create({
      parcelId,
      treeId,
      observationType: "general",
      note: "A notu",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    const obsB = await observationRepository.create({
      parcelId,
      treeId,
      observationType: "health_concern",
      note: "B notu",
      observedAt: "2026-01-02T00:00:00.000Z",
    });
    await photoRepository.create({ observationId: obsA.id, filePath: "/data/a1.jpg" });
    await photoRepository.create({ observationId: obsB.id, filePath: "/data/b1.jpg" });

    render(
      <ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} onBack={() => {}} onViewPhotos={() => {}} />
    );
    await waitFor(() => expect(screen.getByText(/A notu/)).toBeTruthy());
    fireEvent.click(screen.getByText(/A notu/));
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "A GÜNCELLENDİ" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    cleanup();

    const finalA = await observationRepository.getById(obsA.id);
    const finalB = await observationRepository.getById(obsB.id);
    expect(finalA?.note).toBe("A GÜNCELLENDİ");
    expect(finalB?.note).toBe("B notu"); // DEĞİŞMEMELİ

    const photosA = await photoRepository.listByObservation(obsA.id);
    const photosB = await photoRepository.listByObservation(obsB.id);
    expect(photosA).toHaveLength(1);
    expect(photosB).toHaveLength(1); // DEĞİŞMEMELİ
  });

  it("bir gözlemi silmek (soft-delete) ona bağlı fotoğrafları FİZİKSEL OLARAK silmez, ama gözlem listede görünmez", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    const obs = await observationRepository.create({
      parcelId,
      treeId,
      observationType: "general",
      note: "Silinecek gözlem",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    const photo = await photoRepository.create({ observationId: obs.id, filePath: "/data/1.jpg" });

    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} onBack={() => {}} onViewPhotos={() => {}} />
    );
    await waitFor(() => expect(screen.getByText(/Silinecek gözlem/)).toBeTruthy());
    fireEvent.click(screen.getByText(/Silinecek gözlem/));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete Observation"));
    });
    cleanup();
    vi.restoreAllMocks();

    // Gözlem artık AKTİF listede yok.
    const activeObservations = await observationRepository.listByTree(treeId);
    expect(activeObservations).toHaveLength(0);

    // Ama fotoğraf FİZİKSEL OLARAK hâlâ veritabanında (soft-delete —
    // Dijital Bahçe Hafızası ilkesi, veri asla fiziksel silinmez).
    const photoStillExists = await photoRepository.getById(photo.id);
    expect(photoStillExists).not.toBeNull();
  });
});
