/**
 * MaintenancePlanScreen
 * ========================
 * bkz. Sprint 5.4. `MaintenanceScreen` ile BİREBİR AYNI desen (Kural
 * 12) — yeni bir UI dili/mimari YOK. Error Code Standard baştan
 * uygulandı.
 *
 * NAVİGASYON: Bu ekran henüz hiçbir rotaya bağlı DEĞİL (Sprint 5.4
 * kapsamı dışında — Blueprint'in kendisi "yalnızca veri modeli ve
 * kullanıcı yönetim ekranını kapsar" diyor, navigasyon ayrı bir
 * sonraki sprint — Sprint 5.2'nin Kayıt Ekranı ile AYNI aşamalı
 * yaklaşım).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMaintenancePlans, type UseMaintenancePlansScope } from "./hooks/useMaintenancePlans";
import { MaintenancePlanList } from "./components/MaintenancePlanList";
import { MaintenancePlanForm } from "./MaintenancePlanForm";
import { addBackButtonListener } from "../../native/appBackButton";
import type { MaintenancePlan, NewMaintenancePlanInput } from "./domain/maintenance.types";

type MaintenancePlanView =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; plan: MaintenancePlan };

interface MaintenancePlanScreenProps {
  scope: UseMaintenancePlansScope;
  /** `scope.mode === "tree"` ise zorunlu (formun `parcelId`'ye ihtiyacı var); `scope.mode === "parcel"` ise `scope.parcelId` ile aynı olmalı. */
  parcelId: string;
  onBack: () => void;
}

export function MaintenancePlanScreen({ scope, parcelId, onBack }: MaintenancePlanScreenProps) {
  const { t } = useTranslation();
  const {
    plans,
    status,
    errorCode,
    hasMore,
    loadMore,
    createPlan,
    updatePlan,
    deactivatePlan,
  } = useMaintenancePlans(scope);
  const [view, setView] = useState<MaintenancePlanView>({ mode: "list" });

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        setView({ mode: "list" });
      } else {
        onBack();
      }
    });
  }, [view, onBack]);

  const handleSelect = (plan: MaintenancePlan) => {
    setView({ mode: "edit", plan });
  };

  const handleSubmit = async (input: NewMaintenancePlanInput) => {
    if (view.mode === "edit") {
      await updatePlan(view.plan.id, {
        maintenanceType: input.maintenanceType,
        intervalDays: input.intervalDays,
        nextDueDate: input.nextDueDate,
      });
    } else {
      await createPlan(input);
    }
    setView({ mode: "list" });
  };

  const handleDelete = async () => {
    if (view.mode !== "edit") return;
    await deactivatePlan(view.plan.id);
    setView({ mode: "list" });
  };

  if (view.mode === "create" || view.mode === "edit") {
    const treeId = scope.mode === "tree" ? scope.treeId : null;
    return (
      <MaintenancePlanForm
        parcelId={parcelId}
        treeId={view.mode === "edit" ? view.plan.treeId : treeId}
        initialValue={view.mode === "edit" ? view.plan : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setView({ mode: "list" })}
        onDelete={view.mode === "edit" ? handleDelete : undefined}
      />
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("maintenancePlan.screenTitle")}</h1>

      <button type="button" className="lock-screen__button" onClick={() => setView({ mode: "create" })}>
        {t("maintenancePlan.addButton")}
      </button>

      {status === "idle" || (status === "loading" && plans.length === 0) ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">
            {t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        </div>
      ) : null}

      {status === "ready" && plans.length === 0 ? (
        <p className="status-card__value">{t("maintenancePlan.emptyState")}</p>
      ) : null}

      {plans.length > 0 ? (
        <>
          <MaintenancePlanList plans={plans} onSelect={handleSelect} />
          {status === "loading" ? <p className="status-card__value">{t("common.loading")}</p> : null}
          {hasMore && status !== "loading" ? (
            <button type="button" className="lock-screen__button" onClick={loadMore}>
              {t("maintenancePlan.loadMoreButton")}
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
