/**
 * HarvestRecordForm
 * ====================
 * bkz. Sprint 8.2. `MaintenanceRecordForm` ile BİREBİR AYNI desen
 * (Kural 12) — yeni bir UI dili/mimari YOK.
 *
 * TASARIM KARARLARI:
 *   - `parcelId`/`treeId` FORM ALANI DEĞİL — Bakım/Finans'taki gibi
 *     navigasyon bağlamından prop olarak geliyor.
 *   - `quantityKg` ZORUNLU ve POZİTİF olmalı (0 veya negatif bir hasat
 *     miktarı GERÇEK bir iş kuralı ihlalidir) — `NumberField` (mevcut
 *     paylaşılan bileşen, Finance/ParcelForm'un KULLANMADIĞI ama proje
 *     içinde HAZIR bekleyen bir bileşen) kullanıldı.
 *   - `harvestDate` ZORUNLU — DB şemasında `NOT NULL` (Bakım'ın
 *     `scheduledDate`/`completedDate`'inin aksine, Hasat'ta "ne zaman
 *     olduğu belirsiz" bir kayıt anlamsızdır).
 *   - React Hook Form/Zod KULLANILMADI — mevcut 6 modülün hiçbiri
 *     kullanmıyor (Sprint 5.2'nin kod öncesi bulgusu hâlâ geçerli).
 *
 * ÇİFT-KAYIT KORUMASI: `useRef` (Finance/Bakım ile AYNI desen).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { DateField } from "../../shared/components/form/DateField";
import { NumberField } from "../../shared/components/form/NumberField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { FormError } from "../../shared/components/form/FormError";
import { dateInputValueToIso, isoToDateInputValue } from "../../shared/utils/dateInputConversion";
import type { HarvestRecord, NewHarvestRecordInput } from "./domain/harvest.types";

interface HarvestRecordFormProps {
  parcelId: string;
  treeId?: string | null;
  initialValue?: HarvestRecord;
  onSubmit: (input: NewHarvestRecordInput) => Promise<void>;
  onCancel: () => void;
  /** Sadece düzenleme modunda sağlanır. */
  onDelete?: () => Promise<void>;
}

export function HarvestRecordForm({
  parcelId,
  treeId,
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
}: HarvestRecordFormProps) {
  const { t } = useTranslation();

  const [harvestDateInput, setHarvestDateInput] = useState(
    initialValue?.harvestDate ? isoToDateInputValue(initialValue.harvestDate) : ""
  );
  const [quantityInput, setQuantityInput] = useState(
    initialValue ? String(initialValue.quantityKg) : ""
  );
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // bkz. MaintenanceRecordForm.tsx/FinanceRecordForm.tsx — aynı
  // gerçek bulgu (Sprint 3.7, backlog #15), aynı düzeltme.
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    setValidationError(null);

    if (!harvestDateInput) {
      setValidationError(t("harvest.dateRequired"));
      return;
    }

    const parsedQuantity = Number(quantityInput);
    if (!quantityInput.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setValidationError(t("harvest.quantityInvalid"));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        treeId: treeId ?? null,
        harvestDate: dateInputValueToIso(harvestDateInput),
        quantityKg: parsedQuantity,
        notes: notes.trim() || null,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isSubmittingRef.current) return;
    const confirmed = window.confirm(t("harvest.deleteConfirm"));
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
        {initialValue ? t("harvest.formTitleEdit") : t("harvest.formTitleCreate")}
      </h1>

      <FormError message={validationError} />

      <DateField
        id="harvest-date"
        label={t("harvest.date")}
        value={harvestDateInput}
        onChange={setHarvestDateInput}
        required
      />

      <NumberField
        id="harvest-quantity"
        label={t("harvest.quantityKg")}
        value={quantityInput}
        onChange={setQuantityInput}
        required
        step="0.1"
      />

      <TextAreaField id="harvest-notes" label={t("common.notes")} value={notes} onChange={setNotes} />

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
          {t("harvest.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
