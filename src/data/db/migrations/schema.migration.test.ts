/**
 * Şema Migration Testleri — Sürüm 6 → 7 (Para Birimi Düzeltmesi)
 * ==================================================================
 * bkz. Sprint 4.3.1. Diğer testlerin aksine (ki hepsi TÜM migration'ları
 * baştan uygulayıp final şemayı test eder), bu test GERÇEK bir yükseltme
 * senaryosunu simüle ediyor: Sürüm 6'da (amount REAL) veri oluştur,
 * SADECE Sürüm 7 migration'ını uygula, verinin GÜVENLE (veri kaybı
 * olmadan, doğru yuvarlamayla) `amount_minor INTEGER`'a dönüştüğünü
 * kanıtla.
 */

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_MIGRATIONS } from "./schema";

describe("Şema Migration — Sürüm 6 → 7 (finance_records.amount → amount_minor)", () => {
  it("Sürüm 6'daki gerçek REAL veriler, Sürüm 7 migration'ı sonrası veri kaybı olmadan INTEGER'a dönüşür", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    // SADECE Sürüm 6'ya kadar olan migration'ları uygula (Sürüm 7 HARİÇ)
    // — gerçek bir "yükseltmeden önceki" veritabanını simüle ediyor.
    const upToV6 = SCHEMA_MIGRATIONS.filter((m) => m.toVersion <= 6).flatMap((m) => m.statements);
    for (const statement of upToV6) {
      db.exec(statement);
    }

    // Sürüm 6 şemasıyla (amount REAL) gerçek veri oluştur.
    const parcelId = "parcel-1";
    db.prepare(
      `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`
    ).run(parcelId, "Test Parseli", "olive", 5, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");

    const testCases: Array<{ id: string; amount: number; expectedMinor: number }> = [
      { id: "fr-1", amount: 19.99, expectedMinor: 1999 },
      { id: "fr-2", amount: 1500.5, expectedMinor: 150050 },
      { id: "fr-3", amount: 100, expectedMinor: 10000 },
    ];
    for (const { id, amount } of testCases) {
      db.prepare(
        `INSERT INTO finance_records
           (id, parcel_id, record_type, amount, currency_code, record_date, is_active, created_at, updated_at)
         VALUES (?, ?, 'cost', ?, 'TRY', ?, 1, ?, ?)`
      ).run(id, parcelId, amount, "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    }

    // ŞİMDİ Sürüm 7 migration'ını (SADECE onu) uygula.
    const v7Statements = SCHEMA_MIGRATIONS.find((m) => m.toVersion === 7)!.statements;
    for (const statement of v7Statements) {
      db.exec(statement);
    }

    // Veri KAYBOLMADI ve DOĞRU dönüştü mü?
    for (const { id, expectedMinor } of testCases) {
      const row = db.prepare(`SELECT amount_minor FROM finance_records WHERE id = ?`).get(id) as {
        amount_minor: number;
      };
      expect(row.amount_minor).toBe(expectedMinor);
      expect(Number.isInteger(row.amount_minor)).toBe(true);
    }

    // Eski `amount` sütunu artık YOK (tablo tamamen yeniden oluşturuldu).
    const columns = db.prepare(`PRAGMA table_info(finance_records)`).all() as Array<{ name: string }>;
    expect(columns.map((c) => c.name)).not.toContain("amount");
    expect(columns.map((c) => c.name)).toContain("amount_minor");

    // Toplam kayıt sayısı KORUNDU (hiçbir satır kaybolmadı).
    const count = db.prepare(`SELECT COUNT(*) as c FROM finance_records`).get() as { c: number };
    expect(count.c).toBe(3);

    db.close();
  });
});
