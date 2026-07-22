import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS, CURRENT_SCHEMA_VERSION } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { photoRepository } from "../../photos/data/photo.repository";
import { observationRepository } from "../../observations/data/observation.repository";
import { readFileAsBase64 } from "../../../native/filesystem";
import { getAppVersion } from "../../../native/appInfo";
import { unzipSync, strFromU8 } from "fflate";
import { base64ToUint8Array } from "../../../shared/utils/base64Binary";
import { BACKUP_SIGNATURE } from "../domain/dataManagement.types";
import { buildBackupFileName, createFullBackup } from "./backupService";

const exportToJsonMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock("../../../data/db/connection", () => ({
  getDatabase: vi.fn(async () => ({ exportToJson: exportToJsonMock })),
}));

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: (...args: unknown[]) => writeFileMock(...args) },
  Directory: { Cache: "CACHE" },
}));

vi.mock("../../../native/filesystem", () => ({
  readFileAsBase64: vi.fn(),
}));

vi.mock("../../../native/appInfo", () => ({
  getAppVersion: vi.fn(),
}));

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
  exportToJsonMock.mockReset().mockResolvedValue({
    export: { database: "bahcem", version: 1, tables: [] },
  });
  writeFileMock.mockReset().mockResolvedValue({ uri: "file:///cache/test-backup.zip" });
  vi.mocked(readFileAsBase64).mockReset().mockResolvedValue("RkFLRV9GT1RPX0RBVEE="); // "FAKE_FOTO_DATA" base64
  vi.mocked(getAppVersion).mockReset().mockResolvedValue("0.1.0-beta.1");
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("buildBackupFileName", () => {
  it("kullanıcının BELİRTTİĞİ TAM formatta dosya adı üretir", () => {
    const fileName = buildBackupFileName("0.10.12", new Date("2026-07-22T10:00:00Z"));

    expect(fileName).toBe("BahcemMobile_Backup_2026-07-22_v0.10.12.zip");
  });

  it("tek haneli ay/gün değerleri SIFIRLA doldurulur (padding)", () => {
    const fileName = buildBackupFileName("1.0.0", new Date("2026-01-05T10:00:00Z"));

    expect(fileName).toContain("2026-01-05");
  });
});

describe("createFullBackup", () => {
  it("🔴 BAŞARILI senaryo: veritabanı export'u + manifest + fotoğraflar GERÇEKTEN TEK bir ZIP'e paketlenir", async () => {
    const parcel = await parcelRepository.create({ name: "P1", cropType: "olive", areaDekar: 5 });
    const observation = await observationRepository.create({
      parcelId: parcel.id,
      observationType: "general",
      observedAt: new Date().toISOString(),
    });
    await photoRepository.create({ observationId: observation.id, filePath: "/data/bahcem-photos/foto1.jpg" });

    const result = await createFullBackup();

    expect(result.success).toBe(true);
    expect(result.filePath).toBe("file:///cache/test-backup.zip");

    // GERÇEKTEN Filesystem.writeFile'a GEÇEN ZIP verisini AÇIP İÇERİĞİNİ doğruluyoruz.
    const writtenBase64 = writeFileMock.mock.calls[0][0].data as string;
    const zipBytes = base64ToUint8Array(writtenBase64);
    const unzipped = unzipSync(zipBytes);

    expect(Object.keys(unzipped)).toContain("manifest.json");
    expect(Object.keys(unzipped)).toContain("database.json");
    expect(Object.keys(unzipped).some((path) => path.startsWith("photos/"))).toBe(true);

    const manifest = JSON.parse(strFromU8(unzipped["manifest.json"]));
    expect(manifest.signature).toBe(BACKUP_SIGNATURE);
    expect(manifest.photoCount).toBe(1);
    expect(manifest.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(manifest.appVersion).toBe("0.1.0-beta.1");
  });

  it("hiç fotoğraf YOKKEN de GERÇEKTEN başarılı olur (photoCount: 0)", async () => {
    const result = await createFullBackup();

    expect(result.success).toBe(true);
    const writtenBase64 = writeFileMock.mock.calls[0][0].data as string;
    const unzipped = unzipSync(base64ToUint8Array(writtenBase64));
    const manifest = JSON.parse(strFromU8(unzipped["manifest.json"]));
    expect(manifest.photoCount).toBe(0);
  });

  it("veritabanı export'u BAŞARISIZ OLURSA (export alanı boş), DM_001 ile başarısız döner", async () => {
    exportToJsonMock.mockResolvedValue({ export: undefined });

    const result = await createFullBackup();

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("DM_001");
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("Filesystem.writeFile BAŞARISIZ OLURSA, DM_001 ile başarısız döner (exception dışarı SIZMAZ)", async () => {
    writeFileMock.mockRejectedValue(new Error("disk dolu"));

    const result = await createFullBackup();

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("DM_001");
  });

  it("getAppVersion null DÖNERSE (web platformu), 'unknown' fallback'i KULLANILIR — çökme YOK", async () => {
    vi.mocked(getAppVersion).mockResolvedValue(null);

    const result = await createFullBackup();

    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
  });
});
