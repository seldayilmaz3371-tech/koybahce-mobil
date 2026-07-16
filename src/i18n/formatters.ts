/**
 * Yerelleştirme (l10n) Biçimlendirme Katmanı
 * ==============================================
 *
 * MİMARİ KARAR: Tarih, saat, sayı, para birimi, ölçü birimi
 * biçimlendirmesi HER ZAMAN bu dosya (ve büyüdükçe kardeşleri)
 * üzerinden yapılır — hiçbir bileşen ham `Date`/`Number` metodlarını
 * doğrudan kullanıp kullanıcıya göstermez.
 *
 * Native `Intl` API kullanılıyor — ekstra bağımlılık gerekmiyor
 * (WebView'a yerleşik), CLDR yerelleştirme verisini otomatik sağlıyor.
 *
 * KAPSAM NOTU (YAGNI): Sayı/para birimi biçimlendiricileri Sprint
 * 4.2'de (Finans) eklendi — bu, önceki bir notta "ihtiyaç duyan modül
 * geldiğinde eklenecek" olarak öngörülmüştü, şimdi gerçekleşti. Ölçü
 * birimi formatlayıcısı henüz yok — ihtiyaç duyan modül geldiğinde
 * eklenecek.
 */

/**
 * Bir ISO 8601 tarih string'ini, verilen dile göre okunabilir şekilde
 * biçimlendirir. Örnek: '2026-07-14T11:23:45.123Z' + 'tr' →
 * '14 Temmuz 2026 14:23'.
 */
export function formatDateTime(isoString: string, languageCode: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(languageCode, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

/**
 * SADECE tarih (saat YOK) — Sprint 4.2'de (Finans `recordDate`) ilk
 * kez gerekti. `formatDateTime`'ın aksine: `recordDate`'in saat
 * bileşeni her zaman gece yarısı (`DateField`'ın doğası gereği,
 * kullanıcı sadece tarih seçiyor) — saati göstermek yanıltıcı/
 * gürültülü olurdu ("15 Mart 2026 00:00" bir hata gibi görünür).
 */
export function formatDate(isoString: string, languageCode: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(languageCode, { dateStyle: "long" }).format(date);
}

/**
 * Bir tutarı, verilen para birimi koduna göre biçimlendirir — Sprint
 * 4.2'de (Finans) ilk kez gerekti; bu dosyanın önceki YAGNI notunda
 * zaten öngörülmüştü ("Finans, Stok geldiğinde eklenecek").
 */
export function formatCurrency(amount: number, currencyCode: string, languageCode: string): string {
  return new Intl.NumberFormat(languageCode, { style: "currency", currency: currencyCode }).format(amount);
}
