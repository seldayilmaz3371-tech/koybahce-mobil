/**
 * Veritabanı Yürütücü Sözleşmesi
 * ================================
 * bkz. docs/adr/0018-test-stratejisi.md — "Uygulama Notu" bölümünde
 * işaretlenen açık sorunun çözümü.
 *
 * `SQLiteDBConnection` (üretim, `@capacitor-community/sqlite`) ZATEN
 * bu şekle yapısal olarak (structural typing) uyuyor — bu arayüz,
 * `BaseRepository`'nin gerçekte kullandığı 5 metodun minimal bir alt
 * kümesini tanımlıyor. Testlerde ise bu arayüzü `better-sqlite3`
 * üzerine ince bir Promise sarmalayıcısıyla uygulayan bir nesne
 * verilecek (bkz. src/data/db/testDatabaseExecutor.ts).
 *
 * Bu soyutlamayı ŞİMDİ (ilk gerçek test yazılırken) ekliyoruz —
 * daha önce (ADR 0018 uygulama notu) bilerek ertelenmişti, çünkü
 * kullanılmayan bir soyutlamayı önceden inşa etmek YAGNI ihlaliydi.
 *
 * KÖK NEDEN DÜZELTMESİ (Sprint 3.10.1, gerçek Android cihaz hatası):
 * `run()`'ın 3. parametresi (`transaction`), gerçek
 * `SQLiteDBConnection.run(statement, values?, transaction?, ...)`
 * imzasından KESİN doğrulandı (`node_modules/@capacitor-community/
 * sqlite/dist/esm/definitions.d.ts`) — varsayılan `true`. Bu parametre
 * ÖNCEDEN hiç geçirilmiyordu, bu yüzden `runInTransaction()` içindeki
 * her `execute()` çağrısı native tarafta KENDİ ek transaction'ını
 * açmaya çalışıyordu → "Already in transaction" (gerçek cihazda,
 * eski test executor'ımızda YOK sayıldığı için Vitest'te hiç
 * yakalanmıyordu).
 */

export interface DatabaseExecutor {
  query(statement: string, values?: unknown[]): Promise<{ values?: unknown[] }>;
  run(
    statement: string,
    values?: unknown[],
    /**
     * `true` (veya verilmezse varsayılan) ise, yürütücü BU çağrı için
     * KENDİ transaction'ını açar/kapatır — tek başına bir yazma işlemi
     * için doğru davranış. `false` ise, çağıranın ZATEN dıştan bir
     * transaction yönettiği varsayılır (bkz. `BaseRepository.
     * runInTransaction()`), yürütücü kendi transaction'ını AÇMAZ.
     */
    transaction?: boolean
  ): Promise<{ changes?: { changes?: number; lastId?: number } }>;
  beginTransaction(): Promise<unknown>;
  commitTransaction(): Promise<unknown>;
  rollbackTransaction(): Promise<unknown>;
}
