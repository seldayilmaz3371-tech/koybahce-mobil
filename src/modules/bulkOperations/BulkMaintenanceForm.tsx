/**
 * BulkMaintenanceForm
 * ======================
 * bkz. Sprint 10.2/10.3/10.4. "Toplu Sulama"/"Toplu Gübreleme"/"Toplu
 * İlaçlama"/"Toplu Budama"/"Toplu Biçme" — MİMARİ OLARAK TEK form
 * (bkz. `docs/saha-operasyonlari-mimari-analiz.md` Kritik Bulgu 2).
 *
 * 🔴 "BİÇME" KARARI: `MaintenanceType` enum'unda "biçme" (mowing)
 * değeri YOK. Karar: "Biçme" kullanıcıya seçenek olarak GÖSTERİLİYOR,
 * arka planda `maintenanceType: "other"` KAYDEDİLİYOR.
 *
 * Sprint 10.4 EKLENTİLERİ:
 *   - Madde 1 (geriye dönük tarih/saat): `completedDate` artık
 *     VARSAYILAN "şimdi" (yerel saat) ile doldurulur, kullanıcı
 *     DEĞİŞTİREBİLİR — TÜM bakım türlerinde (Sulama/Gübreleme/
 *     İlaçlama/Budama/Biçme) ÇALIŞIR. Migration GEREKMEDİ.
 *   - Madde 2 (Sulama Başlangıç/Bitiş Saati): SADECE
 *     `maintenanceType === irrigation` iken GÖSTERİLİR. Toplam süre
 *     CANLI hesaplanır (`calculateDuration`), VERİTABANINA
 *     KAYDEDİLMEZ (türetilebilir değer — bkz. şema Sürüm 12 yorumu).
 *     Migration GEREKTİ — `start_time`/`end_time` (nullable, additive).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TreeSelectorList, type TreeSelectionMode } from "./components/TreeSelectorList";
import { useTreeSelection } from "./hooks/useTreeSelection";
import { SelectField } from "../../shared/components/form/SelectField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { DateField } from "../../shared/components/form/DateField";
import { TimeField } from "../../shared/components/form/TimeField";
import {
  combineDateAndTimeToIso,
  nowAsDateInputValue,
  nowAsTimeInputValue,
} from "../../shared/utils/dateInputConversion";
import { calculateDuration } from "../../shared/utils/durationCalculation";
import { maintenanceRepository } from "../maintenance/data/maintenance.repository";
import { MaintenanceType, MaintenanceStatus, type MaintenanceTypeValue } from "../maintenance/domain/maintenance.types";
import { localPreferences, LocalPreferenceKey } from "../../native/preferences";
import type { Tree } from "../trees/domain/tree.types";

interface BulkMaintenanceFormProps {
  parcelId: string;
  trees: Tree[];
  onBack: () => void;
  initialSelectedTreeIds?: string[];
  onApplyAnotherOperation?: (treeIds: string[]) => void;
}

type ResultState = { createdIds: string[]; count: number } | null;

const MAINTENANCE_TYPE_OPTIONS: { value: MaintenanceTypeValue; labelKey: string }[] = [
  { value: MaintenanceType.Irrigation, labelKey: "maintenance.type.irrigation" },
  { value: MaintenanceType.Fertilization, labelKey: "maintenance.type.fertilization" },
  { value: MaintenanceType.Pesticide, labelKey: "maintenance.type.pesticide" },
  { value: MaintenanceType.Pruning, labelKey: "maintenance.type.pruning" },
  // "Biçme" -> arka planda "other" (bkz. dosya başlığındaki karar notu).
  { value: MaintenanceType.Other, labelKey: "bulkOperations.mowingLabel" },
];

export function BulkMaintenanceForm({
  parcelId,
  trees,
  onBack,
  initialSelectedTreeIds,
  onApplyAnotherOperation,
}: BulkMaintenanceFormProps) {
  const { t } = useTranslation();
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceTypeValue>(MaintenanceType.Irrigation);
  const [notes, setNotes] = useState("");
  // Sprint 10.4, Madde 1 — varsayılan "şimdi" (yerel saat), kullanıcı değiştirebilir.
  const [dateValue, setDateValue] = useState(nowAsDateInputValue);
  const [timeValue, setTimeValue] = useState(nowAsTimeInputValue);
  // Sprint 10.4, Madde 2 — SADECE Sulama'da kullanılır.
  const [irrigationStartTime, setIrrigationStartTime] = useState("");
  const [irrigationEndTime, setIrrigationEndTime] = useState("");
  const [selectionMode, setSelectionMode] = useState<TreeSelectionMode>(
    initialSelectedTreeIds && initialSelectedTreeIds.length > 0 ? "select" : "all"
  );
  const selection = useTreeSelection(initialSelectedTreeIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetTreeIds = selectionMode === "all" ? trees.map((tree) => tree.id) : Array.from(selection.selectedIds);
  const isIrrigation = maintenanceType === MaintenanceType.Irrigation;
  const duration =
    isIrrigation && irrigationStartTime && irrigationEndTime
      ? calculateDuration(irrigationStartTime, irrigationEndTime)
      : null;

  const handleApply = async () => {
    if (targetTreeIds.length === 0) {
      setErrorMessage(t("bulkOperations.noTreesSelectedError"));
      return;
    }

    const typeLabel = t(MAINTENANCE_TYPE_OPTIONS.find((o) => o.value === maintenanceType)?.labelKey ?? "");
    const confirmed = window.confirm(
      t("bulkOperations.confirmMessage", { count: targetTreeIds.length, operation: typeLabel })
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await maintenanceRepository.createMany({
        parcelId,
        treeIds: targetTreeIds,
        maintenanceType,
        status: MaintenanceStatus.Completed,
        completedDate: combineDateAndTimeToIso(dateValue, timeValue),
        startTime: isIrrigation && irrigationStartTime ? irrigationStartTime : null,
        endTime: isIrrigation && irrigationEndTime ? irrigationEndTime : null,
        notes: notes.trim() || null,
      });
      setResult({ createdIds: created.map((r) => r.id), count: created.length });
      try {
        await localPreferences.set(LocalPreferenceKey.LAST_USED_BULK_OPERATION, maintenanceType);
      } catch {
        // Sessizce yut — bu SADECE bir UX hızlandırma tercihi, kritik değil.
      }
    } catch {
      setErrorMessage(t("bulkOperations.applyError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!result) return;
    const confirmed = window.confirm(t("bulkOperations.undoConfirmMessage", { count: result.count }));
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await maintenanceRepository.deactivateMany(result.createdIds);
      setResult(null);
      selection.clear();
    } catch {
      setErrorMessage(t("bulkOperations.undoError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <main className="status-screen">
        <h1 className="status-screen__title">{t("bulkOperations.resultTitle")}</h1>
        <div className="status-card">
          <p className="status-card__value">{t("bulkOperations.resultSummary", { count: result.count })}</p>
        </div>

        {onApplyAnotherOperation ? (
          <button
            type="button"
            className="lock-screen__button"
            onClick={() => onApplyAnotherOperation(targetTreeIds)}
          >
            {t("bulkOperations.applyAnotherButton")}
          </button>
        ) : null}

        <button
          type="button"
          className="lock-screen__button"
          onClick={handleUndo}
          disabled={isSubmitting}
          style={{ marginTop: 8 }}
        >
          {t("bulkOperations.undoButton")}
        </button>
        <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
          {t("common.back")}
        </button>
      </main>
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("bulkOperations.maintenanceFormTitle")}</h1>

      {errorMessage ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{errorMessage}</p>
        </div>
      ) : null}

      <SelectField
        id="bulk-maintenance-type"
        label={t("maintenance.type.label")}
        value={maintenanceType}
        onChange={setMaintenanceType}
        options={MAINTENANCE_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
      />

      <DateField id="bulk-maintenance-date" label={t("bulkOperations.dateLabel")} value={dateValue} onChange={setDateValue} required />
      <TimeField id="bulk-maintenance-time" label={t("bulkOperations.timeLabel")} value={timeValue} onChange={setTimeValue} required />

      {isIrrigation ? (
        <div className="status-card" style={{ marginTop: 8 }}>
          <p className="status-card__label">{t("bulkOperations.irrigationDurationSectionTitle")}</p>
          <TimeField
            id="bulk-irrigation-start-time"
            label={t("bulkOperations.irrigationStartTimeLabel")}
            value={irrigationStartTime}
            onChange={setIrrigationStartTime}
          />
          <TimeField
            id="bulk-irrigation-end-time"
            label={t("bulkOperations.irrigationEndTimeLabel")}
            value={irrigationEndTime}
            onChange={setIrrigationEndTime}
          />
          {duration ? (
            <p className="status-card__value" style={{ fontSize: 15 }}>
              {t("bulkOperations.irrigationDurationResult", { hours: duration.hours, minutes: duration.minutes })}
            </p>
          ) : null}
        </div>
      ) : null}

      <TextAreaField id="bulk-maintenance-notes" label={t("common.notes")} value={notes} onChange={setNotes} />

      <TreeSelectorList trees={trees} mode={selectionMode} onModeChange={setSelectionMode} selection={selection} />

      <button
        type="button"
        className="lock-screen__button"
        onClick={handleApply}
        disabled={isSubmitting}
        style={{ marginTop: 12 }}
      >
        {t("bulkOperations.applyButton")}
      </button>
      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
