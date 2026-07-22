/**
 * Veri Yönetimi Hata Eşleyici
 * ==============================
 * bkz. docs/error-handling-standard.md, Sprint 10.13 (Veri Yönetimi —
 * Yedekle/Geri Yükle). `mapAiError`'DAN farklı bir desen: backupService/
 * restoreService kendi içlerinde HAM hataları (try/catch ile) zaten
 * yakalayıp kendi `DM_XXX` kodlarına çeviriyor (bkz. o dosyaların
 * kendi kodu) — bu yüzden bu fonksiyonun tek görevi, (1) GEÇERLİ bir
 * `DM_XXX`/bilinen bir kod GELİRSE onu OLDUĞU gibi geçirmek, (2)
 * TAMAMEN beklenmeyen bir exception (servis katmanının ÖNGÖRMEDİĞİ
 * bir durum) dışarı SIZARSA `SYS_001`'e düşürmek — established
 * `mapAiError`/`mapSqliteError` ile AYNI "hiçbir ham hata kullanıcıya
 * SIZMASIN" ilkesi.
 */

import { ErrorCode, type ErrorCodeValue } from "./errorCodes";

const KNOWN_DATA_MANAGEMENT_CODES: readonly string[] = [
  ErrorCode.DM_001,
  ErrorCode.DM_002,
  ErrorCode.DM_003,
  ErrorCode.DM_004,
  ErrorCode.DM_005,
  ErrorCode.DM_006,
];

export function mapDataManagementError(error: unknown): ErrorCodeValue {
  if (typeof error === "string" && KNOWN_DATA_MANAGEMENT_CODES.includes(error)) {
    return error as ErrorCodeValue;
  }
  if (error instanceof Error) {
    console.error("[Veri Yönetimi Hatası — ham teknik detay, sadece geliştirme amaçlı]", error.message);
  }
  return ErrorCode.SYS_001;
}
