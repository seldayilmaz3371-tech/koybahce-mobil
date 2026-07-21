/**
 * MaintenanceRecordForm
 * ========================
 * bkz. Sprint 5.2. `FinanceRecordForm` ile BİREBİR AYNI desen (Kural
 * 12) — yeni bir UI dili/mimari YOK.
 *
 * TASARIM KARARLARI (Sprint 5.2 kapsamında, kod öncesi bulgu notuna
 * bkz.):
 *   - `parcelId`/`treeId` FORM ALANI DEĞİL — Finance'teki gibi
 *     navigasyon bağlamından prop olarak geliyor (in-form dropdown
 *     eklemek, mevcut Finance Form standardıyla ÇELİŞİRDİ).
 *   - `maintenanceType` varsayılan "irrigation" (Minimum Dokunuş —
 *     en yaygın saha işlemi).
 *   - `status` varsayılan "completed" (repository'nin kendi
 *     varsayılanıyla tutarlı — "bugün yaptığım işi kaydediyorum" en
 *     yaygın senaryo).
 *   - `scheduledDate`/`completedDate` HER İKİSİ DE isteğe bağlı,
 *     koşullu gösterim YOK (yeni bir UI deseni icat etmemek için
 *     bilinçli sadelik).
 *   - React Hook Form/Zod KULLANILMADI — kurulu değil, mevcut 5
 *     modülün hiçbiri kullanmıyor (kod öncesi bulgu notu).
 *
 * ÇİFT-KAYIT KORUMASI: `useRef` (Sprint 3.7/Finance'teki AYNI desen).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { SelectField } from "../../shared/components/form/SelectField";
import { DateField } from "../../shared/components/form/DateField";
import { TimeField } from "../../shared/components/form/TimeField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { FormError } from "../../shared/components/form/FormError";
import { dateInputValueToIso, isoToDateInputValue } from "../../shared/utils/dateInputConversion";
import {
  MaintenanceStatus,
  MaintenanceType,
  type MaintenanceRecord,
  type MaintenanceStatusValue,
  type MaintenanceTypeValue,
  type NewMaintenanceRecordInput,
} from "./domain/maintenance.types";

const MAINTENANCE_TYPES: MaintenanceTypeValue[] = Object.values(MaintenanceType);
const MAINTENANCE_STATUSES: MaintenanceStatusValue[] = Object.values(MaintenanceStatus);

interface MaintenanceRecordFormProps {
  parcelId: string;
  treeId?: string | null;
  initialValue?: MaintenanceRecord;
  onSubmit: (input: NewMaintenanceRecordInput) => Promise<void>;
  onCancel: () => void;
  /** Sadece düzenleme modunda sağlanır. */
  onDelete?: () => Promise<void>;
}

export function MaintenanceRecordForm({
  parcelId,
  treeId,
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
}: MaintenanceRecordFormProps) {
  const { t } = useTranslation();

  const [maintenanceType, setMaintenanceType] = useState<MaintenanceTypeValue>(
    initialValue?.maintenanceType ?? MaintenanceType.Irrigation
  );
  const [status, setStatus] = useState<MaintenanceStatusValue>(
    initialValue?.status ?? MaintenanceStatus.Completed
  );
  const [scheduledDateInput, setScheduledDateInput] = useState(
    initialValue?.scheduledDate ? isoToDateInputValue(initialValue.scheduledDate) : ""
  );
  const [completedDateInput, setCompletedDateInput] = useState(
    initialValue?.completedDate ? isoToDateInputValue(initialValue.completedDate) : ""
  );
  // bkz. Sprint 10.4 Düzeltme Paketi. `startTime`/`endTime` — SADECE
  // Sulama'da (`isIrrigation`) gösterilir. `BulkMaintenanceForm`'un
  // AYNI deseni (Kural: kod tekrarından kaçın) — "HH:MM" formatında
  // DOĞRUDAN string, `combineDateAndTimeToIso` GEREKMİYOR (bu form
  // için `startTime`/`endTime`, `completedDate`'ten TAMAMEN BAĞIMSIZ
  // ayrı sütunlar — bkz. Şema Sürüm 12).
  const [startTimeInput, setStartTimeInput] = useState(initialValue?.startTime ?? "");
  const [endTimeInput, setEndTimeInput] = useState(initialValue?.endTime ?? "");
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // bkz. FinanceRecordForm.tsx — aynı gerçek bulgu (Sprint 3.7,
  // backlog #15), aynı düzeltme, baştan uygulandı.
  const isSubmittingRef = useRef(false);

  const isIrrigation = maintenanceType === MaintenanceType.Irrigation;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    setValidationError(null);

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        treeId: treeId ?? null,
        maintenanceType,
        status,
        scheduledDate: scheduledDateInput ? dateInputValueToIso(scheduledDateInput) : null,
        completedDate: completedDateInput ? dateInputValueToIso(completedDateInput) : null,
        startTime: isIrrigation && startTimeInput ? startTimeInput : null,
        endTime: isIrrigation && endTimeInput ? endTimeInput : null,
        notes: notes.trim() || null,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isSubmittingRef.current) return;
    const confirmed = window.confirm(t("maintenance.deleteConfirm"));
    if (!confirmed) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form className="status-screen" onSubmit={handleSubmit} noValidate>
      <h1 className="status-screen__title">
        {initialValue ? t("maintenance.formTitleEdit") : t("maintenance.formTitleCreate")}
      </h1>

      <FormError message={validationError} />

      <SelectField
        id="maintenance-type"
        label={t("maintenance.type.label")}
        value={maintenanceType}
        onChange={(value) => setMaintenanceType(value as MaintenanceTypeValue)}
        options={MAINTENANCE_TYPES.map((type) => ({ value: type, label: t(`maintenance.type.${type}`) }))}
      />

      <SelectField
        id="maintenance-status"
        label={t("maintenance.status.label")}
        value={status}
        onChange={(value) => setStatus(value as MaintenanceStatusValue)}
        options={MAINTENANCE_STATUSES.map((s) => ({ value: s, label: t(`maintenance.status.${s}`) }))}
      />

      <DateField
        id="maintenance-scheduled-date"
        label={t("maintenance.scheduledDate")}
        value={scheduledDateInput}
        onChange={setScheduledDateInput}
      />

      <DateField
        id="maintenance-completed-date"
        label={t("maintenance.completedDate")}
        value={completedDateInput}
        onChange={setCompletedDateInput}
      />

      {isIrrigation ? (
        <>
          <TimeField
            id="maintenance-start-time"
            label={t("bulkOperations.irrigationStartTimeLabel")}
            value={startTimeInput}
            onChange={setStartTimeInput}
          />
          <TimeField
            id="maintenance-end-time"
            label={t("bulkOperations.irrigationEndTimeLabel")}
            value={endTimeInput}
            onChange={setEndTimeInput}
          />
        </>
      ) : null}

      <TextAreaField id="maintenance-notes" label={t("common.notes")} value={notes} onChange={setNotes} />

      <button type="submit" className="lock-screen__button" disabled={isSubmitting}>
        {t("common.save")}
      </button>
      <button
        type="button"
        className="lock-screen__button"
        style={{ marginTop: 8 }}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {t("common.cancel")}
      </button>

      {onDelete ? (
        <button
          type="button"
          className="lock-screen__button lock-screen__button--danger"
          style={{ marginTop: 8 }}
          onClick={handleDelete}
          disabled={isSubmitting}
        >
          {t("maintenance.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
