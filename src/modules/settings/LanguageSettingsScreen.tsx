/**
 * LanguageSettingsScreen
 * ==========================
 * bkz. Sprint 10.18 (Ayarlar Hub Genişlemesi — Dil). Backend altyapısı
 * (`languagePreference.ts`, `supportedLanguages.ts`) Sprint 6 civarında
 * (ADR 0015/0020/0021) zaten tamamlanmıştı — `resolveInitialLanguage()`
 * fonksiyonunun kendi yorumunda "Ayarlar ekranı henüz yok" notu vardı.
 * Bu ekran, SADECE eksik olan UI parçasını ekliyor — hiçbir yeni
 * mimari karar/backend değişikliği gerekmedi.
 *
 * DAVRANIŞ: Bir dile dokunmak, HEM kalıcı tercihi (`setLanguagePreference`,
 * bir sonraki açılışta kullanılır) HEM de GERÇEK ZAMANLI uygulamayı
 * (`i18n.changeLanguage`, react-i18next'in TÜM `useTranslation()`
 * kullanan bileşenleri otomatik yeniden render etmesi — established,
 * güvenilir bir react-i18next davranışı) günceller — kullanıcı dili
 * değiştirdiğinde, uygulamayı yeniden başlatmasına GEREK KALMAZ.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/i18n";
import { SUPPORTED_LANGUAGES, applyDocumentDirection } from "../../i18n/supportedLanguages";
import { setLanguagePreference } from "../../i18n/languagePreference";

interface LanguageSettingsScreenProps {
  onBack: () => void;
}

export function LanguageSettingsScreen({ onBack }: LanguageSettingsScreenProps) {
  const { t } = useTranslation();
  const [changingTo, setChangingTo] = useState<string | null>(null);

  const handleSelectLanguage = async (code: string) => {
    if (code === i18n.language || changingTo) return;
    setChangingTo(code);
    try {
      await setLanguagePreference(code);
      await i18n.changeLanguage(code);
      applyDocumentDirection(code);
    } finally {
      setChangingTo(null);
    }
  };

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("languageSettings.screenTitle")}</h1>

      <ul className="parcel-list">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <li key={lang.code}>
              <button
                type="button"
                className="parcel-list__item"
                onClick={() => handleSelectLanguage(lang.code)}
                disabled={changingTo !== null}
                aria-pressed={isActive}
              >
                <span className="parcel-list__name">
                  {lang.nativeName}
                  {isActive ? " ✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("languageSettings.backButton")}
      </button>
    </main>
  );
}
