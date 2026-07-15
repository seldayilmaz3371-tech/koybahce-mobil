/**
 * SQLite Hata Eşleyici
 * ======================
 * bkz. docs/error-handling-standard.md
 *
 * Ham SQLite hata mesajını (native `@capacitor-community/sqlite`'tan
 * veya test ortamındaki `better-sqlite3`'ten gelen) en yakın
 * `ErrorCode`'a eşler. Eşleşme desenleri, gerçek hata mesajları
 * çalıştırılarak DOĞRULANDI (varsayılmadı) — bkz. commit mesajı.
 *
 * Repository katmanı bu eşlemeyi YAPMAZ (Belge 2 kararı — repository
 * çeviri/UI kavramlarını bilmez); bu, Hook katmanının sorumluluğudur.
 */

import { ErrorCode, type ErrorCodeValue } from "./errorCodes";

export function mapSqliteError(error: unknown): ErrorCodeValue {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("FOREIGN KEY constraint failed")) {
    return ErrorCode.DB_005;
  }
  if (message.includes("UNIQUE constraint failed")) {
    return ErrorCode.DB_004;
  }
  if (message.includes("CHECK constraint failed")) {
    return ErrorCode.DB_003;
  }
  return ErrorCode.SYS_001;
}
