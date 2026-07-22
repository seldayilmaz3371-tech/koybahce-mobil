/**
 * restoreService.ts — Yedekten Geri Yükleme
 * ==============================================
 * bkz. Sprint 10.13 (Veri Yönetimi — Yedekle/Geri Yükle).
 *
 * AKIŞ (kullanıcının KESİN olarak belirttiği sıra):
 *   1. ZIP'in GERÇEKTEN bir Bahçem Mobile yedeği olduğunu doğrula
 *      (manifest imzası) — başarısızsa İPTAL, hiçbir şey değişmez.
 *   2. Kullanıcı onayından ÖNCE otomatik bir güvenlik yedeği oluştur
 *      (mevcut `createFullBackup()` — kod tekrarından kaçınmak için
 *      AYNI fonksiyon kullanıldı, sadece paylaşım/UI adımı atlanıyor).
 *      Bu BAŞARISIZ olursa geri yükleme İPTAL edilir (kullanıcı
 *      verisini korumak — kullanıcının açık talebi).
 *   3. Veritabanını geri yükle (`importFromJson`, `overwrite: true`).
 *   4. Fotoğrafları geri yükle (ZIP'teki `photos/` klasöründen
 *      `Directory.Data/bahcem-photos/`'a).
 *
 * GÜVENLİK/DÜRÜSTLÜK NOTU: Fotoğraf geri yükleme veritabanından SONRA
 * yapılıyor — eğer fotoğraflardan BİRİ başarısız olursa, veritabanı
 * ZATEN geri yüklenmiş durumda (kısmi başarı, DM_005) — bu, kullanıcıya
 * AÇIKÇA bildiriliyor (`RestoreResult.partialSuccess`).
 */

import { importDatabaseFromJson } from "../../../data/db/connection";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { unzipSync, strFromU8, type Unzipped } from "fflate";
import { base64ToUint8Array, uint8ArrayToBase64 } from "../../../shared/utils/base64Binary";
import {
  BACKUP_SIGNATURE,
  type BackupManifest,
  type RestoreProgress,
  type RestoreResult,
} from "../domain/dataManagement.types";
import { createFullBackup } from "./backupService";

export interface ParsedBackup {
  manifest: BackupManifest;
  databaseJson: unknown;
  photoEntries: { path: string; data: Uint8Array }[];
}

/**
 * Bir ZIP dosyasının GERÇEKTEN geçerli bir Bahçem Mobile yedeği olup
 * olmadığını doğrular. Geçerliyse ayrıştırılmış içeriği döner,
 * DEĞİLSE `null` döner (çağıran taraf DM_002 ile kullanıcıya bildirir).
 *
 * Doğrulama KESİN — sadece dosyanın VARLIĞI değil, `manifest.json`'ın
 * içindeki imzanın (`BACKUP_SIGNATURE`) TAM olarak eşleştiği kontrol
 * edilir (kullanıcının açık talebi: "ZIP dosyasının geçerli bir
 * Bahçem Mobile yedeği olduğu doğrulansın").
 */
export async function validateAndParseBackup(zipBase64: string): Promise<ParsedBackup | null> {
  let unzipped: Unzipped;
  try {
    unzipped = unzipSync(base64ToUint8Array(zipBase64));
  } catch {
    return null;
  }

  const manifestEntry = unzipped["manifest.json"];
  const databaseEntry = unzipped["database.json"];
  if (!manifestEntry || !databaseEntry) {
    return null;
  }

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestEntry));
  } catch {
    return null;
  }

  if (manifest.signature !== BACKUP_SIGNATURE) {
    return null;
  }

  let databaseJson: unknown;
  try {
    databaseJson = JSON.parse(strFromU8(databaseEntry));
  } catch {
    return null;
  }

  const photoEntries = Object.entries(unzipped)
    .filter(([path]) => path.startsWith("photos/"))
    .map(([path, data]) => ({ path, data }));

  return { manifest, databaseJson, photoEntries };
}

/**
 * Geri yüklemenin TAMAMINI yürütür: otomatik güvenlik yedeği →
 * veritabanı → fotoğraflar. `onProgress`, kullanıcının talep ettiği
 * "hangi aşamada olduğunu göster" ihtiyacı için.
 *
 * ÖNEMLİ: `parsedBackup`'ın GEÇERLİLİĞİ bu fonksiyona GİRMEDEN ÖNCE
 * `validateAndParseBackup()` ile doğrulanmış OLMALIDIR — bu fonksiyon
 * kendi içinde TEKRAR doğrulama YAPMAZ (sorumluluk net ayrılmış —
 * doğrulama ayrı, geri yükleme ayrı, kod tekrarından kaçınma).
 */
export async function restoreFromBackup(
  parsedBackup: ParsedBackup,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> {
  onProgress?.({ stage: "creating_safety_backup" });
  const safetyBackup = await createFullBackup();
  if (!safetyBackup.success) {
    // Kullanıcının açık talebi: güvenlik yedeği oluşturulamazsa geri
    // yükleme İPTAL edilir — mevcut veri KORUNUR, hiçbir şey değişmez.
    return { success: false, errorCode: "DM_003", failedStage: "creating_safety_backup" };
  }

  onProgress?.({ stage: "restoring_database" });
  try {
    const importPayload = {
      ...(parsedBackup.databaseJson as Record<string, unknown>),
      overwrite: true, // GERÇEK KANIT (resmi dokümantasyon): versiyon kontrolünü bypass eder, aksi halde AYNI şema versiyonunda importFromJson HİÇBİR ŞEY yapmaz.
    };
    await importDatabaseFromJson(JSON.stringify(importPayload));
  } catch {
    return { success: false, errorCode: "DM_004", failedStage: "restoring_database" };
  }

  onProgress?.({ stage: "restoring_photos", photosRestored: 0, photosTotal: parsedBackup.photoEntries.length });
  let photosRestoredCount = 0;
  let photosFailedCount = 0;

  for (const entry of parsedBackup.photoEntries) {
    try {
      // ZIP'teki geçici bir kaynak yolu YOK — bu yüzden `persistPhotoFile`
      // (kaynak URI kopyalar) YERİNE, ham byte'ları DOĞRUDAN yazıyoruz.
      const fileName = entry.path.replace("photos/", "");
      await Filesystem.writeFile({
        path: `bahcem-photos/${fileName}`,
        data: uint8ArrayToBase64(entry.data),
        directory: Directory.Data,
        // bkz. `native/filesystem.ts`'in `persistPhotoFile()`'ındaki
        // AYNI savunmacı gerekçe (GitHub issue #1835 referansı) —
        // eksik ara klasörün (bahcem-photos/) otomatik oluşturulması
        // GARANTİ edilmeli, ayrı bir mkdir() çağrısına GEREK kalmadan.
        recursive: true,
      });
      photosRestoredCount++;
    } catch {
      photosFailedCount++;
    }
    onProgress?.({
      stage: "restoring_photos",
      photosRestored: photosRestoredCount + photosFailedCount,
      photosTotal: parsedBackup.photoEntries.length,
    });
  }

  onProgress?.({ stage: "done" });

  if (photosFailedCount > 0) {
    return {
      success: true,
      partialSuccess: true,
      photosRestoredCount,
      photosFailedCount,
      errorCode: "DM_005",
    };
  }

  return { success: true, photosRestoredCount, photosFailedCount: 0 };
}
