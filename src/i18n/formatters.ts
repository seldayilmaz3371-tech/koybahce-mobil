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
 * KAPSAM NOTU (YAGNI): Şu an sadece tarih/saat biçimlendirici var,
 * çünkü Modül 1'de gösterilen tek biçimlendirilebilir değer bu
 * (`firstLaunchAt`). Sayı/para birimi/ölçü birimi formatlayıcıları,
 * bunlara gerçekten ihtiyaç duyan modül (Finans, Stok) geldiğinde
 * eklenecek — şimdiden kullanılmayan formatlayıcı yazmak gereksiz
 * kod olurdu.
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
