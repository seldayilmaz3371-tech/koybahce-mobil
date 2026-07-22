/**
 * AiSettingsScreen
 * ===================
 * bkz. ADR 0024, AI Master Architecture Bölüm 15. Şema (ve domain
 * tipi) TÜM alanları taşıyor (Karar — "henüz kullanılmayacak alanlar
 * olsa bile mimari buna uygun olmalıdır"), ama bu ekran BUGÜN sadece
 * 4'ünü gösteriyor: AI Aktif/Pasif, İnternet İzni, API Anahtarı,
 * Teşhis Modu (Sprint 10.7'de eklendi — bkz. aşağıdaki not).
 * `responseLanguage`/`maxContextItems`/`maxMessages` alanları için
 * hâlâ form kontrolü YOK.
 *
 * Sprint 10.7 (AI Diagnostic Build) EKLENTİSİ: `debugMode` alanı
 * ŞEMADA zaten vardı (Sprint 6'dan beri) ama hiç UI kontrolü yoktu —
 * bu, YENİ bir migration/veri modeli DEĞİL, mevcut alanı UI'a açmak.
 * Bu toggle açıkken, AI Sohbet/Fotoğraf Analizi ekranlarında bir
 * "Teşhis Bilgisi" butonu görünür (bkz. `AiDiagnosticScreen`) —
 * Release kullanıcıları bu toggle'ı görse de kapalıyken hiçbir
 * teşhis ekranına erişemez (varsayılan değer `false` — Şema Sürüm
 * 10'un migration'ı, mevcut kullanıcılar için zaten `debugMode:
 * false` ile geliyor).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAiSettings } from "./hooks/useAiSettings";

interface AiSettingsScreenProps {
  /** Sprint 7.1 — artık `/settings/ai` altında, `/settings`'e geri dönüş. */
  onBack: () => void;
}

export function AiSettingsScreen({ onBack }: AiSettingsScreenProps) {
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

      <div className="form-field--checkbox status-card">
        <label>
          <input
            type="checkbox"
            checked={settings.isEnabled}
            onChange={(e) => updateSettings({ isEnabled: e.target.checked })}
          />
          {t("aiSettings.isEnabledLabel")}
        </label>
      </div>

      <div className="form-field--checkbox status-card">
        <label>
          <input
            type="checkbox"
            checked={settings.internetPermission}
            onChange={(e) => updateSettings({ internetPermission: e.target.checked })}
          />
          {t("aiSettings.internetPermissionLabel")}
        </label>
      </div>

      <div className="form-field--checkbox status-card">
        <label>
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => updateSettings({ debugMode: e.target.checked })}
          />
          {t("aiSettings.debugModeLabel")}
        </label>
      </div>

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

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
