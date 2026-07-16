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
 *
 * KÖK NEDEN DÜZELTMESİ (Sprint 4.3.2, gerçek Android cihaz regresyonu
 * P0-001): Native picker'lar (Kamera/Galeri) ayrı bir Activity açtığı
 * için, Capacitor'ın `appStateChange` olayı `isActive: false` ile
 * tetikleniyor — TIPKI gerçek arka-plana-alma gibi (bu, RESMİ olarak
 * raporlanmış bir Capacitor davranışı — github.com/ionic-team/
 * capacitor/issues/5320: "Any native pop-over such as Image Picker...
 * triggers appStateChange"). Sprint 4.3.1'in güvenlik düzeltmesi
 * (App.tsx) bunu koşulsuz "kullanıcı ayrıldı" olarak yorumlayıp
 * uygulamayı yeniden kilitliyordu — bu da `PhotoGalleryScreen`'in
 * (ve içindeki bekleyen `capturePhoto()` çağrısının) unmount
 * edilmesine, çekilen fotoğrafın kaybolmasına yol açıyordu.
 *
 * `isCapturingPhoto()` dışa açık bayrağı, `App.tsx`'in bu SÜRE
 * BOYUNCA `appStateChange`'i görmezden gelmesini sağlıyor — genel
 * arka-plana-alma güvenlik davranışı (Ana Ekran tuşu vb.) TAMAMEN
 * korunuyor, sadece bizim başlattığımız native picker'ın kendi geçici
 * geçişi hariç tutuluyor. Kamera VE galeri için AYNI koruma
 * uygulanıyor (galerinin bugün "çalışması", aynı kök nedene bağışık
 * olduğu anlamına gelmiyor — sadece daha hızlı tamamlandığı için
 * şimdiye kadar fark edilmemiş olabilir).
 */

import { Camera } from "@capacitor/camera";

export type PhotoSource = "camera" | "gallery";

export interface CapturedPhoto {
  /** Önizleme için — `<img src>` olarak doğrudan kullanılabilir. */
  webPath: string;
  /** Kalıcı depoya kopyalamak için — Filesystem API'nin `from` parametresi. */
  sourceUri: string;
}

let activeCaptureCount = 0;

/**
 * `capturePhoto()` şu an sürüyor mu (Kamera/Galeri Activity'si açık
 * mı)? `App.tsx`, bu `true` iken `appStateChange`'i görmezden gelir.
 */
export function isCapturingPhoto(): boolean {
  return activeCaptureCount > 0;
}

/**
 * Kamera veya galeriden bir fotoğraf yakalar. İzin reddedilirse veya
 * kullanıcı iptal ederse hata fırlatır — çağıran taraf bunu
 * yakalayıp kullanıcıya uygun bir mesaj göstermelidir (bkz.
 * ObservationPhotosScreen).
 */
export async function capturePhoto(source: PhotoSource): Promise<CapturedPhoto> {
  activeCaptureCount++;
  try {
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
  } finally {
    // `finally` — başarı, hata veya kullanıcı iptali fark etmeksizin
    // bayrak HER ZAMAN temizlenir (asılı kalma riski yok).
    activeCaptureCount--;
  }
}
