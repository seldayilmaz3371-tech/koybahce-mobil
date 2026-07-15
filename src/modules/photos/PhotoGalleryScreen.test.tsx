// @vitest-environment jsdom
/**
 * PhotoGalleryScreen Bileşen Testleri
 * ======================================
 * bkz. Sprint 3.7 UX + Veri Modeli Doğrulaması. `@capacitor/camera` ve
 * `@capacitor/filesystem` mock'lanıyor — native köprü olmadan akış
 * mantığını (önizleme → onay → çift-kayıt koruması) test etmek için.
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
import { treeRepository } from "../trees/data/tree.repository";
import { observationRepository } from "../observations/data/observation.repository";
import { photoRepository } from "./data/photo.repository";
import { PhotoGalleryScreen } from "./PhotoGalleryScreen";

const backButtonListeners: Array<() => void> = [];
let takePhotoMock = vi.fn();

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((_event: string, callback: () => void) => {
      backButtonListeners.push(callback);
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
    copy: vi.fn().mockResolvedValue({ uri: "/data/data/app/files/bahcem-photos/test-permanent.jpg" }),
  },
  Directory: { Data: "DATA" },
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
  takePhotoMock = vi.fn().mockResolvedValue({
    uri: "/cache/temp-photo.jpg",
    webPath: "capacitor://temp-photo.jpg",
    saved: false,
    type: "photo",
  });
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

async function createTestChain(): Promise<string> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  const observation = await observationRepository.create({
    parcelId: parcel.id,
    treeId: tree.id,
    observationType: "general",
    observedAt: "2026-01-01T00:00:00.000Z",
  });
  return observation.id;
}

describe("PhotoGalleryScreen", () => {
  it("Empty State: hiç fotoğraf yoksa boş durum mesajı gösterir", async () => {
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());
  });

  it("Çekim → Önizleme: kamera fotoğrafı döndürünce önizleme ekranı açılır", async () => {
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });

    expect(screen.getByText("Preview")).toBeTruthy();
    expect(takePhotoMock).toHaveBeenCalledTimes(1);
  });

  it("Madde 1-2 — ÇİFT KAYIT KORUMASI: önizlemede Kaydet'e art arda basmak sadece BİR fotoğraf oluşturur", async () => {
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(screen.getByText("Preview")).toBeTruthy();

    // Art arda iki tıklama — isSubmitting deseni ikinci tıklamayı
    // engellemeli (buton disabled olur).
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.queryByText("Preview")).toBeNull());
    const list = await photoRepository.listByObservation(observationId);
    expect(list).toHaveLength(1);
  });

  it("Discard: önizlemede vazgeçmek fotoğrafı KAYDETMEZ, listeye döner", async () => {
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(screen.getByText("Preview")).toBeTruthy();

    fireEvent.click(screen.getByText("Discard"));

    expect(screen.queryByText("Preview")).toBeNull();
    const list = await photoRepository.listByObservation(observationId);
    expect(list).toHaveLength(0);
  });

  it("Kaydedilen fotoğraf, kalıcı depodaki (Filesystem.copy sonucu) yolu kullanır — geçici yolu DEĞİL", async () => {
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    const list = await photoRepository.listByObservation(observationId);
    expect(list[0].filePath).toBe("/data/data/app/files/bahcem-photos/test-permanent.jpg");
  });

  it("Madde 8 — Çekim başarısız olursa (izin reddi vb.) çevrilmiş, engelleyici olmayan bir hata gösterir", async () => {
    takePhotoMock = vi.fn().mockRejectedValue(new Error("User denied camera permission"));
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });

    expect(
      screen.getByText("Could not access the camera or gallery. Please check app permissions in your device settings.")
    ).toBeTruthy();
    // Ham hata mesajı ("User denied camera permission") HİÇBİR YERDE gösterilmemeli.
    expect(screen.queryByText(/User denied/)).toBeNull();
  });

  it("Delete: mevcut bir fotoğrafı silmek listeden kaldırır", async () => {
    const observationId = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("Delete Photo")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Delete Photo"));
    });

    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Android Geri Tuşu: önizlemedeyken geri tuşu listeye döner (kaydetmeden)", async () => {
    const observationId = await createTestChain();
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(screen.getByText("Preview")).toBeTruthy();

    pressBackButton();

    expect(screen.queryByText("Preview")).toBeNull();
    const list = await photoRepository.listByObservation(observationId);
    expect(list).toHaveLength(0);
  });

  it("Android Geri Tuşu: liste görünümündeyken geri tuşu onBack'i çağırır", async () => {
    const observationId = await createTestChain();
    const onBack = vi.fn();
    render(<PhotoGalleryScreen observationId={observationId} onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("No photos yet.")).toBeTruthy());

    pressBackButton();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
