/**
 * Şema Migration Testi — Sürüm 11 (Hasat)
 * ===========================================
 * bkz. Sprint 8.1, roadmap Bölüm 2.1. YENİ tablo (harvest_records) —
 * dönüştürülecek eski veri yok.
 */

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_MIGRATIONS } from "./schema";

describe("Şema Migration — Sürüm 11 (Hasat)", () => {
  it("Sürüm 11 migration'ı, önceki tüm sürümler üzerine doğru şekilde uygulanır", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) {
      db.exec(statement);
    }

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = 'harvest_records'`)
      .all() as Array<{ name: string }>;
    expect(tables).toHaveLength(1);

    db.close();
  });

  it("harvest_records, parcels'a FOREIGN KEY ile bağlı (gerçekten zorlanıyor)", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    expect(() => {
      db.prepare(
        `INSERT INTO harvest_records (id, parcel_id, harvest_date, quantity_kg, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`
      ).run("h1", "var-olmayan-parsel", "2026-01-01", 100, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });

  it("tree_id NULLABLE — parsel geneli bir hasat kaydı ağaç belirtmeden oluşturulabilir", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at) VALUES ('p1', 'P', 'olive', 5, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );

    expect(() => {
      db.prepare(
        `INSERT INTO harvest_records (id, parcel_id, tree_id, harvest_date, quantity_kg, is_active, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, 1, ?, ?)`
      ).run("h1", "p1", "2026-01-01", 100, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }).not.toThrow();

    db.close();
  });

  it("CURRENT_SCHEMA_VERSION 11'e güncellenmiş", async () => {
    const { CURRENT_SCHEMA_VERSION } = await import("./schema");
    expect(CURRENT_SCHEMA_VERSION).toBe(11);
  });
});
