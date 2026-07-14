/**
 * Dil Tercihi Çözümlemesi
 * =========================
 * Öncelik sırası:
 *   1. Kullanıcının daha önce açıkça seçtiği ve kalıcı depoya
 *      (@capacitor/preferences — bkz. native/preferences.ts) yazılmış
 *      dil tercihi.
 *   2. Cihazın işletim sistemi dili (Intl API üzerinden — ek bir
 *      Capacitor eklentisi gerektirmez, WebView'a yerleşik).
 *   3. Cihaz dili desteklenen diller arasında yoksa: İngilizce
 *      (FALLBACK_LANGUAGE_CODE) — Engineering Protocol gereği.
 *
 * Bu fonksiyon, uygulama ilk render edilmeden ÖNCE (main.tsx'te)
 * çağrılır — bu yüzden kimlik doğrulama veya SQLite'a bağımlı DEĞİLDİR
 * (ikisi de henüz hazır olmayabilir).
 */

import { localPreferences, LocalPreferenceKey } from "../native/preferences";
import { getDeviceLanguageCode } from "../native/device";
import { FALLBACK_LANGUAGE_CODE, isSupportedLanguageCode } from "./supportedLanguages";

/**
 * Cihazın işletim sistemi dilini sorgular.
 *
 * DÜZELTME (bkz. ADR 0020, 2026-07-14): Önceki sürüm `navigator.language`
 * kullanıyordu. Gerçek cihaz testinde, Android sistem dili
 * değiştirildiğinde bu değerin GÜNCELLENMEDİĞİ tespit edildi — Android
 * WebView'ın renderer süreç önbellekleme davranışı nedeniyle. Artık
 * `@capacitor/device` üzerinden native katmandan sorgulanıyor (bkz.
 * native/device.ts) — WebView önbelleğine bağımlı değil.
 *
 * Hata durumunda (ör. eklenti bir nedenle başarısız olursa) İngilizceye
 * düşülür — dil algılama hiçbir zaman uygulamanın açılmasını
 * engellememelidir.
 */
async function detectDeviceLanguageCode(): Promise<string> {
  try {
    return await getDeviceLanguageCode();
  } catch {
    return FALLBACK_LANGUAGE_CODE;
  }
}

/**
 * Uygulamanın bu oturumda kullanacağı dili belirler.
 *
 * DAVRANIŞ (bkz. ADR 0015 — 2026-07-14 düzeltmesi):
 *   - Kullanıcı daha önce AYARLARDAN BİLEREK bir dil seçtiyse
 *     (setLanguagePreference() ile kaydedilmiş), o dil öncelikli ve
 *     kalıcıdır — cihaz dili değişse bile geçerliliğini korur.
 *   - Kullanıcı hiç bilinçli bir seçim yapmadıysa, HER AÇILIŞTA
 *     cihazın o anki sistem dili canlı olarak okunur ve kullanılır —
 *     bu değer KALICI OLARAK YAZILMAZ. Böylece kullanıcı Ayarlar'dan
 *     Türkçe→İngilizce değiştirirse, uygulama bir sonraki açılışta
 *     bunu otomatik yansıtır.
 *
 * Önceki sürüm, otomatik algılanan dili de kalıcı olarak yazıyordu —
 * bu, "kullanıcının bilinçli tercihi" ile "sistemin o anki durumu"nu
 * yanlışlıkla aynı şey gibi ele alan bir tasarım hatasıydı (gerçek
 * cihaz testinde bulundu). Düzeltildi.
 */
export async function resolveInitialLanguage(): Promise<string> {
  const explicitPreference = await localPreferences.get(LocalPreferenceKey.LANGUAGE);
  if (explicitPreference && isSupportedLanguageCode(explicitPreference)) {
    return explicitPreference;
  }

  // Bilinçli bir kullanıcı tercihi yok — cihaz dilini CANLI olarak
  // takip et, kalıcı yazma. Bu sayede kullanıcı işletim sistemi
  // dilini değiştirirse, uygulama bir sonraki açılışta bunu yansıtır.
  const deviceLanguage = await detectDeviceLanguageCode();
  return isSupportedLanguageCode(deviceLanguage) ? deviceLanguage : FALLBACK_LANGUAGE_CODE;
}

/** Kullanıcının ayarlar ekranından açıkça bir dil seçmesi durumunda çağrılır. */
export async function setLanguagePreference(languageCode: string): Promise<void> {
  if (!isSupportedLanguageCode(languageCode)) {
    throw new Error(`Desteklenmeyen dil kodu: '${languageCode}'`);
  }
  await localPreferences.set(LocalPreferenceKey.LANGUAGE, languageCode);
}
