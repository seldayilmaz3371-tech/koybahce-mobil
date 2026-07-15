/**
 * BulkTreeCreateForm
 * ====================
 * bkz. Sprint 3.10 UX Doğrulaması (onaylandı 2026-07-15).
 *
 * ONAYLANAN 4 KARAR:
 *   1. `variety` isteğe bağlı (Minimum Dokunuş İlkesi).
 *   2. Çakışan numaralar açıkça listelenir — ham SQLite hatası
 *      ASLA gösterilmez (`TreeNumberConflictError`'ı özel olarak
 *      yakalıyoruz).
 *   3. Oluşturma öncesi canlı önizleme ("151 → 400 · Toplam: 250 Ağaç").
 *   4. Başarı sonrası kısa özet (ayrı bir onay ekranı, `onSuccess` ile).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "../../shared/components/form/TextField";
import { NumberField } from "../../shared/components/form/NumberField";
import { CheckboxField } from "../../shared/components/form/CheckboxField";
import { FormError } from "../../shared/components/form/FormError";
import { TreeNumberConflictError, type BulkCreateTreesInput } from "./domain/tree.types";

interface BulkTreeCreateFormProps {
  parcelId: string;
  onSubmit: (input: BulkCreateTreesInput) => Promise<unknown>;
  onSuccess: (summary: { count: number; startNumber: number; endNumber: number }) => void;
  onCancel: () => void;
}

export function BulkTreeCreateForm({ parcelId, onSubmit, onSuccess, onCancel }: BulkTreeCreateFormProps) {
  const { t } = useTranslation();

  const [startNumberInput, setStartNumberInput] = useState("");
  const [countInput, setCountInput] = useState("");
  const [variety, setVariety] = useState("");
  const [isReferenceTree, setIsReferenceTree] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedStart = Number(startNumberInput);
  const parsedCount = Number(countInput);
  const hasValidPreview =
    startNumberInput.trim() !== "" &&
    countInput.trim() !== "" &&
    Number.isInteger(parsedStart) &&
    parsedStart > 0 &&
    Number.isInteger(parsedCount) &&
    parsedCount > 0;
  const previewEnd = hasValidPreview ? parsedStart + parsedCount - 1 : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (!Number.isInteger(parsedStart) || parsedStart <= 0) {
      setValidationError(t("tree.startNumberInvalid"));
      return;
    }
    if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
      setValidationError(t("tree.countInvalid"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        startNumber: parsedStart,
        count: parsedCount,
        variety: variety.trim() || undefined,
        isReferenceTree,
      });
      onSuccess({ count: parsedCount, startNumber: parsedStart, endNumber: parsedStart + parsedCount - 1 });
    } catch (error) {
      if (error instanceof TreeNumberConflictError) {
        // Ham SQLite hatası DEĞİL — çevrilmiş, açık bir mesaj (Sprint
        // 3.10 onayı madde 2).
        setValidationError(
          t("tree.bulkConflictError", { numbers: error.conflictingNumbers.join(", ") })
        );
      } else {
        setValidationError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="status-screen" onSubmit={handleSubmit} noValidate>
      <h1 className="status-screen__title">{t("tree.bulkCreateTitle")}</h1>

      <FormError message={validationError} />

      <NumberField
        id="bulk-start-number"
        label={t("tree.startNumber")}
        value={startNumberInput}
        onChange={setStartNumberInput}
        step="1"
        required
      />

      <NumberField
        id="bulk-count"
        label={t("tree.count")}
        value={countInput}
        onChange={setCountInput}
        step="1"
        required
      />

      {hasValidPreview ? (
        <p className="status-card__value">
          {t("tree.bulkPreview", { start: parsedStart, end: previewEnd, count: parsedCount })}
        </p>
      ) : null}

      <TextField id="bulk-variety" label={t("tree.variety")} value={variety} onChange={setVariety} />

      <CheckboxField
        id="bulk-is-reference"
        label={t("tree.isReferenceTree")}
        checked={isReferenceTree}
        onChange={setIsReferenceTree}
      />

      <button type="submit" className="lock-screen__button" disabled={isSubmitting || !hasValidPreview}>
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
    </form>
  );
}
