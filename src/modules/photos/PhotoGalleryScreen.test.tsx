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

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    // Gerçek WebView dönüşümünü simüle ediyor — girdi yolunun
    // KENDİSİNİ değil, dönüştürülmüş olduğunu ayırt edilebilir kılan
    // bir öneki test edebilmemiz için (Sprint 3.10.1, Hata 2 kanıtı).
    convertFileSrc: (filePath: string) => `capacitor://localhost/_capacitor_file_${filePath}`,
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
  // bkz. Sprint 10.5 — jsdom'un `window.scrollTo`'yu implemente
  // ETMEMESİ (GERÇEK bir davranış sorunu DEĞİL, sadece jsdom'un test
  // ortamı sınırlaması) konsolu "Not implemented" uyarılarıyla
  // kirletiyordu. Genel bir stub, TÜM testler için varsayılan güvenli
  // davranış sağlıyor — scroll koruma testinin KENDİSİ bunu KENDİ
  // spy'ıyla override ediyor (aşağıda).
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
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

describe("PhotoGalleryScreen — Sprint 3.10.1 Hotfix (Hata 2: Fotoğraf Görünmüyor)", () => {
  it("kaydedilmiş bir fotoğrafın <img> src'i, ham file_path DEĞİL, Capacitor.convertFileSrc() ÇIKTISI", async () => {
    // KÖK NEDEN KANITI: `photo.filePath` (Filesystem.copy()'nin ham
    // çıktısı) Android WebView'de `<img src>` olarak YÜKLENEMEZ.
    // `Capacitor.convertFileSrc()` çağrılmadan bu test BAŞARISIZ olurdu
    // (src, ham `filePath`'e eşit kalırdı) — gerçek cihazdaki boş
    // görsel hatasının doğrudan kanıtı.
    const observationId = await createTestChain();
    const rawFilePath = "/data/data/app/files/bahcem-photos/existing.jpg";
    await photoRepository.create({ observationId, filePath: rawFilePath });

    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("Delete Photo")).toBeTruthy());

    const img = document.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain("_capacitor_file_");
    expect(img.src).not.toBe(rawFilePath); // HAM yol asla doğrudan kullanılmamalı
    expect(img.src).toContain(rawFilePath); // ama dönüştürülmüş yol, orijinal yolu İÇERMELİ
  });

  it("kaydedilmiş fotoğraflar loading='lazy' ile render edilir (Sprint 4.3.1 — düşük maliyetli perf iyileştirmesi)", async () => {
    const observationId = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });

    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("Delete Photo")).toBeTruthy());

    const img = document.querySelector("img") as HTMLImageElement;
    // NOT: jsdom, `img.loading` IDL özelliğini desteklemiyor (gerçek
    // bir bulgu — testi yazarken keşfedildi, `undefined` döndürüyordu).
    // HTML özniteliğinin kendisini (`getAttribute`) doğrudan kontrol
    // ediyoruz, DOM'da GERÇEKTEN `loading="lazy"` yazdığını kanıtlıyor.
    expect(img.getAttribute("loading")).toBe("lazy");
  });
});

describe("PhotoGalleryScreen — Error Code Standard (Sprint 4.3.1)", () => {
  it("repository hatası ÇEVRİLMİŞ mesajla gösterilir, ham hata ASLA görünmez", async () => {
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("SQLITE_CONSTRAINT: test hatası, teknik detay");
    });

    render(<PhotoGalleryScreen observationId="herhangi-id" onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy());
    expect(screen.queryByText(/SQLITE_CONSTRAINT/)).toBeNull();
  });
});

describe("PhotoGalleryScreen — 'AI ile Analiz Et' Girişi (Sprint 10.5)", () => {
  it("onAnalyze SAĞLANMIŞSA, HER fotoğraf satırında 'Analyze with AI' butonu GÖRÜNÜR", async () => {
    const observationId = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });
    await photoRepository.create({ observationId, filePath: "/data/photos/2.jpg" });

    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} onAnalyze={vi.fn()} />);

    await waitFor(() => expect(screen.getAllByText("Analyze with AI")).toHaveLength(2));
  });

  it("onAnalyze SAĞLANMAZSA (opsiyonel prop), buton HİÇ GÖRÜNMEZ — mevcut davranış BOZULMAZ", async () => {
    const observationId = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });

    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText("Delete Photo")).toBeTruthy());
    expect(screen.queryByText("Analyze with AI")).toBeNull();
  });

  it("butona tıklamak onAnalyze'ı DOĞRU fotoğraf nesnesiyle çağırır", async () => {
    const observationId = await createTestChain();
    const photo = await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });
    const onAnalyze = vi.fn();

    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} onAnalyze={onAnalyze} />);
    await waitFor(() => expect(screen.getByText("Analyze with AI")).toBeTruthy());

    fireEvent.click(screen.getByText("Analyze with AI"));

    expect(onAnalyze).toHaveBeenCalledWith(expect.objectContaining({ id: photo.id }));
  });
});

describe("PhotoGalleryScreen — Scroll Pozisyonu Koruması (Sprint 10.5, Madde 2)", () => {
  it("component YENİDEN monte edildiğinde (navigasyon simülasyonu), ÖNCEKİ scroll pozisyonuna GERİ DÖNER", async () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(window, "scrollY", { value: 350, writable: true, configurable: true });
    const observationId = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });

    const { unmount } = render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("Delete Photo")).toBeTruthy());
    // Unmount OLURKEN, cleanup fonksiyonu MEVCUT scrollY'yi (350) KAYDETMELİ.
    unmount();

    // YENİDEN monte et — bu, "PhotoAnalysisScreen'den GERİ dönüş" senaryosunun SİMÜLASYONU.
    render(<PhotoGalleryScreen observationId={observationId} onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText("Delete Photo")).toBeTruthy());

    expect(scrollToSpy).toHaveBeenCalledWith(0, 350);
  });
});
