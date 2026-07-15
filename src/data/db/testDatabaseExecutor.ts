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
 * ÖNEMLİ SINIR: Bu, native Capacitor SQLite köprüsünü veya şifrelemeyi
 * test ETMEZ — sadece SQL sorgu doğruluğunu ve repository iş mantığını,
 * gerçek bir SQLite motoruna karşı doğrular (ADR 0018'de bu ayrım
 * açıkça belirtilmişti). AMA `run()`'ın `transaction` parametresi
 * davranışı (Sprint 3.10.1'de eklendi) BİLEREK gerçekçi simüle
 * ediliyor — bkz. aşağıdaki not.
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
 *
 * SPRINT 3.10.1 KÖK NEDEN DÜZELTMESİ — GERÇEKÇİ TRANSACTION SİMÜLASYONU:
 * Gerçek Android cihazda "Already in transaction" hatası bulundu, ama
 * bu test executor'ında YAKALANMAMIŞTI çünkü `run()`'ın `transaction`
 * parametresi (native'de varsayılan `true` — her çağrı kendi
 * transaction'ını açar) burada TAMAMEN yok sayılıyordu. Artık gerçek
 * `SQLiteDBConnection.run()` davranışı simüle ediliyor: `transaction`
 * `true` (veya belirtilmezse) ise bu çağrı KENDİ `BEGIN`/`COMMIT`'ini
 * açar — zaten dıştan açılmış bir transaction varken bunu denerse
 * ("Already in transaction") hata fırlatır, TIPKI native'de olduğu
 * gibi. `transaction: false` ise, çağıranın (BaseRepository.
 * runInTransaction) zaten dıştan yönettiği varsayılır, kendi
 * transaction'ını AÇMAZ.
 */

import Database from "better-sqlite3";
import type { DatabaseExecutor } from "./databaseExecutor";

export function createTestDatabaseExecutor(schemaStatements: string[]): DatabaseExecutor {
  const db = new Database(":memory:");
  // ADR 0022 ile tutarlı: gerçek bağlantı da bunu açıkça etkinleştiriyor
  // (bkz. data/db/connection.ts). Burada da açık tutmak, FK kısıtlarımızın
  // gerçekten doğru tanımlandığını (syntax + davranış) test edebilmemizi
  // sağlıyor.
  db.pragma("foreign_keys = ON");
  for (const statement of schemaStatements) {
    db.exec(statement);
  }

  // Dıştan (BaseRepository.runInTransaction ile) açılmış bir
  // transaction'ın şu an açık olup olmadığını izler — gerçek native
  // plugin'in kendi iç durumunu simüle eder.
  let isExternallyManagedTransactionOpen = false;

  return {
    async query(statement, values = []) {
      const rows = db.prepare(statement).all(...values);
      return { values: rows };
    },
    async run(statement, values = [], transaction = true) {
      if (!transaction) {
        // Çağıran zaten dıştan bir transaction yönetiyor — kendi
        // BEGIN/COMMIT'imizi AÇMIYORUZ, sadece ifadeyi çalıştırıyoruz.
        const result = db.prepare(statement).run(...values);
        return {
          changes: { changes: result.changes, lastId: Number(result.lastInsertRowid) },
        };
      }

      // GERÇEK NATIVE DAVRANIŞI: transaction=true (varsayılan), bu
      // çağrı KENDİ transaction'ını açmaya çalışır. Zaten dıştan
      // açılmış bir transaction varken bu, GERÇEK ANDROID CİHAZDA
      // "Already in transaction" hatasına yol açıyordu.
      if (isExternallyManagedTransactionOpen) {
        throw new Error("Already in transaction");
      }
      db.exec("BEGIN");
      try {
        const result = db.prepare(statement).run(...values);
        db.exec("COMMIT");
        return {
          changes: { changes: result.changes, lastId: Number(result.lastInsertRowid) },
        };
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    async beginTransaction() {
      if (isExternallyManagedTransactionOpen) {
        throw new Error("Already in transaction");
      }
      isExternallyManagedTransactionOpen = true;
      db.exec("BEGIN");
    },
    async commitTransaction() {
      db.exec("COMMIT");
      isExternallyManagedTransactionOpen = false;
    },
    async rollbackTransaction() {
      db.exec("ROLLBACK");
      isExternallyManagedTransactionOpen = false;
    },
  };
}
