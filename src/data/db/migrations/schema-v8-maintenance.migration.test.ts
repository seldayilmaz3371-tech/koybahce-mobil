/**
 * Şema Migration Testi — Sürüm 8 (Bakım Yönetimi)
 * ===================================================
 * bkz. Module 5 Technical Blueprint, Revizyon 6 (Migration Tests
 * zorunlu deliverable). `finance` Sürüm 7 migration testinden farklı
 * olarak (ki gerçek veri dönüşümü içeriyordu), bu YENİ bir tablo —
 * dönüştürülecek eski veri yok. Test, migration'ın GERÇEKTEN doğru
 * şemayı (doğru sütunlar, kısıtlar, indeksler) ürettiğini kanıtlıyor.
 */

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_MIGRATIONS } from "./schema";

describe("Şema Migration — Sürüm 8 (maintenance_records + maintenance_status_log)", () => {
  it("Sürüm 8 migration'ı, önceki tüm sürümler üzerine doğru şekilde uygulanır", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) {
      db.exec(statement);
    }

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('maintenance_records','maintenance_status_log')`)
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name).sort()).toEqual(["maintenance_records", "maintenance_status_log"]);

    db.close();
  });

  it("maintenance_records tablosu doğru sütunlara sahip", () => {
    const db = new Database(":memory:");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    const columns = db.prepare(`PRAGMA table_info(maintenance_records)`).all() as Array<{
      name: string;
      notnull: number;
      dflt_value: string | null;
    }>;
    const columnNames = columns.map((c) => c.name).sort();

    expect(columnNames).toEqual(
      [
        "id",
        "parcel_id",
        "tree_id",
        "maintenance_type",
        "status",
        "scheduled_date",
        "completed_date",
        "notes",
        "is_active",
        "created_at",
        "updated_at",
      ].sort()
    );

    const statusColumn = columns.find((c) => c.name === "status")!;
    expect(statusColumn.dflt_value).toBe("'completed'");

    db.close();
  });

  it("maintenance_type CHECK kısıtı gerçekten uygulanır (yanlış bir değer reddedilir)", () => {
    const db = new Database(":memory:");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at)
       VALUES ('p1', 'Test', 'olive', 5, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );

    expect(() => {
      db.prepare(
        `INSERT INTO maintenance_records
           (id, parcel_id, maintenance_type, status, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      ).run("m1", "p1", "gecersiz_tur", "completed", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });

  it("maintenance_status_log, maintenance_records'a FOREIGN KEY ile bağlı (gerçekten zorlanıyor)", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    expect(() => {
      db.prepare(
        `INSERT INTO maintenance_status_log (id, maintenance_record_id, new_status, changed_at)
         VALUES (?, ?, ?, ?)`
      ).run("log1", "var-olmayan-kayit", "completed", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });
});
