/**
 * backupService.ts — Tam Yedek Oluşturma
 * ==========================================
 * bkz. Sprint 10.13 (Veri Yönetimi — Yedekle/Geri Yükle). Kullanıcının
 * kararı: kapsam SADECE bu iki özellik, diğer Veri Yönetimi
 * genişlemeleri (senkronizasyon, bulut, zamanlanmış otomatik
 * yedekler) sonraki sprintlere bırakıldı.
 *
 * GERÇEK BULGU (varsayılmadı — kod tabanı taranarak doğrulandı):
 * "ses kaydı" (voice recording) projede hiç yok — hiçbir tabloda
 * bulunamadı. Yedek içeriği bu yüzden SADECE gerçekten var olan
 * veriyi kapsıyor: veritabanı (tüm tablolar) + fotoğraflar.
 *
 * MİMARİ KARAR (kanıtlanmış, resmi dokümantasyondan): Veritabanı
 * dosyasının ham kopyalanması YERİNE, `@capacitor-community/sqlite`'ın
 * resmi `exportToJson("full")` metodu kullanılıyor — bu, şifreleme
 * anahtarının/dosya yolunun bilinmesini GEREKTİRMİYOR (eklenti zaten
 * açık bağlantı üzerinden çalışıyor), ve export edilen JSON DÜZ METİN
 * (deşifre edilmiş) veri içeriyor — bu, GÜVENLİK açısından ÖNEMLİ bir
 * sınır: yedek ZIP dosyasının kendisi kullanıcı tarafından güvenli
 * saklanmalı (uygulama içi SQLCipher şifrelemesi, export edilen JSON'a
 * YANSIMAZ).
 *
 * YEDEK İÇERİĞİ (ZIP):
 *   - manifest.json  — imza + metadata (doğrulama için)
 *   - database.json  — db.exportToJson("full")'un ham çıktısı
 *   - photos/{id}.{ext} — her aktif fotoğrafın ham dosya içeriği
 */

import { getDatabase } from "../../../data/db/connection";
import { CURRENT_SCHEMA_VERSION } from "../../../data/db/migrations/schema";
import { photoRepository } from "../../photos/data/photo.repository";
import { readFileAsBase64 } from "../../../native/filesystem";
import { getAppVersion } from "../../../native/appInfo";
import { base64ToUint8Array, uint8ArrayToBase64 } from "../../../shared/utils/base64Binary";
import { BACKUP_SIGNATURE, type BackupManifest, type BackupResult } from "../domain/dataManagement.types";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { zipSync, strToU8, type Zippable } from "fflate";

/** bkz. brand.ts'in kendi notu (DATABASE_NAME'in marka-bağımsız tutulma gerekçesiyle AYNI ilke) — dosya adı formatı kullanıcı tarafından KESİN olarak belirtildi, marka değişikliğinden bağımsız bir adlandırma SÖZLEŞMESİ. */
const BACKUP_FILE_PREFIX = "BahcemMobile_Backup";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Bugünün tarihini `YYYY-MM-DD` formatında döner — yerel saat dilimi (kullanıcının GÖRDÜĞÜ tarih, UTC değil). */
function formatDateForFileName(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Dosya adını kullanıcının BELİRTTİĞİ TAM formatta üretir:
 * `BahcemMobile_Backup_YYYY-MM-DD_vUygulamaSürümü.zip`
 */
export function buildBackupFileName(appVersion: string, now: Date = new Date()): string {
  return `${BACKUP_FILE_PREFIX}_${formatDateForFileName(now)}_v${appVersion}.zip`;
}

/**
 * Veritabanının TÜM içeriğini (tüm tablolar) + tüm aktif fotoğrafları
 * tek bir ZIP dosyasına paketler, `Directory.Cache`'e yazar (geçici —
 * paylaşım/dışa aktarım sonrası kalıcı saklama gerekmiyor, ekran
 * kapanınca sistem tarafından temizlenebilir).
 *
 * Başarısızsa `success: false` + çevrilebilir bir `errorCode` döner —
 * hiçbir aşamada AÇIK olmayan bir exception dışarı SIZDIRILMAZ
 * (çağıran taraf mapDataManagementError ile ham hatayı çevirir).
 */
export async function createFullBackup(): Promise<BackupResult> {
  const db = await getDatabase();
  const exportResult = await db.exportToJson("full");
  if (!exportResult.export) {
    return { success: false, errorCode: "DM_001" };
  }

  const photos = await photoRepository.listAll();
  const zipEntries: Zippable = {};

  for (const photo of photos) {
    const base64 = await readFileAsBase64(photo.filePath);
    const extension = photo.filePath.split(".").pop()?.split("?")[0] || "jpg";
    zipEntries[`photos/${photo.id}.${extension}`] = base64ToUint8Array(base64);
  }

  const appVersion = (await getAppVersion()) ?? "unknown";
  const manifest: BackupManifest = {
    signature: BACKUP_SIGNATURE,
    appVersion,
    createdAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    photoCount: photos.length,
  };

  zipEntries["manifest.json"] = strToU8(JSON.stringify(manifest));
  zipEntries["database.json"] = strToU8(JSON.stringify(exportResult.export));

  const zipBytes = zipSync(zipEntries);
  const fileName = buildBackupFileName(appVersion);

  try {
    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: uint8ArrayToBase64(zipBytes),
      directory: Directory.Cache,
    });
    return { success: true, filePath: writeResult.uri };
  } catch {
    return { success: false, errorCode: "DM_001" };
  }
}
