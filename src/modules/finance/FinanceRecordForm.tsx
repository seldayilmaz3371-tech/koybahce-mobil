/**
 * FinanceRecordForm
 * ====================
 * bkz. Modül 4 Mimari Onayı, Sprint 4.2.
 *
 * ONAYLANAN UX KARARLARI:
 *   - `recordType` varsayılan olarak "cost" seçili (Minimum Dokunuş
 *     İlkesi — Observation'ın `observationType` varsayılanıyla
 *     tutarlı desen).
 *   - `recordDate` varsayılan BUGÜN, ama DÜZENLENEBİLİR (Observation'ın
 *     aksine — finans kayıtları genellikle geriye dönük girilir).
 *   - `currencyCode` formda HİÇ YOK — sessizce repository'de atanıyor.
 *   - `notes` isteğe bağlı (`common.notes` yeniden kullanıldı — Kural 12).
 *
 * ÇİFT-KAYIT KORUMASI: `useRef` (Sprint 3.7'de Photo modülünde
 * bulunan gerçek yarış durumu dersi — backlog #15 — burada BAŞTAN
 * uygulandı, `isSubmitting` state'i TEK BAŞINA yeterli değildi).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { SelectField } from "../../shared/components/form/SelectField";
import { NumberField } from "../../shared/components/form/NumberField";
import { DateField } from "../../shared/components/form/DateField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { FormError } from "../../shared/components/form/FormError";
import type { FinanceRecord, FinanceRecordType, NewFinanceRecordInput } from "./domain/finance.types";

const RECORD_TYPES: FinanceRecordType[] = ["cost", "sale"];

/** `YYYY-MM-DD` (DateField) ↔ ISO 8601 (domain) dönüşümleri — bkz. `DateField.tsx` notu. */
function isoToDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}
function dateInputValueToIso(dateInputValue: string): string {
  return `${dateInputValue}T00:00:00.000Z`;
}
function todayAsDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FinanceRecordFormProps {
  parcelId: string;
  treeId?: string | null;
  initialValue?: FinanceRecord;
  onSubmit: (input: NewFinanceRecordInput) => Promise<void>;
  onCancel: () => void;
  /** Sadece düzenleme modunda sağlanır. */
  onDelete?: () => Promise<void>;
}

export function FinanceRecordForm({
  parcelId,
  treeId,
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
}: FinanceRecordFormProps) {
  const { t } = useTranslation();

  const [recordType, setRecordType] = useState<FinanceRecordType>(initialValue?.recordType ?? "cost");
  const [amountInput, setAmountInput] = useState(
    initialValue ? String(initialValue.amount) : ""
  );
  const [recordDateInput, setRecordDateInput] = useState(
    initialValue ? isoToDateInputValue(initialValue.recordDate) : todayAsDateInputValue()
  );
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // GERÇEK BULGU (Sprint 3.7, backlog #15): `isSubmitting` state'i TEK
  // BAŞINA senkron çift-tıklamayı engellemiyor (React state güncellemesi
  // batch'li). `useRef`, senkron güncellendiği için gerçek koruma
  // sağlıyor — bu formda BAŞTAN uygulanıyor.
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    setValidationError(null);

    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError(t("finance.amountInvalid"));
      return;
    }
    if (!recordDateInput) {
      setValidationError(t("finance.recordDateInvalid"));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        treeId: treeId ?? null,
        recordType,
        amount: parsedAmount,
        recordDate: dateInputValueToIso(recordDateInput),
        notes: notes.trim() || null,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isSubmittingRef.current) return;
    const confirmed = window.confirm(t("finance.deleteConfirm"));
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
        {initialValue ? t("finance.formTitleEdit") : t("finance.formTitleCreate")}
      </h1>

      <FormError message={validationError} />

      <SelectField
        id="finance-type"
        label={t("finance.type.label")}
        value={recordType}
        onChange={(value) => setRecordType(value as FinanceRecordType)}
        options={RECORD_TYPES.map((type) => ({ value: type, label: t(`finance.type.${type}`) }))}
      />

      <NumberField
        id="finance-amount"
        label={t("finance.amount")}
        value={amountInput}
        onChange={setAmountInput}
        step="0.01"
        required
      />

      <DateField
        id="finance-record-date"
        label={t("finance.recordDate")}
        value={recordDateInput}
        onChange={setRecordDateInput}
        required
      />

      <TextAreaField id="finance-notes" label={t("common.notes")} value={notes} onChange={setNotes} />

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
          {t("finance.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
