import { beforeEach, describe, expect, it, vi } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { uint8ArrayToBase64 } from "../../../shared/utils/base64Binary";
import { BACKUP_SIGNATURE, type BackupManifest } from "../domain/dataManagement.types";
import { validateAndParseBackup, restoreFromBackup, type ParsedBackup } from "./restoreService";

const importDatabaseFromJsonMock = vi.fn();
const writeFileMock = vi.fn();
const createFullBackupMock = vi.fn();

vi.mock("../../../data/db/connection", () => ({
  importDatabaseFromJson: (...args: unknown[]) => importDatabaseFromJsonMock(...args),
}));

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: (...args: unknown[]) => writeFileMock(...args) },
  Directory: { Data: "DATA" },
}));

vi.mock("./backupService", () => ({
  createFullBackup: (...args: unknown[]) => createFullBackupMock(...args),
}));

const VALID_MANIFEST: BackupManifest = {
  signature: BACKUP_SIGNATURE,
  appVersion: "0.1.0-beta.1",
  createdAt: "2026-07-22T10:00:00.000Z",
  schemaVersion: 12,
  photoCount: 1,
};

function buildFakeBackupZipBase64(overrides?: { manifest?: unknown; withPhoto?: boolean }): string {
  const entries: Record<string, Uint8Array> = {
    "manifest.json": strToU8(JSON.stringify(overrides?.manifest ?? VALID_MANIFEST)),
    "database.json": strToU8(JSON.stringify({ database: "bahcem", version: 1, tables: [] })),
  };
  if (overrides?.withPhoto !== false) {
    entries["photos/foto1.jpg"] = strToU8("SAHTE_FOTO_BINARY_VERISI");
  }
  return uint8ArrayToBase64(zipSync(entries));
}

beforeEach(() => {
  importDatabaseFromJsonMock.mockReset().mockResolvedValue(undefined);
  writeFileMock.mockReset().mockResolvedValue({ uri: "file:///data/bahcem-photos/foto1.jpg" });
  createFullBackupMock.mockReset().mockResolvedValue({ success: true, filePath: "file:///cache/safety.zip" });
});

describe("validateAndParseBackup", () => {
  it("🔴 GEÇERLİ bir yedek ZIP'i (doğru imza) GERÇEKTEN ayrıştırılıp döner", async () => {
    const zipBase64 = buildFakeBackupZipBase64();

    const result = await validateAndParseBackup(zipBase64);

    expect(result).not.toBeNull();
    expect(result!.manifest.signature).toBe(BACKUP_SIGNATURE);
    expect(result!.photoEntries).toHaveLength(1);
    expect(result!.photoEntries[0].path).toBe("photos/foto1.jpg");
  });

  it("manifest.json'da YANLIŞ bir imza VARSA, null döner (kullanıcının açık talebi: doğrulama başarısızsa iptal)", async () => {
    const zipBase64 = buildFakeBackupZipBase64({ manifest: { ...VALID_MANIFEST, signature: "SahteImza" } });

    const result = await validateAndParseBackup(zipBase64);

    expect(result).toBeNull();
  });

  it("manifest.json HİÇ YOKSA, null döner", async () => {
    const zipBase64 = uint8ArrayToBase64(zipSync({ "database.json": strToU8("{}") }));

    const result = await validateAndParseBackup(zipBase64);

    expect(result).toBeNull();
  });

  it("database.json HİÇ YOKSA, null döner", async () => {
    const zipBase64 = uint8ArrayToBase64(zipSync({ "manifest.json": strToU8(JSON.stringify(VALID_MANIFEST)) }));

    const result = await validateAndParseBackup(zipBase64);

    expect(result).toBeNull();
  });

  it("GEÇERSİZ (ZIP OLMAYAN) bir dosya VERİLİRSE, exception FIRLATMAZ, null döner", async () => {
    const result = await validateAndParseBackup("bu-hicbir-zip-degil");

    expect(result).toBeNull();
  });

  it("hiç fotoğraf İÇERMEYEN GEÇERLİ bir yedek de doğru ayrıştırılır (photoEntries boş)", async () => {
    const zipBase64 = buildFakeBackupZipBase64({ withPhoto: false });

    const result = await validateAndParseBackup(zipBase64);

    expect(result).not.toBeNull();
    expect(result!.photoEntries).toHaveLength(0);
  });
});

