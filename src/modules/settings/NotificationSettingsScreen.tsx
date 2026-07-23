/**
 * NotificationSettingsScreen
 * ==============================
 * bkz. Sprint 10.19 (Ayarlar Hub Genişlemesi — Bildirimler). Kapsam
 * (kullanıcının kararı): SADECE bakım hatırlatmaları.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import { useNotificationSettings } from "./hooks/useNotificationSettings";

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const { t } = useTranslation();
  const { status, isEnabled, permissionDenied, setEnabled } = useNotificationSettings();

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("notificationSettings.screenTitle")}</h1>

      <div className="form-field--checkbox status-card">
        <label>
          <input
            type="checkbox"
            checked={isEnabled}
            disabled={status !== "ready"}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          {t("notificationSettings.toggleLabel")}
        </label>
        <p className="status-card__value" style={{ fontSize: 14, fontWeight: 400, marginTop: 8 }}>
          {t("notificationSettings.toggleDescription")}
        </p>
      </div>

      {permissionDenied ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{t("notificationSettings.permissionDeniedMessage")}</p>
        </div>
      ) : null}

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("notificationSettings.backButton")}
      </button>
    </main>
  );
}
