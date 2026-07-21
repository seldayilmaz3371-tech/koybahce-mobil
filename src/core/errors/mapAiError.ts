/**
 * AI Hata Eşleyici
 * ===================
 * bkz. docs/error-handling-standard.md, ADR 0024. `mapSqliteError`
 * SADECE SQLite hataları için — AI'nin kendi hata kodları (Bölüm 15
 * izin kapıları, Provider/Tool tutarsızlıkları) buraya AYRI olarak
 * eşleniyor (isim karışıklığı olmasın diye AYRI dosya, Kural 4).
 *
 * bkz. Sprint 10.6 (Production Ready — Öncelik 2, AI X-Ray denetimi).
 * ÖNCEDEN, GeminiProvider'dan gelen TÜM ham hatalar (401/403/429/
 * RESOURCE_EXHAUSTED/400/ağ hatası dahil) ayrım yapılmadan `SYS_001`'e
 * düşüyordu — bu, hem kullanıcı deneyimini hem geliştirici teşhisini
 * zorlaştırıyordu. Aşağıdaki marker'lar GERÇEKTEN `GeminiProvider.ts`'in
 * KENDİ `isRetryableGeminiError()` fonksiyonunda ZATEN kullanılan,
 * doğrulanmış Gemini hata biçimleridir — varsayım değildir. Ağ/timeout
 * marker'ları ise JavaScript'in KENDİ standart hata mesajı biçimleridir
 * (`TypeError: Failed to fetch`, `AbortError`) — tarayıcı/Node.js'in
 * evrensel davranışı, Gemini'ye özgü bir varsayım değil.
 *
 * SIRALAMA ÖNEMLİ: `RESOURCE_EXHAUSTED` (kalıcı kota) kontrolü, `429`
 * (geçici rate limit) kontrolünden ÖNCE yapılıyor — Google'ın kendi
 * hata gövdesinde RESOURCE_EXHAUSTED genelde 429 HTTP durumuyla
 * birlikte gelir, ama anlamı farklıdır (kota tükenmesi kalıcıdır,
 * rate limit geçicidir) — bu yüzden daha SPESİFİK marker önce kontrol
 * edilmeli, aksi halde her RESOURCE_EXHAUSTED yanlışlıkla "geçici rate
 * limit" olarak sınıflandırılırdı.
 */

import { ErrorCode, type ErrorCodeValue } from "./errorCodes";

export function mapAiError(error: unknown): ErrorCodeValue {
  const message = error instanceof Error ? error.message : String(error);

  // bkz. Sprint 10.6, Öncelik 2 — "Debug sırasında gerçek hata logları
  // görülebilsin." Bu, KULLANICIYA gösterilen mesajı DEĞİŞTİRMİYOR
  // (o hâlâ çevrilmiş `ErrorCodeValue` üzerinden gösteriliyor) — SADECE
  // geliştirme konsoluna (`console.error`, ADB logcat ile görülebilir)
  // ham, teknik hata mesajını yazıyor. Mevcut fonksiyon imzası
  // DEĞİŞMEDİ (geriye dönük tam uyumlu, hiçbir çağıran güncellenmesi
  // GEREKMEDİ) — bu, "AI mimarisini bozacak refactor yapma" kuralına
  // uygun, en düşük riskli çözüm.
  console.error("[AI Hatası — ham teknik detay, sadece geliştirme amaçlı]", message);

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
  if (message.includes("AI_PHOTO_ANALYSIS_EMPTY_RESPONSE")) {
    return ErrorCode.AI_005;
  }
  if (message.includes('"code":401') || message.includes('"code":403')) {
    return ErrorCode.AI_006;
  }
  if (message.includes("RESOURCE_EXHAUSTED")) {
    return ErrorCode.AI_007;
  }
  if (message.includes('"code":429')) {
    return ErrorCode.AI_008;
  }
  if (message.includes('"code":400')) {
    return ErrorCode.AI_009;
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("ENOTFOUND")) {
    return ErrorCode.AI_010;
  }
  if (message.includes("AbortError") || message.toLowerCase().includes("timeout")) {
    return ErrorCode.AI_011;
  }
  return ErrorCode.SYS_001;
}
