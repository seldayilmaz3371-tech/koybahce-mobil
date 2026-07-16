/**
 * FinanceScreen
 * ===============
 * bkz. Modül 4 Mimari Onayı, Sprint 4.2.
 *
 * ERROR CODE STANDARD — UI'DA İLK GERÇEK TÜKETİM: Önceki tüm ekranlar
 * (Parsel/Ağaç/Gözlem/Fotoğraf), hook'un ham `errorMessage`'ını
 * doğrudan gösteriyordu (bilinen teknik borç — Known Issues #2).
 * Modül 4 Mimari Onayı gereği, bu ekran artık `errorCode`'u
 * `errors.<KOD>` çeviri anahtarına eşleyip ÇEVRİLMİŞ bir mesaj
 * gösteriyor — ham SQL/teknik metin ASLA kullanıcıya gösterilmiyor.
 * Eşlenmemiş bir kod için `errors.SYS_001` (genel, çevrilmiş) mesajına
 * düşülüyor (i18next `defaultValue` ile).
 *
 * NAVİGASYON: Bu ekran henüz hiçbir rotaya bağlı DEĞİL (Sprint 4.2
 * kapsamı — Kural 28, aşamalı geçiş). `onBack` prop'u zaten burada,
 * gelecekteki bağlama hazır (Ağaç/Gözlem ekranlarındaki AYNI desen).
 *
 * GELECEĞE HAZIRLIK: `scope` (Parsel/Ağaç dual-mode) zaten hook
 * seviyesinde var — bir ağacın finans geçmişini göstermek istendiğinde
 * bu ekran DEĞİŞMEDEN, sadece `scope={{mode:"tree",...}}` ile
 * kullanılabilir.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFinanceRecords, type UseFinanceRecordsScope } from "./hooks/useFinanceRecords";
import { FinanceRecordList } from "./components/FinanceRecordList";
import { FinanceRecordForm } from "./FinanceRecordForm";
import { addBackButtonListener } from "../../native/appBackButton";
import type { FinanceRecord, NewFinanceRecordInput } from "./domain/finance.types";

type FinanceView =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; record: FinanceRecord };

interface FinanceScreenProps {
  scope: UseFinanceRecordsScope;
  /** `scope.mode === "tree"` ise zorunlu (formun `parcelId`'ye ihtiyacı var); `scope.mode === "parcel"` ise `scope.parcelId` ile aynı olmalı. */
  parcelId: string;
  onBack: () => void;
}

export function FinanceScreen({ scope, parcelId, onBack }: FinanceScreenProps) {
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
  } = useFinanceRecords(scope);
  const [view, setView] = useState<FinanceView>({ mode: "list" });

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        setView({ mode: "list" });
      } else {
        onBack();
      }
    });
  }, [view, onBack]);

  const handleSelect = (record: FinanceRecord) => {
    setView({ mode: "edit", record });
  };

  const handleSubmit = async (input: NewFinanceRecordInput) => {
    if (view.mode === "edit") {
      await updateRecord(view.record.id, {
        recordType: input.recordType,
        amount: input.amount,
        recordDate: input.recordDate,
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
      <FinanceRecordForm
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
      <h1 className="status-screen__title">{t("finance.screenTitle")}</h1>

      <button type="button" className="lock-screen__button" onClick={() => setView({ mode: "create" })}>
        {t("finance.addButton")}
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
        <p className="status-card__value">{t("finance.emptyState")}</p>
      ) : null}

      {records.length > 0 ? (
        <>
          <FinanceRecordList records={records} onSelect={handleSelect} />
          {status === "loading" ? <p className="status-card__value">{t("common.loading")}</p> : null}
          {hasMore && status !== "loading" ? (
            <button type="button" className="lock-screen__button" onClick={loadMore}>
              {t("finance.loadMoreButton")}
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
