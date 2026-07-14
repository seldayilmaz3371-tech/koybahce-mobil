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
import { FALLBACK_LANGUAGE_CODE, isSupportedLanguageCode } from "./supportedLanguages";

/** Cihazın işletim sistemi dilini, sadece dil kodu (ör. 'tr') olarak döndürür. */
function detectDeviceLanguageCode(): string {
  const fullLocale = navigator.language || FALLBACK_LANGUAGE_CODE;
  return fullLocale.split("-")[0].toLowerCase();
}

/**
 * Uygulamanın bu oturumda kullanacağı dili belirler. Daha önce kayıtlı
 * bir tercih yoksa, cihaz dilini algılayıp bunu KALICI OLARAK KAYDEDER
 * (böylece bir sonraki açılışta aynı mantığı tekrar çalıştırmaya gerek
 * kalmaz ve kullanıcı isterse bunu ayarlardan değiştirebilir).
 */
export async function resolveInitialLanguage(): Promise<string> {
  const storedPreference = await localPreferences.get(LocalPreferenceKey.LANGUAGE);
  if (storedPreference && isSupportedLanguageCode(storedPreference)) {
    return storedPreference;
  }

  const deviceLanguage = detectDeviceLanguageCode();
  const resolved = isSupportedLanguageCode(deviceLanguage)
    ? deviceLanguage
    : FALLBACK_LANGUAGE_CODE;

  await localPreferences.set(LocalPreferenceKey.LANGUAGE, resolved);
  return resolved;
}

/** Kullanıcının ayarlar ekranından açıkça bir dil seçmesi durumunda çağrılır. */
export async function setLanguagePreference(languageCode: string): Promise<void> {
  if (!isSupportedLanguageCode(languageCode)) {
    throw new Error(`Desteklenmeyen dil kodu: '${languageCode}'`);
  }
  await localPreferences.set(LocalPreferenceKey.LANGUAGE, languageCode);
}
