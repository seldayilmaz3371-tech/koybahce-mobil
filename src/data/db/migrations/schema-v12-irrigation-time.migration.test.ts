/**
 * Şema Migration Testi — Sürüm 12 (Sulama Başlangıç/Bitiş Saati)
 * ===================================================================
 * bkz. Sprint 10.4. ADDITIVE migration (`ALTER TABLE ... ADD COLUMN`)
 * — mevcut `maintenance_records` verisi HİÇ ETKİLENMEZ, yeni sütunlar
 * NULLABLE.
 *
 * KURAL (Sprint 5.4'te belgelendi, `schema-v9-...test.ts`'e bkz.):
 * "CURRENT_SCHEMA_VERSION" testi SADECE en güncel migration dosyasında
 * yaşar. Bu sprintte v11'in dosyasındaki AYNI testi KALDIRDIK (artık
 * yanlış), aşağıdaki test tek doğruluk kaynağı.
 */

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_MIGRATIONS } from "./schema";

describe("Şema Migration — Sürüm 12 (Sulama Başlangıç/Bitiş Saati)", () => {
  it("Sürüm 12 migration'ı, önceki tüm sürümler üzerine doğru şekilde uygulanır", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) {
      db.exec(statement);
    }

    const columns = db.prepare(`PRAGMA table_info(maintenance_records)`).all() as Array<{ name: string }>;
    const columnNames = columns.map((c) => c.name);
    expect(columnNames).toContain("start_time");
    expect(columnNames).toContain("end_time");

    db.close();
  });

  it("start_time/end_time NULLABLE — mevcut (eski) bir kayıt yazma davranışı simüle edildiğinde HİÇBİR hata FIRLATILMAZ", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at) VALUES ('p1', 'P', 'olive', 5, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );

    // start_time/end_time HİÇ VERİLMEDEN (eski INSERT deseni simülasyonu) — NULL'a düşmeli, hata VERMEMELİ.
    expect(() => {
      db.prepare(
        `INSERT INTO maintenance_records (id, parcel_id, maintenance_type, status, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`
      ).run("m1", "p1", "irrigation", "completed", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).not.toThrow();

    const row = db.prepare(`SELECT start_time, end_time FROM maintenance_records WHERE id = 'm1'`).get() as {
      start_time: string | null;
      end_time: string | null;
    };
    expect(row.start_time).toBeNull();
    expect(row.end_time).toBeNull();

    db.close();
  });

  it("start_time/end_time GERÇEKTEN 'HH:MM' formatında saklanabilir ve geri okunabilir", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at) VALUES ('p1', 'P', 'olive', 5, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );
    db.prepare(
      `INSERT INTO maintenance_records (id, parcel_id, maintenance_type, status, start_time, end_time, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run("m1", "p1", "irrigation", "completed", "06:15", "08:05", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");

    const row = db.prepare(`SELECT start_time, end_time FROM maintenance_records WHERE id = 'm1'`).get() as {
      start_time: string;
      end_time: string;
    };
    expect(row.start_time).toBe("06:15");
    expect(row.end_time).toBe("08:05");

    db.close();
  });

  it("CURRENT_SCHEMA_VERSION 12'ye güncellenmiş", async () => {
    const { CURRENT_SCHEMA_VERSION } = await import("./schema");
    expect(CURRENT_SCHEMA_VERSION).toBe(12);
  });
});
