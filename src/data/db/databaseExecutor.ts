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
 */

export interface DatabaseExecutor {
  query(statement: string, values?: unknown[]): Promise<{ values?: unknown[] }>;
  run(
    statement: string,
    values?: unknown[]
  ): Promise<{ changes?: { changes?: number; lastId?: number } }>;
  beginTransaction(): Promise<unknown>;
  commitTransaction(): Promise<unknown>;
  rollbackTransaction(): Promise<unknown>;
}
