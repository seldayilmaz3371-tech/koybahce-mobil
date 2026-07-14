/**
 * i18next Kurulumu
 * ===================
 *
 * MİMARİ KARAR (bkz. docs/adr/0011-i18n-mimarisi.md):
 * - `i18next-http-backend` KULLANILMIYOR: tüm çeviriler derleme
 *   zamanında pakete gömülü statik JSON dosyalarıdır (offline-first,
 *   Kural 17 — çalışma zamanında hiçbir çeviri sunucusuna bağımlılık
 *   yok).
 * - `i18next-browser-languagedetector` KULLANILMIYOR: bu eklenti web
 *   siteleri için (cookie/URL/localStorage tabanlı) tasarlanmıştır;
 *   biz kendi native-uyumlu algılama mantığımızı yazdık
 *   (languagePreference.ts).
 *
 * `initI18n()`, uygulamanın ilk render'ından ÖNCE (main.tsx'te)
 * çağrılmalıdır — çünkü kilit ekranı bile doğru dilde gösterilmelidir.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import tr from "./locales/tr/common.json";
import { applyDocumentDirection } from "./supportedLanguages";
import { resolveInitialLanguage } from "./languagePreference";

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

export async function initI18n(): Promise<void> {
  const language = await resolveInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "en",
    interpolation: {
      // React zaten XSS'e karşı kaçış (escape) yapıyor; i18next'in
      // kendi kaçışını burada bir daha uygulaması gereksizdir.
      escapeValue: false,
    },
  });

  applyDocumentDirection(language);
}

export default i18n;
