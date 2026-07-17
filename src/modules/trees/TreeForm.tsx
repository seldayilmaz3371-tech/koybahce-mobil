/**
 * TreeForm
 * ==========
 * Yeni ağaç oluşturma / mevcut ağacı düzenleme formu.
 *
 * `ParcelForm` ile BİLEREK aynı desen (Kural 12): ortak form
 * bileşenleri (`TextField`/`NumberField`/`TextAreaField`/`FormError`/
 * `CheckboxField`), aynı doğrulama/gönderim akışı.
 *
 * `parcelId` her zaman prop olarak gelir — bir ağacın parseli formda
 * hiç düzenlenemez (bkz. `TreeUpdateInput`, `parcelId` bilerek yok).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 * ERİŞİLEBİLİRLİK (Protocol Bölüm 19): Her alan gerçek `<label>`.
 */

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "../../shared/components/form/TextField";
import { NumberField } from "../../shared/components/form/NumberField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { CheckboxField } from "../../shared/components/form/CheckboxField";
import { FormError } from "../../shared/components/form/FormError";
import type { NewTreeInput, Tree } from "./domain/tree.types";

interface TreeFormProps {
  /** Ağacın ait olduğu parsel. Oluşturma modunda zorunlu; düzenleme modunda `initialValue.parcelId` ile aynı olmalıdır ve formda DEĞİŞTİRİLEMEZ. */
  parcelId: string;
  initialValue?: Tree;
  onSubmit: (input: NewTreeInput) => Promise<void>;
  onCancel: () => void;
  /** Sadece düzenleme modunda sağlanır. */
  onDelete?: () => Promise<void>;
  /** Sadece düzenleme modunda sağlanır — henüz kaydedilmemiş bir ağacın gözlemleri olamaz (Sprint 3.5). NOT: `onDelete` ile aynı desen — bu bileşen sadece prop varlığına bakar, "hangi modda geçirilecek" ÇAĞIRANIN (TreesScreen) sorumluluğudur. */
  onViewObservations?: () => void;
  /** Sadece düzenleme modunda sağlanır (Sprint 5.3). AYNI desen — Parsel Modu VEYA Referans Modu fark etmeksizin çalışır, özel bir ayrım YOK (Sprint 5.1'in "referans ağaçlar için özel ayrım yok" kararıyla tutarlı — bu tek prop, hem "Ağaç→Bakım" hem "Referans Ağaç Bakım Geçmişi" ihtiyacını aynı anda karşılıyor). */
  onViewMaintenance?: () => void;
  /** Sadece düzenleme modunda sağlanır (Sprint 7.1). AYNI desen. */
  onViewAiChat?: () => void;
}

export function TreeForm({
  parcelId,
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
  onViewObservations,
  onViewMaintenance,
  onViewAiChat,
}: TreeFormProps) {
  const { t } = useTranslation();

  const [treeNumber, setTreeNumber] = useState(initialValue?.treeNumber ?? "");
  const [variety, setVariety] = useState(initialValue?.variety ?? "");
  const [plantingYear, setPlantingYear] = useState(initialValue?.plantingYear?.toString() ?? "");
  const [latitude, setLatitude] = useState(initialValue?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(initialValue?.longitude?.toString() ?? "");
  const [isReferenceTree, setIsReferenceTree] = useState(initialValue?.isReferenceTree ?? false);
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    const trimmedTreeNumber = treeNumber.trim();
    if (trimmedTreeNumber.length === 0) {
      setValidationError(t("tree.treeNumberRequired"));
      return;
    }

    const trimmedVariety = variety.trim();
    if (trimmedVariety.length === 0) {
      setValidationError(t("tree.varietyRequired"));
      return;
    }

    let parsedPlantingYear: number | null = null;
    if (plantingYear.trim()) {
      const parsed = Number(plantingYear);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setValidationError(t("tree.plantingYearInvalid"));
        return;
      }
      parsedPlantingYear = parsed;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        treeNumber: trimmedTreeNumber,
        variety: trimmedVariety,
        plantingYear: parsedPlantingYear,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        isReferenceTree,
        notes: notes.trim() || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(t("tree.deleteConfirm"));
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="status-screen" onSubmit={handleSubmit} noValidate>
      <h1 className="status-screen__title">
        {initialValue ? t("tree.formTitleEdit") : t("tree.formTitleCreate")}
      </h1>

      <FormError message={validationError} />
      {/* <form noValidate>: bkz. ParcelForm.tsx'teki aynı not — native
          tarayıcı doğrulaması, i18n'li JS doğrulamamızı atlar. */}

      <TextField
        id="tree-number"
        label={t("tree.treeNumber")}
        value={treeNumber}
        onChange={setTreeNumber}
        required
      />

      <TextField id="tree-variety" label={t("tree.variety")} value={variety} onChange={setVariety} required />

      <NumberField
        id="tree-planting-year"
        label={t("tree.plantingYear")}
        value={plantingYear}
        onChange={setPlantingYear}
        step="1"
      />

      <CheckboxField
        id="tree-is-reference"
        label={t("tree.isReferenceTree")}
        checked={isReferenceTree}
        onChange={setIsReferenceTree}
      />

      <NumberField id="tree-latitude" label={t("common.latitude")} value={latitude} onChange={setLatitude} />

      <NumberField id="tree-longitude" label={t("common.longitude")} value={longitude} onChange={setLongitude} />

      <TextAreaField id="tree-notes" label={t("common.notes")} value={notes} onChange={setNotes} />

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

      {onViewObservations ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewObservations}
          disabled={isSubmitting}
        >
          {t("tree.viewObservationsButton")}
        </button>
      ) : null}

      {onViewMaintenance ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewMaintenance}
          disabled={isSubmitting}
        >
          {t("tree.viewMaintenanceButton")}
        </button>
      ) : null}

      {onViewAiChat ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewAiChat}
          disabled={isSubmitting}
        >
          {t("tree.viewAiChatButton")}
        </button>
      ) : null}

      {onDelete ? (
        <button
          type="button"
          className="lock-screen__button lock-screen__button--danger"
          style={{ marginTop: 8 }}
          onClick={handleDelete}
          disabled={isSubmitting}
        >
          {t("tree.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
