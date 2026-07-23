/**
 * BulkMaintenanceForm
 * ======================
<<<<<<< HEAD
 * bkz. Sprint 10.2/10.3/10.4. "Toplu Sulama"/"Toplu Gübreleme"/"Toplu
=======
 * bkz. Sprint 10.2/10.3. "Toplu Sulama"/"Toplu Gübreleme"/"Toplu
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
 * İlaçlama"/"Toplu Budama"/"Toplu Biçme" — MİMARİ OLARAK TEK form
 * (bkz. `docs/saha-operasyonlari-mimari-analiz.md` Kritik Bulgu 2).
 *
 * 🔴 "BİÇME" KARARI: `MaintenanceType` enum'unda "biçme" (mowing)
 * değeri YOK. Karar: "Biçme" kullanıcıya seçenek olarak GÖSTERİLİYOR,
<<<<<<< HEAD
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
=======
 * arka planda `maintenanceType: "other"` KAYDEDİLİYOR (bkz. Sprint
 * 10.2 Teknik Raporu).
 *
 * Sprint 10.3 EKLENTİLERİ:
 *   - `initialSelectedTreeIds` — Ardışık İşlem Sihirbazı'ndan
 *     (BulkOperationsScreen) gelindiyse, ağaç seçimi ÖNCEDEN
 *     doldurulur (kullanıcı AYNI seçimi TEKRAR yapmak ZORUNDA kalmaz).
 *   - Başarılı işlem sonrası "son kullanılan işlem türü"
 *     `localPreferences`'e kaydedilir (SQLite migration GEREKMEDEN —
 *     hassas olmayan, basit bir UX tercihi).
 *   - Sonuç ekranında "Aynı Ağaçlara Başka İşlem Uygula" butonu —
 *     Ardışık İşlem Sihirbazı'nı BAŞLATIR.
 *   - Undo YENİDEN DEĞERLENDİRİLDİ: kaç kaydın geri alınacağı AÇIKÇA
 *     gösteriliyor + YANLIŞLIKLA geri almayı önlemek için AYRI bir
 *     onay adımı eklendi (mevcut `window.confirm` deseniyle tutarlı).
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TreeSelectorList, type TreeSelectionMode } from "./components/TreeSelectorList";
import { useTreeSelection } from "./hooks/useTreeSelection";
import { SelectField } from "../../shared/components/form/SelectField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
<<<<<<< HEAD
import { DateField } from "../../shared/components/form/DateField";
import { TimeField } from "../../shared/components/form/TimeField";
import {
  combineDateAndTimeToIso,
  nowAsDateInputValue,
  nowAsTimeInputValue,
} from "../../shared/utils/dateInputConversion";
import { calculateDuration } from "../../shared/utils/durationCalculation";
=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
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
<<<<<<< HEAD
  /** bkz. Sprint 10.4 Düzeltme Paketi. `BulkOperationsScreen`'in menüsünden HANGİ bakım türüne tıklandığını iletir — VERİLMEZSE `Irrigation` varsayılanı korunur (mevcut davranış). */
  initialMaintenanceType?: MaintenanceTypeValue;
=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
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
<<<<<<< HEAD
  initialMaintenanceType,
}: BulkMaintenanceFormProps) {
  const { t } = useTranslation();
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceTypeValue>(
    initialMaintenanceType ?? MaintenanceType.Irrigation
  );
  const [notes, setNotes] = useState("");
  // Sprint 10.4, Madde 1 — varsayılan "şimdi" (yerel saat), kullanıcı değiştirebilir.
  const [dateValue, setDateValue] = useState(nowAsDateInputValue);
  const [timeValue, setTimeValue] = useState(nowAsTimeInputValue);
  // Sprint 10.4, Madde 2 — SADECE Sulama'da kullanılır.
  const [irrigationStartTime, setIrrigationStartTime] = useState("");
  const [irrigationEndTime, setIrrigationEndTime] = useState("");
=======
}: BulkMaintenanceFormProps) {
  const { t } = useTranslation();
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceTypeValue>(MaintenanceType.Irrigation);
  const [notes, setNotes] = useState("");
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
  const [selectionMode, setSelectionMode] = useState<TreeSelectionMode>(
    initialSelectedTreeIds && initialSelectedTreeIds.length > 0 ? "select" : "all"
  );
  const selection = useTreeSelection(initialSelectedTreeIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

<<<<<<< HEAD
  const targetTreeIds = selectionMode === "all" ? trees.map((tree) => tree.id) : Array.from(selection.selectedIds);
  const isIrrigation = maintenanceType === MaintenanceType.Irrigation;
  const duration =
    isIrrigation && irrigationStartTime && irrigationEndTime
      ? calculateDuration(irrigationStartTime, irrigationEndTime)
      : null;
=======
  // Sadece İLK render'da ("mount") çalışmalı — initialSelectedTreeIds
  // sonradan değişse bile TEKRAR tetiklenmemeli (kullanıcının manuel
  // seçimini EZMEMEK için). Bu, `useTreeSelection(initialSelectedTreeIds)`
  // çağrısına (yukarıda) verilen lazy initializer ile SAĞLANIYOR —
  // `useEffect` GEREKMİYOR (bkz. `useTreeSelection.ts`'in kendi notu).

  const targetTreeIds = selectionMode === "all" ? trees.map((tree) => tree.id) : Array.from(selection.selectedIds);
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3

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
<<<<<<< HEAD
        completedDate: combineDateAndTimeToIso(dateValue, timeValue),
        startTime: isIrrigation && irrigationStartTime ? irrigationStartTime : null,
        endTime: isIrrigation && irrigationEndTime ? irrigationEndTime : null,
        notes: notes.trim() || null,
      });
      setResult({ createdIds: created.map((r) => r.id), count: created.length });
=======
        completedDate: new Date().toISOString().slice(0, 10),
        notes: notes.trim() || null,
      });
      setResult({ createdIds: created.map((r) => r.id), count: created.length });
      // Sprint 10.3 — son kullanılan işlem türünü kaydet (hata olsa
      // bile ana akışı ETKİLEMEMELİ, bu yüzden ayrı bir try/catch).
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
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
<<<<<<< HEAD
=======
    // Sprint 10.3 — Madde 8: YANLIŞLIKLA geri almayı önlemek için AYRI
    // bir onay adımı, KAÇ kaydın etkileneceği AÇIKÇA belirtilerek.
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
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

<<<<<<< HEAD
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

=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
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
