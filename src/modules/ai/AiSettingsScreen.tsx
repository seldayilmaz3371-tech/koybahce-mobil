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
  const { settings, status, errorCode, apiKeyMasked, updateSettings, saveApiKey, removeApiKey } = useAiSettings();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  // bkz. Sprint 10.12, "API Key değiştir butonu olsun. Yeni API Key
  // yapıştırılabilsin." — mevcut "apiKeyConfigured" akışı SADECE
  // "Kaldır" sunuyordu (değiştirmek için önce kaldırıp sonra tekrar
  // eklemek gerekiyordu). Bu, AYRI bir "Developer" akışı — mevcut
  // Release-görünür akışa DOKUNMADAN.
  const [devApiKeyInput, setDevApiKeyInput] = useState("");
  const [isSavingDevKey, setIsSavingDevKey] = useState(false);

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

  // bkz. Sprint 10.12 — "Kaydet ile anında aktif olsun. APK yeniden
  // derlenmeden/uygulamayı yeniden başlatmadan kullanılabilsin." Bu,
  // ZATEN GERÇEKLEŞEN bir davranış (Sprint 6'nın kararı: GeminiProvider
  // API anahtarını HİÇBİR ZAMAN cache'lemiyor, her sendMessage()
  // çağrısında SecureStorage'dan TAZE okuyor) — `saveApiKey()`'in
  // KENDİSİ (üstteki `handleSaveApiKey` ile AYNI fonksiyon), mevcut
  // bir anahtarın ÜZERİNE yazmak için de kullanılabilir, önce
  // kaldırmaya GEREK yok.
  const handleSaveDevApiKey = async () => {
    if (!devApiKeyInput.trim() || isSavingDevKey) return;
    setIsSavingDevKey(true);
    try {
      await saveApiKey(devApiKeyInput.trim());
      setDevApiKeyInput("");
    } finally {
      setIsSavingDevKey(false);
    }
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

      {settings.debugMode ? (
        <div className="status-card" style={{ marginTop: 16, border: "2px dashed var(--color-primary)" }}>
          <p className="status-card__label">{t("aiSettings.devApiKeySectionTitle")}</p>
          <p className="status-card__value" style={{ fontSize: 14, fontWeight: 400, marginBottom: 8 }}>
            {apiKeyMasked ?? t("aiSettings.devApiKeyNone")}
          </p>
          <input
            type="password"
            aria-label={t("aiSettings.devApiKeyInputLabel")}
            value={devApiKeyInput}
            onChange={(e) => setDevApiKeyInput(e.target.value)}
            disabled={isSavingDevKey}
            placeholder={t("aiSettings.devApiKeyInputPlaceholder")}
          />
          <button
            type="button"
            className="lock-screen__button"
            onClick={handleSaveDevApiKey}
            disabled={isSavingDevKey || !devApiKeyInput.trim()}
            style={{ marginTop: 8 }}
          >
            {t("aiSettings.devApiKeyChangeButton")}
          </button>
        </div>
      ) : null}
    </main>
  );
}
