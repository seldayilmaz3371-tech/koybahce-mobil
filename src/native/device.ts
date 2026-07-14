/**
 * Cihaz Bilgisi — İnce Sarmalayıcı Katmanı
 * ============================================
 *
 * MİMARİ KARAR (bkz. docs/adr/0020-navigator-language-android-webview-sorunu.md):
 * Cihazın dilini sorgulamak için `navigator.language` KULLANILMIYOR.
 * Gerçek Android cihaz testinde, sistem dili değiştirilip uygulama
 * yeniden açıldığında `navigator.language`'ın ESKİ değeri döndürdüğü
 * tespit edildi — bu, Android WebView'ın (Chromium tabanlı) renderer
 * süreçlerini önbelleklemesiyle ilgili bilinen bir platform
 * davranışıdır; uygulama sürecini sonlandırmak WebView'ın alt
 * süreçlerini her zaman sıfırlamaz.
 *
 * `@capacitor/device`'ın `getLanguageCode()` metodu, native (Kotlin)
 * katmandan Android'in `Configuration`/`Locale` API'sini doğrudan
 * sorgular — WebView'ın JS motorunu veya önbellekli render sürecini
 * hiç devreye sokmaz. Bu yüzden her çağrıda güncel sonuç verir.
 */

import { Device } from "@capacitor/device";

/**
 * Cihazın o anki sistem dilini iki karakterlik kod olarak döndürür
 * (ör. 'tr', 'en'). Native katmandan sorgulanır — WebView önbelleğine
 * bağımlı değildir.
 */
export async function getDeviceLanguageCode(): Promise<string> {
  const result = await Device.getLanguageCode();
  return result.value.toLowerCase();
}
