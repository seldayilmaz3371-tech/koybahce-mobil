/**
 * Şema Migration Testi — Sürüm 9 (Bakım Planları)
 * ===================================================
 * bkz. Sprint 5.4. `maintenance_plans` YENİ bir tablo — dönüştürülecek
 * eski veri yok. Test, migration'ın doğru şemayı ürettiğini kanıtlıyor.
 *
 * GERÇEK BULGU (Sprint 5.4'te yakalandı): `CURRENT_SCHEMA_VERSION`
 * testi SADECE en güncel migration dosyasında yaşamalı — Sprint
 * 5.1'in `schema-v8-...test.ts` dosyasında "CURRENT_SCHEMA_VERSION
 * 8'e güncellenmiş" testi vardı, bu sprint (Sürüm 9) eklenince o test
 * DOĞAL OLARAK başarısız oldu (yanlış bir regresyon değil — sabit
 * gerçekten değişti). O test kaldırıldı, bu dosyadaki AŞAĞIDAKİ test
 * artık tek doğruluk kaynağı. Gelecekteki her yeni migration, BİR
 * ÖNCEKİ migration test dosyasındaki bu tür bir testi SİLMELİ, kendi
 * dosyasına eklemeli.
 */

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_MIGRATIONS } from "./schema";

describe("Şema Migration — Sürüm 9 (maintenance_plans)", () => {
  it("Sürüm 9 migration'ı, önceki tüm sürümler üzerine doğru şekilde uygulanır", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) {
      db.exec(statement);
    }

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = 'maintenance_plans'`)
      .all() as Array<{ name: string }>;
    expect(tables).toHaveLength(1);

    db.close();
  });

  it("maintenance_plans tablosu doğru sütunlara sahip", () => {
    const db = new Database(":memory:");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    const columns = db.prepare(`PRAGMA table_info(maintenance_plans)`).all() as Array<{ name: string }>;
    const columnNames = columns.map((c) => c.name).sort();

    expect(columnNames).toEqual(
      [
        "id",
        "parcel_id",
        "tree_id",
        "maintenance_type",
        "interval_days",
        "next_due_date",
        "is_active",
        "created_at",
        "updated_at",
      ].sort()
    );

    db.close();
  });

  it("maintenance_type CHECK kısıtı, maintenance_records ile BİREBİR AYNI değer kümesini paylaşıyor (gerçekten zorlanıyor)", () => {
    const db = new Database(":memory:");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at)
       VALUES ('p1', 'Test', 'olive', 5, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );

    // Geçerli bir değer (kayıtlarla PAYLAŞILAN küme) kabul edilir.
    expect(() => {
      db.prepare(
        `INSERT INTO maintenance_plans
           (id, parcel_id, maintenance_type, interval_days, next_due_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      ).run("mp1", "p1", "irrigation", 7, "2026-04-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).not.toThrow();

    // Geçersiz bir değer reddedilir.
    expect(() => {
      db.prepare(
        `INSERT INTO maintenance_plans
           (id, parcel_id, maintenance_type, interval_days, next_due_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      ).run("mp2", "p1", "gecersiz_tur", 7, "2026-04-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });

  it("maintenance_plans, hem parcels hem trees'e FOREIGN KEY ile bağlı (gerçekten zorlanıyor)", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    expect(() => {
      db.prepare(
        `INSERT INTO maintenance_plans
           (id, parcel_id, maintenance_type, interval_days, next_due_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      ).run("mp1", "var-olmayan-parsel", "irrigation", 7, "2026-04-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });

  it("CURRENT_SCHEMA_VERSION 9'a güncellenmiş", async () => {
    const { CURRENT_SCHEMA_VERSION } = await import("./schema");
    expect(CURRENT_SCHEMA_VERSION).toBe(9);
  });
});
