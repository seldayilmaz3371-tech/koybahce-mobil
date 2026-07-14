/**
 * Test Veritabanı Yürütücüsü (better-sqlite3 tabanlı)
 * ========================================================
 * bkz. docs/adr/0018-test-stratejisi.md
 *
 * `DatabaseExecutor` sözleşmesini `better-sqlite3` üzerine ince bir
 * Promise sarmalayıcısıyla uygular. `better-sqlite3` senkron çalışır
 * (`db.prepare(...).all()` bir Promise değil, doğrudan sonuç döner) —
 * bu yüzden her metod `Promise.resolve()` ile sarmalanıyor, gerçek
 * asenkron bir işlem yok, sadece `DatabaseExecutor` arayüzüne uyum.
 *
 * ÖNEMLİ SINIR: Bu, native Capacitor SQLite köprüsünü, şifrelemeyi
 * veya native davranışı test ETMEZ — sadece SQL sorgu doğruluğunu ve
 * repository iş mantığını, gerçek bir SQLite motoruna karşı doğrular
 * (ADR 0018'de bu ayrım açıkça belirtilmişti).
 *
 * GÜVENLİK SINIRI: Bu dosya `better-sqlite3`'ü (native Node eklentisi)
 * import ediyor — Android WebView'de ÇALIŞMAZ ve çalışmamalı. Sadece
 * `.test.ts` dosyalarından import edilir; hiçbir üretim dosyası
 * (`main.tsx`'ten ulaşılabilir hiçbir dosya) bunu import ETMEMELİDİR.
 * main.tsx'ten hiçbir zaman ulaşılamadığı için Vite build çıktısına
 * hiç girmez (dead-code elimination), ama bu disiplin ihlal edilirse
 * (yanlışlıkla üretim kodundan import edilirse) build zamanı bunu
 * yakalamaz — bu yüzden kod incelemesinde dikkat edilmesi gereken bir
 * kural olarak burada açıkça belirtiliyor.
 */

import Database from "better-sqlite3";
import type { DatabaseExecutor } from "./databaseExecutor";

export function createTestDatabaseExecutor(schemaStatements: string[]): DatabaseExecutor {
  const db = new Database(":memory:");
  for (const statement of schemaStatements) {
    db.exec(statement);
  }

  return {
    async query(statement, values = []) {
      const rows = db.prepare(statement).all(...values);
      return { values: rows };
    },
    async run(statement, values = []) {
      const result = db.prepare(statement).run(...values);
      return {
        changes: {
          changes: result.changes,
          lastId: Number(result.lastInsertRowid),
        },
      };
    },
    async beginTransaction() {
      db.exec("BEGIN");
    },
    async commitTransaction() {
      db.exec("COMMIT");
    },
    async rollbackTransaction() {
      db.exec("ROLLBACK");
    },
  };
}
