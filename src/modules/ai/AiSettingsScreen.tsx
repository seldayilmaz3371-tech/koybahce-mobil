/**
 * AiSettingsScreen
 * ===================
 * bkz. ADR 0024, AI Master Architecture Bölüm 15. Şema (ve domain
 * tipi) TÜM alanları taşıyor (Karar — "henüz kullanılmayacak alanlar
 * olsa bile mimari buna uygun olmalıdır"), ama bu ekran BUGÜN sadece
 * 3'ünü gösteriyor: AI Aktif/Pasif, İnternet İzni, API Anahtarı
 * (Sprint 6 Kod Öncesi Analiz Raporu'nda önerilip kullanıcı tarafından
 * onaylandı — "kademeli UI"). `responseLanguage`/`maxContextItems`/
 * `maxMessages`/`debugMode` alanları için form kontrolü YOK.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAiSettings } from "./hooks/useAiSettings";

export function AiSettingsScreen() {
  const { t } = useTranslation();
  const { settings, status, errorCode, updateSettings, saveApiKey, removeApiKey } = useAiSettings();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim() || isSavingKey) return;
    setIsSavingKey(true);
    try {
      await saveApiKey(apiKeyInput.trim());
      setApiKeyInput("");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    const confirmed = window.confirm(t("aiSettings.removeApiKeyConfirm"));
    if (!confirmed) return;
    await removeApiKey();
  };

  if (status === "idle" || status === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }

  if (status === "error" || !settings) {
    return (
      <main className="status-screen">
        <div className="status-card status-card--error">
          <p className="status-card__value">{t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("aiSettings.screenTitle")}</h1>

      <label className="status-card">
        <input
          type="checkbox"
          checked={settings.isEnabled}
          onChange={(e) => updateSettings({ isEnabled: e.target.checked })}
        />
        {" " + t("aiSettings.isEnabledLabel")}
      </label>

      <label className="status-card">
        <input
          type="checkbox"
          checked={settings.internetPermission}
          onChange={(e) => updateSettings({ internetPermission: e.target.checked })}
        />
        {" " + t("aiSettings.internetPermissionLabel")}
      </label>

      <div className="status-card">
        <p className="status-card__label">{t("aiSettings.apiKeyLabel")}</p>
        {settings.apiKeyConfigured ? (
          <>
            <p className="status-card__value">{t("aiSettings.apiKeyConfigured")}</p>
            <button type="button" className="lock-screen__button" onClick={handleRemoveApiKey}>
              {t("aiSettings.removeApiKeyButton")}
            </button>
          </>
        ) : (
          <>
            <input
              type="password"
              aria-label={t("aiSettings.apiKeyLabel")}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              disabled={isSavingKey}
            />
            <button
              type="button"
              className="lock-screen__button"
              onClick={handleSaveApiKey}
              disabled={isSavingKey || !apiKeyInput.trim()}
            >
              {t("aiSettings.saveApiKeyButton")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
