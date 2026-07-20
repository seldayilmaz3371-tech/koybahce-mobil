/**
 * BulkObservationForm
 * ======================
 * bkz. Sprint 10.2/10.3/10.4. "Toplu Gözlem" — `BulkMaintenanceForm`
 * ile AYNI desen (Kural: kod tekrarından kaçın), `TreeSelectorList`/
 * `useTreeSelection` ORTAK bileşenleri paylaşılıyor.
 *
 * Sprint 10.4 EKLENTİSİ (Madde 1 — geriye dönük tarih/saat): Gerçek
 * saha kullanımında işlemler her zaman anında girilmiyor (ör. sabah
 * yapılan bir gözlem, akşam sisteme kaydediliyor). `observedAt` artık
 * VARSAYILAN olarak "şimdi" ile doldurulur AMA kullanıcı tarihi/saati
 * DEĞİŞTİREBİLİR — `DateField`+`TimeField` ikilisi,
 * `combineDateAndTimeToIso()` ile TEK bir ISO timestamp'e birleşir.
 * Migration GEREKMEDİ — `observations.observed_at` zaten TEXT, hiçbir
 * format kısıtı taşımıyor.
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
import { combineDateAndTimeToIso, nowAsDateInputValue, nowAsTimeInputValue } from "../../shared/utils/dateInputConversion";
import { observationRepository } from "../observations/data/observation.repository";
import type { ObservationType } from "../observations/domain/observation.types";
import { localPreferences, LocalPreferenceKey } from "../../native/preferences";
import type { Tree } from "../trees/domain/tree.types";

interface BulkObservationFormProps {
  parcelId: string;
  trees: Tree[];
  onBack: () => void;
  initialSelectedTreeIds?: string[];
  onApplyAnotherOperation?: (treeIds: string[]) => void;
}

type ResultState = { createdIds: string[]; count: number } | null;

const OBSERVATION_TYPE_OPTIONS: { value: ObservationType; labelKey: string }[] = [
  { value: "general", labelKey: "observation.type.general" },
  { value: "health_concern", labelKey: "observation.type.health_concern" },
  { value: "growth_stage", labelKey: "observation.type.growth_stage" },
  { value: "weather_impact", labelKey: "observation.type.weather_impact" },
  { value: "other", labelKey: "observation.type.other" },
];

/** "Son kullanılan işlem" tercihinde Gözlem'in kendi işaretleyicisi (Bakım türleriyle KARIŞMASIN). */
const OBSERVATION_PREFERENCE_MARKER = "observation";

export function BulkObservationForm({
  parcelId,
  trees,
  onBack,
  initialSelectedTreeIds,
  onApplyAnotherOperation,
}: BulkObservationFormProps) {
  const { t } = useTranslation();
  const [observationType, setObservationType] = useState<ObservationType>("general");
  const [note, setNote] = useState("");
  // Sprint 10.4 — varsayılan "şimdi" (yerel saat), kullanıcı değiştirebilir.
  const [dateValue, setDateValue] = useState(nowAsDateInputValue);
  const [timeValue, setTimeValue] = useState(nowAsTimeInputValue);
  const [selectionMode, setSelectionMode] = useState<TreeSelectionMode>(
    initialSelectedTreeIds && initialSelectedTreeIds.length > 0 ? "select" : "all"
  );
  const selection = useTreeSelection(initialSelectedTreeIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetTreeIds = selectionMode === "all" ? trees.map((tree) => tree.id) : Array.from(selection.selectedIds);

  const handleApply = async () => {
    if (targetTreeIds.length === 0) {
      setErrorMessage(t("bulkOperations.noTreesSelectedError"));
      return;
    }

    const typeLabel = t(OBSERVATION_TYPE_OPTIONS.find((o) => o.value === observationType)?.labelKey ?? "");
    const confirmed = window.confirm(
      t("bulkOperations.confirmMessage", { count: targetTreeIds.length, operation: typeLabel })
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await observationRepository.createMany({
        parcelId,
        treeIds: targetTreeIds,
        observationType,
        note: note.trim() || null,
        observedAt: combineDateAndTimeToIso(dateValue, timeValue),
      });
      setResult({ createdIds: created.map((o) => o.id), count: created.length });
      try {
        await localPreferences.set(LocalPreferenceKey.LAST_USED_BULK_OPERATION, OBSERVATION_PREFERENCE_MARKER);
      } catch {
        // Sessizce yut — SADECE bir UX hızlandırma tercihi.
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
      await observationRepository.deactivateMany(result.createdIds);
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
      <h1 className="status-screen__title">{t("bulkOperations.observationFormTitle")}</h1>

      {errorMessage ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{errorMessage}</p>
        </div>
      ) : null}

      <SelectField
        id="bulk-observation-type"
        label={t("observation.type.label")}
        value={observationType}
        onChange={setObservationType}
        options={OBSERVATION_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
      />

      <DateField id="bulk-observation-date" label={t("bulkOperations.dateLabel")} value={dateValue} onChange={setDateValue} required />
      <TimeField id="bulk-observation-time" label={t("bulkOperations.timeLabel")} value={timeValue} onChange={setTimeValue} required />

      <TextAreaField id="bulk-observation-note" label={t("observation.note")} value={note} onChange={setNote} />

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
