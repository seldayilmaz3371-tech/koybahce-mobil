/**
 * ObservationForm
 * =================
 * Yeni gözlem oluşturma / mevcut gözlemi düzenleme formu.
 *
 * UX DOĞRULAMASI SONRASI ONAYLANAN 2 KARAR (Sprint 3.3, 2026-07-15):
 *   1. `observationType`, formda VARSAYILAN OLARAK "general" seçili
 *      gelir — kullanıcı değiştirmek isterse dokunur, istemezse
 *      dokunmaz (Minimum Dokunuş İlkesi).
 *   2. `observedAt` KULLANICI TARAFINDAN HİÇ GİRİLMEZ — formda alan
 *      olarak YOK. Gönderim anında (`handleSubmit` çalıştığı an,
 *      form açıldığı an DEĞİL) otomatik atanır. Düzenleme modunda
 *      ise ORİJİNAL `observedAt` KORUNUR (bir notu düzenlemek,
 *      "ne zaman gözlemlendiği" bilgisini bozmamalı — tarihsel
 *      doğruluk).
 *
 * Bu tasarım kararlarıyla, formun ZORUNLU GÖRÜNÜR alan sayısı 0'dır
 * (observationType zaten dolu geliyor, note opsiyonel).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { SelectField } from "../../shared/components/form/SelectField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import type { NewObservationInput, Observation, ObservationType } from "./domain/observation.types";

const OBSERVATION_TYPES: ObservationType[] = [
  "general",
  "health_concern",
  "growth_stage",
  "weather_impact",
  "other",
];

interface ObservationFormProps {
  parcelId: string;
  /** nullable/undefined — parsel geneli bir gözlem için `null`/`undefined` geçilir. */
  treeId?: string | null;
  initialValue?: Observation;
  onSubmit: (input: NewObservationInput) => Promise<void>;
  onCancel: () => void;
  /** Sadece düzenleme modunda sağlanır. */
  onDelete?: () => Promise<void>;
}

export function ObservationForm({
  parcelId,
  treeId,
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
}: ObservationFormProps) {
  const { t } = useTranslation();

  const [observationType, setObservationType] = useState<ObservationType>(
    initialValue?.observationType ?? "general"
  );
  const [note, setNote] = useState(initialValue?.note ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      await onSubmit({
        parcelId,
        treeId: treeId ?? null,
        observationType,
        note: note.trim() || null,
        // Düzenleme modunda orijinal observedAt KORUNUR (tarihsel
        // doğruluk) — oluşturma modunda, TAM OLARAK gönderim anında
        // (form açılış anı DEĞİL) üretilir.
        observedAt: initialValue?.observedAt ?? new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(t("observation.deleteConfirm"));
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
        {initialValue ? t("observation.formTitleEdit") : t("observation.formTitleCreate")}
      </h1>

      <SelectField
        id="observation-type"
        label={t("observation.type.label")}
        value={observationType}
        onChange={setObservationType}
        options={OBSERVATION_TYPES.map((type) => ({
          value: type,
          label: t(`observation.type.${type}`),
        }))}
      />

      <TextAreaField id="observation-note" label={t("observation.note")} value={note} onChange={setNote} />

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
          {t("observation.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
