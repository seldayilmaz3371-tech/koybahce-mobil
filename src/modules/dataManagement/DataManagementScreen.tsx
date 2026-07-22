/**
 * DataManagementScreen
 * ========================
 * bkz. Sprint 10.13. Kullanıcının kararı: kapsam SADECE "Tam Yedek
 * Oluştur" + "Yedekten Geri Yükle" — diğer Veri Yönetimi özellikleri
 * sonraki sprintlere bırakıldı (YAGNI).
 *
 * ONAY AKIŞI (established pattern — `AiSettingsScreen`'deki
 * `window.confirm` ile AYNI ilke): `useRestore`'un `pickAndValidate()`'i
 * SADECE doğrular, geri YÜKLEMEZ — kullanıcı `window.confirm` ile
 * kesin talimattaki UYARI metnini (KELİMESİ KELİMESİNE) GÖRÜP
 * onayladıktan SONRA `confirmAndRestore()` çağrılır.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import { useBackup } from "./hooks/useBackup";
import { useRestore } from "./hooks/useRestore";

interface DataManagementScreenProps {
  onBack: () => void;
}

export function DataManagementScreen({ onBack }: DataManagementScreenProps) {
  const { t } = useTranslation();
  const backup = useBackup();
  const restore = useRestore();

  const handleRestoreClick = async () => {
    await restore.pickAndValidate();
  };

  // `pickAndValidate()` BAŞARIYLA `awaiting_confirmation`'a geçtiğinde
  // (render SONRASI), kullanıcıya KESİN talimattaki UYARI metnini
  // (kelimesi kelimesine) gösteren `window.confirm` açılır.
  const handleConfirmRestore = async () => {
    const confirmed = window.confirm(
      `${t("dataManagement.restoreConfirmTitle")}\n\n${t("dataManagement.restoreConfirmBody")}`
    );
    if (!confirmed) {
      restore.reset();
      return;
    }
    await restore.confirmAndRestore();
  };

  const isBackupBusy = backup.status === "creating";
  const isRestoreBusy =
    restore.status === "picking" || restore.status === "validating" || restore.status === "restoring";

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("dataManagement.screenTitle")}</h1>

      <div className="status-card">
        <button
          type="button"
          className="lock-screen__button"
          onClick={() => backup.createBackup()}
          disabled={isBackupBusy}
        >
          {isBackupBusy ? t("dataManagement.creatingBackup") : t("dataManagement.createBackupButton")}
        </button>

        {backup.status === "success" ? (
          <p className="status-card__value" style={{ fontSize: 15, fontWeight: 400, marginTop: 8 }}>
            {t("dataManagement.backupSuccessTitle")}
          </p>
        ) : null}

        {backup.status === "error" ? (
          <p
            className="status-card__value"
            style={{ fontSize: 15, fontWeight: 400, marginTop: 8, color: "var(--color-danger)" }}
          >
            {t(`errors.${backup.errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        ) : null}
      </div>

      <div className="status-card">
        <button type="button" className="lock-screen__button" onClick={handleRestoreClick} disabled={isRestoreBusy}>
          {isRestoreBusy ? t("dataManagement.validatingBackup") : t("dataManagement.restoreBackupButton")}
        </button>

        {restore.status === "awaiting_confirmation" ? (
          <button
            type="button"
            className="lock-screen__button"
            onClick={handleConfirmRestore}
            style={{ marginTop: 8 }}
          >
            {t("dataManagement.restoreConfirmButton")}
          </button>
        ) : null}

        {restore.status === "restoring" && restore.progress ? (
          <p className="status-card__value" style={{ fontSize: 15, fontWeight: 400, marginTop: 8 }}>
            {restore.progress.stage === "creating_safety_backup" ? t("dataManagement.creatingSafetyBackup") : null}
            {restore.progress.stage === "restoring_database" ? t("dataManagement.restoringDatabase") : null}
            {restore.progress.stage === "restoring_photos"
              ? t("dataManagement.restoringPhotos", {
                  done: restore.progress.photosRestored ?? 0,
                  total: restore.progress.photosTotal ?? 0,
                })
              : null}
          </p>
        ) : null}

        {restore.status === "success" ? (
          <div style={{ marginTop: 8 }}>
            <p className="status-card__value" style={{ fontSize: 15, fontWeight: 400 }}>
              {t("dataManagement.restoreSuccessTitle")}
            </p>
            {restore.restoreResult?.partialSuccess ? (
              <p
                className="status-card__value"
                style={{ fontSize: 14, fontWeight: 400, color: "var(--color-danger)" }}
              >
                {t(`errors.${restore.errorCode}`, { defaultValue: t("errors.SYS_001") })}
              </p>
            ) : null}
          </div>
        ) : null}

        {restore.status === "error" ? (
          <p
            className="status-card__value"
            style={{ fontSize: 15, fontWeight: 400, marginTop: 8, color: "var(--color-danger)" }}
          >
            {t(`errors.${restore.errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        ) : null}
      </div>

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
