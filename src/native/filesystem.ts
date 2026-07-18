/**
 * Kalıcı Fotoğraf Depolama — İnce Sarmalayıcı Katmanı
 * ========================================================
 * bkz. Sprint 3.7 UX+Veri Modeli Doğrulaması.
 *
 * MİMARİ KARAR: Kameranın/galerinin döndürdüğü `sourceUri` GEÇİCİ bir
 * konumdur (önbellek, düşük bellek durumunda silinebilir) — "Dijital
 * Bahçe Hafızası" vizyonu (5-10 yıl kalıcılık) için bu yetersiz.
 * Fotoğraf, `Directory.Data`'ya (uygulamaya özel, sadece uygulama
 * kaldırılırsa silinir — resmi tip tanımlarından doğrulandı) KOPYALANIR
 * ve kalıcı `file_path` bu kopyanın yolu olur.
 *
 * DOSYA ADI: `photo.id` (UUID) kullanılıyor — backlog madde 11
 * ("kimlik her zaman photo.id, asla file_path değil") ile tutarlı:
 * dosya adı kimlikten TÜRETİLİYOR, tersi değil.
 */

import { Filesystem, Directory } from "@capacitor/filesystem";

const PHOTOS_SUBDIRECTORY = "bahcem-photos";

/**
 * Geçici bir dosyayı kalıcı depoya kopyalar, kalıcı `file_path`'i
 * döndürür. `fileNameSeed`, çakışmasız bir dosya adı üretmek için
 * kullanılır (`crypto.randomUUID()` ile, çağıran tarafından üretilir).
 *
 * NOT (backlog madde 11'in netleştirilmesi): Bu seed'in, o fotoğrafın
 * veritabanı `id`'siyle BİREBİR AYNI olması ZORUNLU DEĞİL — madde 11'in
 * asıl amacı `file_path`'in bir İLİŞKİ ANAHTARI olarak kullanılmaması
 * (tüm ilişkiler her zaman `photo.id` üzerinden kurulur), dosya adının
 * metninin id ile aynı olması değil. İki ayrı UUID kullanılması bu
 * ilkeyi ihlal etmez.
 *
 * SAVUNMACI DAVRANIŞ (varsayılmadı — GitHub issue #1835'te
 * `downloadFile()`'ın Android'de eksik ara klasörleri otomatik
 * oluşturmadığı bulundu, `copy()` için de aynı risk göz önünde
 * bulunduruluyor): hedef alt klasör, kopyalamadan ÖNCE `mkdir`
 * ile `recursive: true` ile garanti ediliyor. Klasör zaten varsa
 * fırlatılan hata yutuluyor (idempotent).
 */
export async function persistPhotoFile(sourceUri: string, fileNameSeed: string): Promise<string> {
  try {
    await Filesystem.mkdir({
      path: PHOTOS_SUBDIRECTORY,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // Klasör zaten varsa mkdir hata fırlatır — bu beklenen ve zararsız.
  }

  const extension = sourceUri.split(".").pop()?.split("?")[0] || "jpg";
  const result = await Filesystem.copy({
    from: sourceUri,
    to: `${PHOTOS_SUBDIRECTORY}/${fileNameSeed}.${extension}`,
    toDirectory: Directory.Data,
  });
  return result.uri;
}

/**
 * Kalıcı bir fotoğraf dosyasını (ör. `persistPhotoFile()`'ın döndürdüğü
 * TAM URI) base64 metne okur — Gemini Vision'a gönderilecek `inlineData`
 * için (bkz. Sprint 9.2, ADR gerekmeyen bir uzantı — mevcut
 * `persistPhotoFile`'a HİÇ dokunulmadı, sadece bu fonksiyon eklendi).
 *
 * GERÇEK API DOĞRULAMASI (varsayılmadı): `Filesystem.readFile`'ın
 * resmi tip tanımları — `encoding` VERİLMEZSE "data is read as binary
 * and returned as base64 encoded" (dokümantasyon metni birebir).
 * `directory` VERİLMEDİ çünkü `path`, `persistPhotoFile()`'ın
 * döndürdüğü TAM bir URI (`CopyResult.uri`) — göreli bir yol DEĞİL.
 */
export async function readFileAsBase64(filePath: string): Promise<string> {
  const result = await Filesystem.readFile({ path: filePath });
  if (typeof result.data !== "string") {
    // Native platformda HER ZAMAN string döner (resmi dokümantasyon:
    // "On native, the data is returned as a string") — bu dal SADECE
    // web'de Blob dönme ihtimaline karşı bir güvenlik notu.
    throw new Error("PHOTO_READ_UNEXPECTED_BLOB_RESULT");
  }
  return result.data;
}
