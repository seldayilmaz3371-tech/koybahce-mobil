/**
 * Tarih Girişi Dönüşüm Yardımcıları
 * ====================================
 * bkz. Sprint 5.2. `FinanceRecordForm`'un kendi içinde tanımladığı
 * `isoToDateInputValue`/`dateInputValueToIso`/`todayAsDateInputValue`
 * ile AYNI mantık — Sprint 5.2'nin "❌ Refactor" yasağı gereği Finance
 * dosyasına DOKUNULMADI (çalışan, test edilmiş kod), ama yeni kodun
 * (Maintenance) bu mantığı TEKRAR yazması da DRY ihlaliydi (Revizyon
 * 7). Bu dosya, sadece YENİ kodun paylaştığı bir yardımcı — mevcut
 * hiçbir dosyaya dokunmadan, ileride Finance da isterse buna geçebilir
 * (bugün zorlanmıyor).
 */

/** `YYYY-MM-DD` (DateField) → ISO 8601 (domain). */
export function dateInputValueToIso(dateInputValue: string): string {
  return `${dateInputValue}T00:00:00.000Z`;
}

/** ISO 8601 (domain) → `YYYY-MM-DD` (DateField). */
export function isoToDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

/** Bugünün tarihi, `YYYY-MM-DD` formatında. */
export function todayAsDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * bkz. Sprint 10.4 (Toplu Gözlem/Bakım — geriye dönük tarih/saat).
 * `DateField` (`YYYY-MM-DD`) + `TimeField` (`HH:MM`) ikilisini TEK bir
 * ISO 8601 (UTC) zaman damgasına birleştirir.
 *
 * 🔴 DİKKAT (gerçek bir hata BURADA yakalanıp düzeltildi): girdi
 * değerleri KULLANICININ YEREL saatidir (`nowAsTimeInputValue()`'nun
 * ürettiği değer, cihazın yerel saatiyle AYNI) — bu yüzden SADECE
 * `${date}T${time}:00.000Z` diye BİRLEŞTİRİP "Z" (UTC) etiketi
 * eklemek YANLIŞTIR (yerel bir değere UTC etiketi yapıştırmak, saat
 * dilimi farkı kadar bir KAYMA yaratır). Doğru yöntem: `Date`
 * nesnesinin YEREL saat yorumlayan constructor'ını (`Z` SUFFİX'İ
 * OLMADAN) kullanıp, SONRA `.toISOString()` ile GERÇEK UTC'ye
 * çevirmek — `new Date().toISOString()`'in (Observation/Photo'nun
 * ZATEN kullandığı) AYNI UTC sözleşmesiyle tutarlı üretim.
 */
export function combineDateAndTimeToIso(dateInputValue: string, timeInputValue: string): string {
  const localDate = new Date(`${dateInputValue}T${timeInputValue}:00`);
  return localDate.toISOString();
}

/**
 * ISO 8601 (UTC, domain) → `HH:MM` (TimeField, YEREL saat). `.slice()`
 * ile HAM UTC saatini almak YANLIŞ olurdu (yukarıdaki
 * `combineDateAndTimeToIso`'daki AYNI hata sınıfı) — `Date`
 * nesnesinin `getHours()`/`getMinutes()`'i (yerel saate göre
 * yorumlar) kullanılıyor.
 */
export function isoToTimeInputValue(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Şu anki saat, `HH:MM` formatında (yerel saat — `TimeField`'in kullanıcıya gösterdiği değerle tutarlı). */
export function nowAsTimeInputValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Bugünün tarihi, yerel saat diliminde `YYYY-MM-DD` formatında (`todayAsDateInputValue`'nun AKSİNE UTC DEĞİL — bkz. not aşağıda). */
export function nowAsDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
