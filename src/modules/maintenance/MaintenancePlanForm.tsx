/**
 * MaintenancePlanForm
 * ======================
 * bkz. Sprint 5.4. `MaintenanceRecordForm` ile AYNI genel desen (Kural
 * 12), ama Kayıt'tan FARKLI olarak GERÇEK doğrulama içeriyor:
 * `intervalDays` ve `nextDueDate`, bir PLAN'ın var oluş amacı olduğu
 * için (Kayıt'ın aksine) HER İKİSİ DE ZORUNLU.
 *
 * `maintenanceType` seçenekleri, `maintenance.type.*` çevirisini
 * TEKRAR KULLANIYOR (DRY) — Kayıt ve Plan AYNI tür kümesini paylaşıyor.
 *
 * `parcelId`/`treeId` FORM ALANI DEĞİL — Sprint 5.2'deki AYNI karar
 * (navigasyon bağlamından prop olarak gelir).
 *
 * ÇİFT-KAYIT KORUMASI: `useRef` (Sprint 3.7/Finance/Maintenance
 * Record'daki AYNI desen).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { SelectField } from "../../shared/components/form/SelectField";
import { NumberField } from "../../shared/components/form/NumberField";
import { DateField } from "../../shared/components/form/DateField";
import { FormError } from "../../shared/components/form/FormError";
import {
  dateInputValueToIso,
  isoToDateInputValue,
  todayAsDateInputValue,
} from "../../shared/utils/dateInputConversion";
import {
  MaintenanceType,
  type MaintenancePlan,
  type MaintenanceTypeValue,
  type NewMaintenancePlanInput,
} from "./domain/maintenance.types";

const MAINTENANCE_TYPES: MaintenanceTypeValue[] = Object.values(MaintenanceType);

interface MaintenancePlanFormProps {
  parcelId: string;
  treeId?: string | null;
  initialValue?: MaintenancePlan;
  onSubmit: (input: NewMaintenancePlanInput) => Promise<void>;
  onCancel: () => void;
  /** Sadece düzenleme modunda sağlanır. */
  onDelete?: () => Promise<void>;
}

export function MaintenancePlanForm({
  parcelId,
  treeId,
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
}: MaintenancePlanFormProps) {
  const { t } = useTranslation();

  const [maintenanceType, setMaintenanceType] = useState<MaintenanceTypeValue>(
    initialValue?.maintenanceType ?? MaintenanceType.Irrigation
  );
  const [intervalDaysInput, setIntervalDaysInput] = useState(
    initialValue ? String(initialValue.intervalDays) : ""
  );
  const [nextDueDateInput, setNextDueDateInput] = useState(
    initialValue ? isoToDateInputValue(initialValue.nextDueDate) : todayAsDateInputValue()
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // bkz. FinanceRecordForm.tsx/MaintenanceRecordForm.tsx — aynı gerçek
  // bulgu (Sprint 3.7, backlog #15), aynı düzeltme.
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    setValidationError(null);

    const parsedIntervalDays = Number(intervalDaysInput);
    if (!Number.isInteger(parsedIntervalDays) || parsedIntervalDays <= 0) {
      setValidationError(t("maintenancePlan.intervalDaysInvalid"));
      return;
    }
    if (!nextDueDateInput) {
      setValidationError(t("maintenancePlan.nextDueDateInvalid"));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        treeId: treeId ?? null,
        maintenanceType,
        intervalDays: parsedIntervalDays,
        nextDueDate: dateInputValueToIso(nextDueDateInput),
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isSubmittingRef.current) return;
    const confirmed = window.confirm(t("maintenancePlan.deleteConfirm"));
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
        {initialValue ? t("maintenancePlan.formTitleEdit") : t("maintenancePlan.formTitleCreate")}
      </h1>

      <FormError message={validationError} />

      <SelectField
        id="maintenance-plan-type"
        label={t("maintenance.type.label")}
        value={maintenanceType}
        onChange={(value) => setMaintenanceType(value as MaintenanceTypeValue)}
        options={MAINTENANCE_TYPES.map((type) => ({ value: type, label: t(`maintenance.type.${type}`) }))}
      />

      <NumberField
        id="maintenance-plan-interval-days"
        label={t("maintenancePlan.intervalDays")}
        value={intervalDaysInput}
        onChange={setIntervalDaysInput}
        step="1"
        required
      />

      <DateField
        id="maintenance-plan-next-due-date"
        label={t("maintenancePlan.nextDueDate")}
        value={nextDueDateInput}
        onChange={setNextDueDateInput}
        required
      />

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
          {t("maintenancePlan.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
