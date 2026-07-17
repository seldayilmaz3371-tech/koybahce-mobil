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
