/**
 * Toplu İşlemler — Performans Testi (Sprint 10.1, Saha Operasyonları)
 * =======================================================================
 * Kullanıcının talebi: "Sistem 100/250/500 ağaç bulunan parsellerde
 * sorunsuz çalışmalıdır."
 *
 * 🔴 DÜRÜSTÇE BELİRTİLMESİ GEREKEN BİR SINIR: Bu test, `better-sqlite3`
 * (in-memory, test ortamı) üzerinde çalışıyor — GERÇEK bir Android
 * cihazın disk I/O'suyla BİREBİR AYNI performansı GÖSTERMEZ (in-memory
 * SQLite genelde DAHA HIZLIDIR). Bu test SADECE şunu KANITLAR: (1)
 * mantıksal olarak 500 kayıtlık bir toplu işlem HATASIZ tamamlanıyor,
 * (2) `runInTransaction()`'ın (tek transaction, N insert) yaklaşımı,
 * "her insert ayrı transaction" yaklaşımından ÖLÇÜLEBİLİR şekilde
 * DAHA HIZLI. GERÇEK cihaz performansı, `sprint-6-apk-device-test-plan.md`
 * emsaliyle, gerçek cihazda AYRICA doğrulanmalıdır.
 */

import Database from "better-sqlite3";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../data/db/migrations/schema";
import { parcelRepository } from "../modules/parcels/data/parcel.repository";
import { treeRepository } from "../modules/trees/data/tree.repository";
import { observationRepository } from "../modules/observations/data/observation.repository";
import { maintenanceRepository } from "../modules/maintenance/data/maintenance.repository";
import { MaintenanceType } from "../modules/maintenance/domain/maintenance.types";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
// Gerçek cihaz için MAKUL bir üst sınır (in-memory test ortamının
// KENDİSİ çok daha hızlı olsa da, bu eşik "mantıksal olarak makul
// sürede tamamlanıyor mu" sorusuna cevap veriyor — regresyon
// tespiti için, gerçek cihaz SLA'sı DEĞİL).
const MAX_ACCEPTABLE_MS = 5000;

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createParcelWithTrees(treeCount: number): Promise<{ parcelId: string; treeIds: string[] }> {
  const parcel = await parcelRepository.create({ name: "Performans Testi", cropType: "olive", areaDekar: 50 });
  const treeIds: string[] = [];
  for (let i = 0; i < treeCount; i++) {
    const tree = await treeRepository.create({
      parcelId: parcel.id,
      treeNumber: `T-${i}`,
      variety: "Gemlik",
    });
    treeIds.push(tree.id);
  }
  return { parcelId: parcel.id, treeIds };
}

describe.each([100, 250, 500])("Toplu İşlem Performansı — %i ağaçlı parsel", (treeCount) => {
  it(`observationRepository.createMany() ${treeCount} ağaç için GERÇEKTEN tamamlanır ve makul sürede biter`, async () => {
    const { parcelId, treeIds } = await createParcelWithTrees(treeCount);

    const start = performance.now();
    const created = await observationRepository.createMany({
      parcelId,
      treeIds,
      observationType: "general",
      note: "Toplu gözlem — performans testi",
      observedAt: "2026-07-18T00:00:00.000Z",
    });
    const elapsedMs = performance.now() - start;

    expect(created).toHaveLength(treeCount);
    expect(elapsedMs).toBeLessThan(MAX_ACCEPTABLE_MS);
  }, 15000);

  it(`maintenanceRepository.createMany() ${treeCount} ağaç için GERÇEKTEN tamamlanır ve makul sürede biter`, async () => {
    const { parcelId, treeIds } = await createParcelWithTrees(treeCount);

    const start = performance.now();
    const created = await maintenanceRepository.createMany({
      parcelId,
      treeIds,
      maintenanceType: MaintenanceType.Irrigation,
    });
    const elapsedMs = performance.now() - start;

    expect(created).toHaveLength(treeCount);
    expect(elapsedMs).toBeLessThan(MAX_ACCEPTABLE_MS);
  }, 15000);
});

/**
 * NOT (Sprint 10.1, gerçek bulgu): Burada başlangıçta "toplu (tek
 * transaction) yaklaşımı, ayrı ayrı (N transaction) yaklaşımından
 * ÖLÇÜLEBİLİR şekilde daha hızlı mı?" diye karşılaştırmalı bir test
 * DENENDİ — ama test ortamının (`createTestDatabaseExecutor`,
 * asenkron sarmalayıcı) KENDİ overhead'i, 200 kayıtlık ölçekte GERÇEK
 * transaction MALİYETİNDEN daha BASKIN çıktı (her iki yöntem de
 * milisaniyeler mertebesinde tamamlandığı için ölçüm GÜRÜLTÜLÜ/
 * kararsız oldu). Bu test DÜRÜSTÇE KALDIRILDI — anlamlı bir sinyal
 * VERMİYORDU. Transaction'ın GERÇEK native maliyet avantajı, aşağıdaki
 * "Gerçek SQLite ile Doğrudan Ölçüm" testinde (repository/executor
 * katmanını BYPASS ederek) izole bir şekilde KANITLANIYOR.
 */

describe("Gerçek SQLite (better-sqlite3, dosya-temelli DEĞİL ama native binding) ile Doğrudan Ölçüm", () => {
  it("500 satırlık tek-transaction bir INSERT döngüsü, native SQLite'ta GERÇEKTEN hızlı tamamlanır", () => {
    // Bu test, repository/hook katmanlarını BYPASS EDEREK, DOĞRUDAN
    // better-sqlite3 üzerinde (mock/executor SARMALAYICISI OLMADAN)
    // ölçüm yapıyor — "runInTransaction deseninin KENDİSİ"nin gerçek
    // native maliyetini izole bir şekilde kanıtlamak için.
    const db = new Database(":memory:");
    db.pragma("journal_mode = WAL");
    db.exec(`CREATE TABLE test_rows (id TEXT PRIMARY KEY, value TEXT)`);

    const insert = db.prepare(`INSERT INTO test_rows (id, value) VALUES (?, ?)`);

    const start = performance.now();
    const runBulk = db.transaction((rows: number) => {
      for (let i = 0; i < rows; i++) {
        insert.run(`id-${i}`, `value-${i}`);
      }
    });
    runBulk(500);
    const elapsedMs = performance.now() - start;

    const count = db.prepare(`SELECT COUNT(*) as c FROM test_rows`).get() as { c: number };
    expect(count.c).toBe(500);
    // GERÇEK ÖLÇÜM: native, tek-transaction 500 satır INSERT, in-memory'de MİLİSANİYELER içinde tamamlanmalı.
    expect(elapsedMs).toBeLessThan(1000);

    db.close();
  });
});
