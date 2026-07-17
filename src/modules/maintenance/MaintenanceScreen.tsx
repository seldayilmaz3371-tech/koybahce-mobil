/**
 * MaintenanceScreen
 * ===================
 * bkz. Sprint 5.2. `FinanceScreen` ile BİREBİR AYNI desen (Kural 12) —
 * yeni bir UI dili/mimari YOK. Error Code Standard (errors.<KOD>
 * çevirisi, ham hata ASLA gösterilmez) baştan uygulandı.
 *
 * NAVİGASYON: Bu ekran henüz hiçbir rotaya bağlı DEĞİL (Sprint 5.2
 * kapsamı dışında — "❌ Reference Tree entegrasyonu" yasağı da bunu
 * kapsıyor, navigasyon ayrı bir sonraki sprint).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMaintenanceRecords, type UseMaintenanceRecordsScope } from "./hooks/useMaintenanceRecords";
import { MaintenanceRecordList } from "./components/MaintenanceRecordList";
import { MaintenanceRecordForm } from "./MaintenanceRecordForm";
import { addBackButtonListener } from "../../native/appBackButton";
import type { MaintenanceRecord, NewMaintenanceRecordInput } from "./domain/maintenance.types";

type MaintenanceView =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; record: MaintenanceRecord };

interface MaintenanceScreenProps {
  scope: UseMaintenanceRecordsScope;
  /** `scope.mode === "tree"` ise zorunlu (formun `parcelId`'ye ihtiyacı var); `scope.mode === "parcel"` ise `scope.parcelId` ile aynı olmalı. */
  parcelId: string;
  onBack: () => void;
}

export function MaintenanceScreen({ scope, parcelId, onBack }: MaintenanceScreenProps) {
  const { t } = useTranslation();
  const {
    records,
    status,
    errorCode,
    hasMore,
    loadMore,
    createRecord,
    updateRecord,
    deactivateRecord,
  } = useMaintenanceRecords(scope);
  const [view, setView] = useState<MaintenanceView>({ mode: "list" });

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        setView({ mode: "list" });
      } else {
        onBack();
      }
    });
  }, [view, onBack]);

  const handleSelect = (record: MaintenanceRecord) => {
    setView({ mode: "edit", record });
  };

  const handleSubmit = async (input: NewMaintenanceRecordInput) => {
    if (view.mode === "edit") {
      await updateRecord(view.record.id, {
        maintenanceType: input.maintenanceType,
        status: input.status,
        scheduledDate: input.scheduledDate,
        completedDate: input.completedDate,
        notes: input.notes,
      });
    } else {
      await createRecord(input);
    }
    setView({ mode: "list" });
  };

  const handleDelete = async () => {
    if (view.mode !== "edit") return;
    await deactivateRecord(view.record.id);
    setView({ mode: "list" });
  };

  if (view.mode === "create" || view.mode === "edit") {
    const treeId = scope.mode === "tree" ? scope.treeId : null;
    return (
      <MaintenanceRecordForm
        parcelId={parcelId}
        treeId={view.mode === "edit" ? view.record.treeId : treeId}
        initialValue={view.mode === "edit" ? view.record : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setView({ mode: "list" })}
        onDelete={view.mode === "edit" ? handleDelete : undefined}
      />
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("maintenance.screenTitle")}</h1>

      <button type="button" className="lock-screen__button" onClick={() => setView({ mode: "create" })}>
        {t("maintenance.addButton")}
      </button>

      {status === "idle" || (status === "loading" && records.length === 0) ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">
            {t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        </div>
      ) : null}

      {status === "ready" && records.length === 0 ? (
        <p className="status-card__value">{t("maintenance.emptyState")}</p>
      ) : null}

      {records.length > 0 ? (
        <>
          <MaintenanceRecordList records={records} onSelect={handleSelect} />
          {status === "loading" ? <p className="status-card__value">{t("common.loading")}</p> : null}
          {hasMore && status !== "loading" ? (
            <button type="button" className="lock-screen__button" onClick={loadMore}>
              {t("maintenance.loadMoreButton")}
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
