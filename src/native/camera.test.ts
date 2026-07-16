// @vitest-environment jsdom
/**
 * native/camera.ts Testleri (Sprint 4.3.2)
 * ============================================
 * `isCapturingPhoto()` bayrağının — Kamera/Galeri Activity'si açıkken
 * `true`, kapandığında (başarı/hata/iptal fark etmeksizin) `false`
 * olduğunu kanıtlıyor. Bu, P0-001 (Camera Intent + LockScreen
 * regresyonu) düzeltmesinin temel bileşeni.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let takePhotoMock = vi.fn();
let chooseFromGalleryMock = vi.fn();

vi.mock("@capacitor/camera", () => ({
  Camera: {
    takePhoto: (...args: unknown[]) => takePhotoMock(...args),
    chooseFromGallery: (...args: unknown[]) => chooseFromGalleryMock(...args),
  },
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isCapturingPhoto — P0-001 kök neden düzeltmesinin temeli", () => {
  it("capturePhoto('camera') sürerken true, tamamlanınca false döner (başarı yolu)", async () => {
    const { capturePhoto, isCapturingPhoto } = await import("./camera");
    let resolveCapture!: (value: { uri: string; webPath: string }) => void;
    takePhotoMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveCapture = resolve;
        })
    );

    expect(isCapturingPhoto()).toBe(false);

    const capturePromise = capturePhoto("camera");
    // Mikro-görev kuyruğunun `activeCaptureCount++`'ı işlemesi için bir tık bekliyoruz.
    await Promise.resolve();
    expect(isCapturingPhoto()).toBe(true); // Kamera Activity'si "açık"

    resolveCapture({ uri: "/tmp/x.jpg", webPath: "capacitor://x.jpg" });
    await capturePromise;

    expect(isCapturingPhoto()).toBe(false); // Kamera Activity'si "kapandı"
  });

  it("Kamera hata fırlatırsa (izin reddi/donanım hatası) BAYRAK YİNE DE temizlenir (finally garantisi)", async () => {
    const { capturePhoto, isCapturingPhoto } = await import("./camera");
    takePhotoMock = vi.fn().mockRejectedValue(new Error("User denied camera permission"));

    await expect(capturePhoto("camera")).rejects.toThrow();

    // GERÇEK KANIT: hata durumunda bile bayrak asılı KALMAZ — aksi
    // halde uygulama bir daha ASLA arka plana alınamayınca kilitlenmez
    // (kalıcı bir güvenlik açığı olurdu).
    expect(isCapturingPhoto()).toBe(false);
  });

  it("Galeri seçimi sürerken de true döner — AYNI koruma kamera VE galeri için geçerli", async () => {
    const { capturePhoto, isCapturingPhoto } = await import("./camera");
    let resolveGallery!: (value: { results: Array<{ uri: string; webPath: string }> }) => void;
    chooseFromGalleryMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveGallery = resolve;
        })
    );

    const capturePromise = capturePhoto("gallery");
    await Promise.resolve();
    expect(isCapturingPhoto()).toBe(true);

    resolveGallery({ results: [{ uri: "/tmp/y.jpg", webPath: "capacitor://y.jpg" }] });
    await capturePromise;

    expect(isCapturingPhoto()).toBe(false);
  });

  it("Galeri boş sonuç döndürüp hata fırlatsa bile bayrak temizlenir", async () => {
    const { capturePhoto, isCapturingPhoto } = await import("./camera");
    chooseFromGalleryMock = vi.fn().mockResolvedValue({ results: [] });

    await expect(capturePhoto("gallery")).rejects.toThrow();

    expect(isCapturingPhoto()).toBe(false);
  });

  it("art arda iki capturePhoto çağrısı (teorik örtüşme) sayaç mantığıyla doğru yönetilir", async () => {
    const { capturePhoto, isCapturingPhoto } = await import("./camera");
    let resolveFirst!: (value: { uri: string; webPath: string }) => void;
    let resolveSecond!: (value: { uri: string; webPath: string }) => void;
    let callCount = 0;
    takePhotoMock = vi.fn(() => {
      callCount++;
      return new Promise((resolve) => {
        if (callCount === 1) resolveFirst = resolve;
        else resolveSecond = resolve;
      });
    });

    const first = capturePhoto("camera");
    await Promise.resolve();
    const second = capturePhoto("camera");
    await Promise.resolve();
    expect(isCapturingPhoto()).toBe(true); // ikisi de sürüyor

    resolveFirst({ uri: "/a.jpg", webPath: "capacitor://a.jpg" });
    await first;
    expect(isCapturingPhoto()).toBe(true); // hâlâ ikinci sürüyor

    resolveSecond({ uri: "/b.jpg", webPath: "capacitor://b.jpg" });
    await second;
    expect(isCapturingPhoto()).toBe(false); // ikisi de bitti
  });
});
