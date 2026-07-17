/**
 * AI Hata Eşleyici
 * ===================
 * bkz. docs/error-handling-standard.md, ADR 0024. `mapSqliteError`
 * SADECE SQLite hataları için — AI'nin kendi hata kodları (Bölüm 15
 * izin kapıları, Provider/Tool tutarsızlıkları) buraya AYRI olarak
 * eşleniyor (isim karışıklığı olmasın diye AYRI dosya, Kural 4).
 */

import { ErrorCode, type ErrorCodeValue } from "./errorCodes";

export function mapAiError(error: unknown): ErrorCodeValue {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("AI_NOT_ENABLED")) {
    return ErrorCode.AI_001;
  }
  if (message.includes("AI_INTERNET_PERMISSION_DENIED")) {
    return ErrorCode.AI_002;
  }
  if (message.includes("AI_PROVIDER_NOT_REGISTERED")) {
    return ErrorCode.AI_003;
  }
  if (message.includes("AI_PROVIDER_API_KEY_NOT_CONFIGURED")) {
    return ErrorCode.AI_004;
  }
  return ErrorCode.SYS_001;
}
