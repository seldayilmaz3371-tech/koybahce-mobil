/**
 * dataManagement.types.ts — Yedekleme/Geri Yükleme Domain Tipleri
 * ====================================================================
 * bkz. Sprint 10.13. Kullanıcının kararı: kapsam SADECE "Tam Yedek
 * Oluştur" + "Yedekten Geri Yükle" — diğer Veri Yönetimi özellikleri
 * (senkronizasyon, bulut yedekleme, otomatik zamanlanmış yedekler)
 * BİLİNÇLİ olarak kapsam dışı, sonraki sprintlere bırakıldı (YAGNI).
 *
 * GERÇEK BULGU (varsayılmadı — kod tabanı taranarak doğrulandı):
 * projede "ses kaydı" (voice recording) diye bir özellik hiç yok —
 * hiçbir SQLite tablosunda, hiçbir modülde bulunamadı. Bu yüzden
 * yedek içeriği SADECE gerçekten var olan verileri kapsıyor:
 * veritabanı (tüm tablolar) + fotoğraflar. Bu, kullanıcıya
 * dürüstçe bildirilmesi gereken bir sınırdır.
 */

/**
 * Bir ZIP dosyasının GERÇEKTEN bir Bahçem Mobile yedeği olduğunu
 * doğrulamak için kullanılan imza. `manifest.json`'ın içinde taşınır
 * — geri yükleme öncesi bu imzanın varlığı VE değeri kontrol edilir.
 */
export const BACKUP_SIGNATURE = "BahcemMobileBackup";

export interface BackupManifest {
  signature: typeof BACKUP_SIGNATURE;
  /** Yedeğin oluşturulduğu uygulama sürümü (ör. "0.1.0-beta.1") — bilgi amaçlı, geri yükleme sırasında ZORUNLU bir sürüm eşleşmesi ARANMAZ. */
  appVersion: string;
  /** ISO 8601 — yedeğin oluşturulduğu GERÇEK zaman. */
  createdAt: string;
  /** Yedek içindeki veritabanının şema sürümü — bilgi/teşhis amaçlı. */
  schemaVersion: number;
  /** Yedeğe dahil edilen fotoğraf sayısı — kullanıcıya özet göstermek için. */
  photoCount: number;
}

export interface BackupResult {
  success: boolean;
  /** Başarılıysa, oluşturulan ZIP dosyasının GERÇEK dosya sistemi yolu. */
  filePath?: string;
  /** Başarısızsa, çevrilmiş hata kodu (Error Code Standard). */
  errorCode?: string;
}

export type RestoreStage =
  | "validating"
  | "creating_safety_backup"
  | "restoring_database"
  | "restoring_photos"
  | "done"
  | "failed";

export interface RestoreProgress {
  stage: RestoreStage;
  /** Sadece "restoring_photos" aşamasında dolu — ilerleme çubuğu için. */
  photosRestored?: number;
  photosTotal?: number;
}

export interface RestoreResult {
  success: boolean;
  /** Veritabanı geri yüklendi ama BAZI fotoğraflar başarısız oldu (kısmi başarı — DM_005). */
  partialSuccess?: boolean;
  photosRestoredCount?: number;
  photosFailedCount?: number;
  errorCode?: string;
  /** Hangi aşamada başarısız olduğu — kullanıcıya AÇIKÇA bildirmek için (kullanıcının açık talebi). */
  failedStage?: RestoreStage;
}
