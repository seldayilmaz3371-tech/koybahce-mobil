/**
 * Görüntüleme Yolu Dönüştürücü — İnce Sarmalayıcı
 * ====================================================
 * bkz. Sprint 3.10.1 (gerçek Android cihaz hatası — Hata 2).
 *
 * KÖK NEDEN: `Filesystem.copy()`'nin döndürdüğü `file_path`, ham bir
 * dosya sistemi yolu (`file:///data/user/0/.../bahcem-photos/x.jpg`).
 * Android WebView, güvenlik kısıtlamaları nedeniyle `file://` yollarını
 * doğrudan `<img src>` olarak YÜKLEMEZ — bu yüzden gerçek cihazda
 * fotoğraflar hiç görünmüyordu (sadece "Fotoğrafı Sil" butonu vardı,
 * çünkü o görsel içeriğe bağımlı değildi).
 *
 * DOĞRULAMA (varsayılmadı): `Capacitor.convertFileSrc(filePath: string):
 * string` fonksiyonunun gerçekten var olduğu, `@capacitor/core`'un
 * resmi tip tanımlarından (`node_modules/@capacitor/core/types/
 * definitions.d.ts`) doğrulandı — "Utility function to convert a file
 * path into a usable src depending on the native WebView implementation
 * value and environment."
 */

import { Capacitor } from "@capacitor/core";

/**
 * Bir kalıcı dosya yolunu (`Photo.filePath`), `<img src>` olarak
 * GÜVENLE kullanılabilecek bir URL'e çevirir. Web platformunda
 * (`Capacitor.convertFileSrc`'in dokunmadığı durumlarda) yolu olduğu
 * gibi bırakır.
 */
export function toDisplaySrc(filePath: string): string {
  return Capacitor.convertFileSrc(filePath);
}
