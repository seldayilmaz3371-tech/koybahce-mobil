/**
 * BulkObservationForm
 * ======================
 * bkz. Sprint 10.2. "Toplu Gözlem" — `BulkMaintenanceForm` ile AYNI
 * desen (Kural: kod tekrarından kaçın), `TreeSelectorList`/
 * `useTreeSelection` ORTAK bileşenleri paylaşılıyor.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TreeSelectorList, type TreeSelectionMode } from "./components/TreeSelectorList";
import { useTreeSelection } from "./hooks/useTreeSelection";
import { SelectField } from "../../shared/components/form/SelectField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { observationRepository } from "../observations/data/observation.repository";
import type { ObservationType } from "../observations/domain/observation.types";
import type { Tree } from "../trees/domain/tree.types";

interface BulkObservationFormProps {
  parcelId: string;
  trees: Tree[];
  onBack: () => void;
}

type ResultState = { createdIds: string[]; count: number } | null;

const OBSERVATION_TYPE_OPTIONS: { value: ObservationType; labelKey: string }[] = [
  { value: "general", labelKey: "observation.type.general" },
  { value: "health_concern", labelKey: "observation.type.health_concern" },
  { value: "growth_stage", labelKey: "observation.type.growth_stage" },
  { value: "weather_impact", labelKey: "observation.type.weather_impact" },
  { value: "other", labelKey: "observation.type.other" },
];

export function BulkObservationForm({ parcelId, trees, onBack }: BulkObservationFormProps) {
  const { t } = useTranslation();
  const [observationType, setObservationType] = useState<ObservationType>("general");
  const [note, setNote] = useState("");
  const [selectionMode, setSelectionMode] = useState<TreeSelectionMode>("all");
  const selection = useTreeSelection();
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
        observedAt: new Date().toISOString(),
      });
      setResult({ createdIds: created.map((o) => o.id), count: created.length });
    } catch {
      setErrorMessage(t("bulkOperations.applyError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!result) return;
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
        <button type="button" className="lock-screen__button" onClick={handleUndo} disabled={isSubmitting}>
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
