/**
 * Kamera — İnce Sarmalayıcı Katmanı
 * =====================================
 * bkz. Sprint 3.7 UX+Veri Modeli Doğrulaması.
 *
 * API DOĞRULAMASI (varsayılmadı, gerçek tip tanımlarından kontrol
 * edildi — @capacitor/camera v8.2.1): `getPhoto()`/`pickImages()`
 * KULLANILMIYOR (deprecated) — yeni `takePhoto()`/`chooseFromGallery()`
 * API'si kullanılıyor.
 *
 * KESİNLEŞEN BULGU: `MediaMetadata` (plugin'in döndürdüğü meta veri)
 * sadece `size`/`duration`/`format`/`resolution` içeriyor — çekim
 * tarihi/EXIF HİÇBİR ZAMAN plugin API'sinden gelmiyor (bkz.
 * docs/modul-3-backlog.md madde 13). Bu yüzden `takenAt` her zaman
 * uygulama tarafında (`new Date().toISOString()`) üretiliyor.
 */

import { Camera } from "@capacitor/camera";

export type PhotoSource = "camera" | "gallery";

export interface CapturedPhoto {
  /** Önizleme için — `<img src>` olarak doğrudan kullanılabilir. */
  webPath: string;
  /** Kalıcı depoya kopyalamak için — Filesystem API'nin `from` parametresi. */
  sourceUri: string;
}

/**
 * Kamera veya galeriden bir fotoğraf yakalar. İzin reddedilirse veya
 * kullanıcı iptal ederse hata fırlatır — çağıran taraf bunu
 * yakalayıp kullanıcıya uygun bir mesaj göstermelidir (bkz.
 * ObservationPhotosScreen).
 */
export async function capturePhoto(source: PhotoSource): Promise<CapturedPhoto> {
  if (source === "camera") {
    const result = await Camera.takePhoto({ quality: 90 });
    if (!result.uri || !result.webPath) {
      throw new Error("Camera did not return a valid photo.");
    }
    return { webPath: result.webPath, sourceUri: result.uri };
  }

  // Varsayılan `allowMultipleSelection: false` — tek fotoğraf seçimi
  // garanti (resmi tip tanımlarından doğrulandı), ekstra bir seçenek
  // geçmeye gerek yok.
  const { results } = await Camera.chooseFromGallery({});
  const first = results[0];
  if (!first?.uri || !first?.webPath) {
    throw new Error("Gallery did not return a valid photo.");
  }
  return { webPath: first.webPath, sourceUri: first.uri };
}
