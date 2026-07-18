/**
 * DashboardScreen
 * ==================
 * bkz. Sprint 8.4/8.5, roadmap Bölüm 2.7. Uygulamayı açınca (kilit
 * sonrası) görülecek özet ekran DEĞİL — kullanıcı kararı (2026-07-18):
 * "Dashboard'ı ana ekran yapma, en azından şimdi değil, riskli bir
 * navigasyon değişikliği." Bunun yerine, Parseller (mevcut ana ekran)
 * ekranından bir BUTON ile erişilen bir alt ekran (Sprint 8.5).
 *
 * KAPSAM (roadmap'in kendi tanımıyla sınırlı — vizyon belgesindeki
 * "mini grafikler"/"ilerleme çubukları"/"hava durumu" gibi ÖGELER
 * BİLEREK YOK, çünkü ilgili modüller (Hava Durumu, Raporlar) henüz
 * geliştirilmedi — UYDURULMADI): toplam parsel/ağaç sayısı, geciken/
 * yaklaşan bakım sayısı, son 5 gözlem (tüm parseller genelinde),
 * toplam hasat (kg).
 *
 * `onBack` — AI Sohbet/AI Ayarları ile AYNI desen (basit, tek-görünümlü
 * ekran, iç view-state/CRUD yok) — GÖRÜNÜR bir "Geri" butonu.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import { useDashboardSummary } from "./hooks/useDashboardSummary";
import { formatDate } from "../../i18n/formatters";

interface DashboardScreenProps {
  onBack: () => void;
}

export function DashboardScreen({ onBack }: DashboardScreenProps) {
  const { t, i18n } = useTranslation();
  const { summary, status, errorCode } = useDashboardSummary();

  if (status === "idle" || status === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }

  if (status === "error" || !summary) {
    return (
      <main className="status-screen">
        <div className="status-card status-card--error">
          <p className="status-card__value">
            {t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("dashboard.screenTitle")}</h1>

      <div className="status-card">
        <p className="status-card__label">{t("dashboard.totalParcels")}</p>
        <p className="status-card__value">{summary.totalParcels}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">{t("dashboard.totalTrees")}</p>
        <p className="status-card__value">{summary.totalTrees}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">{t("dashboard.overdueMaintenance")}</p>
        <p className="status-card__value">{summary.overdueMaintenanceCount}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">{t("dashboard.upcomingMaintenance")}</p>
        <p className="status-card__value">{summary.upcomingMaintenanceCount}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">{t("dashboard.totalHarvest")}</p>
        <p className="status-card__value">{t("harvest.quantityValue", { value: summary.totalHarvestKg })}</p>
      </div>

      <section>
        <h2 className="status-card__label">{t("dashboard.recentObservationsTitle")}</h2>
        {summary.recentObservations.length === 0 ? (
          <p className="status-card__value">{t("dashboard.noRecentObservations")}</p>
        ) : (
          <ul className="parcel-list">
            {summary.recentObservations.map((observation) => (
              <li key={observation.id} className="parcel-list__item">
                <span className="parcel-list__name">{t(`observation.type.${observation.observationType}`)}</span>
                <span className="parcel-list__meta">{formatDate(observation.observedAt, i18n.language)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