describe("restoreFromBackup", () => {
  const parsedBackup: ParsedBackup = {
    manifest: VALID_MANIFEST,
    databaseJson: { database: "bahcem", version: 1, tables: [] },
    photoEntries: [{ path: "photos/foto1.jpg", data: strToU8("SAHTE_VERI") }],
  };

  it("🔴 TAM BAŞARILI senaryo: güvenlik yedeği → veritabanı → fotoğraflar SIRAYLA GERÇEKTEN çalıştırılır", async () => {
    const progressLog: string[] = [];

    const result = await restoreFromBackup(parsedBackup, (p) => progressLog.push(p.stage));

    expect(result.success).toBe(true);
    expect(result.partialSuccess).toBeUndefined();
    expect(result.photosRestoredCount).toBe(1);
    expect(result.photosFailedCount).toBe(0);
    expect(createFullBackupMock).toHaveBeenCalledTimes(1);
    expect(importDatabaseFromJsonMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    // Kullanıcının KESİN belirttiği SIRA: safety backup İLK önce.
    // "restoring_photos" İKİ KEZ görünür (başlangıç bildirimi + 1
    // fotoğrafın tamamlanma bildirimi) — GERÇEK, doğru davranış.
    expect(progressLog).toEqual([
      "creating_safety_backup",
      "restoring_database",
      "restoring_photos",
      "restoring_photos",
      "done",
    ]);
  });

  it("🔴 importDatabaseFromJson'a GEÇEN payload, GERÇEKTEN overwrite:true İÇERİR (versiyon kontrolünü bypass eder)", async () => {
    await restoreFromBackup(parsedBackup);

    const sentJson = JSON.parse(importDatabaseFromJsonMock.mock.calls[0][0] as string);
    expect(sentJson.overwrite).toBe(true);
    expect(sentJson.database).toBe("bahcem");
  });

  it("🔴 GÜVENLİK: otomatik güvenlik yedeği BAŞARISIZ OLURSA, geri yükleme İPTAL edilir — veritabanına HİÇ dokunulmaz", async () => {
    createFullBackupMock.mockResolvedValue({ success: false, errorCode: "DM_001" });

    const result = await restoreFromBackup(parsedBackup);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("DM_003");
    expect(result.failedStage).toBe("creating_safety_backup");
    // KESİN kanıt: veritabanı İMPORT'u HİÇ ÇAĞRILMADI.
    expect(importDatabaseFromJsonMock).not.toHaveBeenCalled();
  });

  it("veritabanı geri yükleme BAŞARISIZ OLURSA, DM_004 ile başarısız döner, HANGİ aşamada olduğu AÇIKÇA bildirilir", async () => {
    importDatabaseFromJsonMock.mockRejectedValue(new Error("bozuk JSON"));

    const result = await restoreFromBackup(parsedBackup);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("DM_004");
    expect(result.failedStage).toBe("restoring_database");
  });

  it("🔴 KISMİ BAŞARI: bazı fotoğraflar BAŞARISIZ OLURSA, veritabanı YİNE de geri yüklenmiş sayılır (partialSuccess:true, DM_005)", async () => {
    const twoPhotos: ParsedBackup = {
      ...parsedBackup,
      photoEntries: [
        { path: "photos/foto1.jpg", data: strToU8("A") },
        { path: "photos/foto2.jpg", data: strToU8("B") },
      ],
    };
    writeFileMock.mockResolvedValueOnce({ uri: "file:///ok" }).mockRejectedValueOnce(new Error("disk dolu"));

    const result = await restoreFromBackup(twoPhotos);

    expect(result.success).toBe(true);
    expect(result.partialSuccess).toBe(true);
    expect(result.photosRestoredCount).toBe(1);
    expect(result.photosFailedCount).toBe(1);
    expect(result.errorCode).toBe("DM_005");
    // KESİN kanıt: veritabanı İMPORT'u GERÇEKTEN çağrıldı (fotoğraf hatası, veritabanını GERİ ALMAZ).
    expect(importDatabaseFromJsonMock).toHaveBeenCalledTimes(1);
  });

  it("hiç fotoğraf YOKKEN de GERÇEKTEN başarılı olur", async () => {
    const noPhotos: ParsedBackup = { ...parsedBackup, photoEntries: [] };

    const result = await restoreFromBackup(noPhotos);

    expect(result.success).toBe(true);
    expect(result.photosRestoredCount).toBe(0);
  });
});
