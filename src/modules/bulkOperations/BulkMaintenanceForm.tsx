/**
 * BulkMaintenanceForm
 * ======================
 * bkz. Sprint 10.2. "Toplu Sulama"/"Toplu Gübreleme"/"Toplu İlaçlama"/
 * "Toplu Budama"/"Toplu Biçme" — MİMARİ OLARAK TEK form (bkz.
 * `docs/saha-operasyonlari-mimari-analiz.md` Kritik Bulgu 2).
 *
 * 🔴 "BİÇME" KARARI (bu form içinde uygulanan): `MaintenanceType`
 * enum'unda "biçme" (mowing) değeri YOK — ne TS'te ne SQLite CHECK
 * kısıtında (gerçek dosyalardan doğrulandı). SQLite'ta bir CHECK
 * kısıtını değiştirmek TABLO YENİDEN OLUŞTURMA gerektirir (gerçek
 * risk, ADR 0005'in "sadece ekleme" migration ilkesiyle doğal olarak
 * ÇATIŞAN bir işlem). Bu sprint için EN DÜŞÜK RİSKLİ çözüm seçildi:
 * "Biçme" kullanıcıya bir seçenek olarak GÖSTERİLİYOR, ama arka planda
 * `maintenanceType: "other"` olarak KAYDEDİLİYOR — hiçbir migration
 * GEREKMEDİ. Gerçek bir "mowing" enum değeri gelecekte istenirse, bu
 * GERÇEK bir ADR + migration (tablo yeniden oluşturma) gerektirir.
 *
 * UX HEDEFİ: 50-500 ağacı 30-60 saniyede tamamlama — bu yüzden TEK
 * ekranda (tip seçimi + ağaç seçimi + onay), fazla adım YOK.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TreeSelectorList, type TreeSelectionMode } from "./components/TreeSelectorList";
import { useTreeSelection } from "./hooks/useTreeSelection";
import { SelectField } from "../../shared/components/form/SelectField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { maintenanceRepository } from "../maintenance/data/maintenance.repository";
import { MaintenanceType, MaintenanceStatus, type MaintenanceTypeValue } from "../maintenance/domain/maintenance.types";
import type { Tree } from "../trees/domain/tree.types";

interface BulkMaintenanceFormProps {
  parcelId: string;
  trees: Tree[];
  onBack: () => void;
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

export function BulkMaintenanceForm({ parcelId, trees, onBack }: BulkMaintenanceFormProps) {
  const { t } = useTranslation();
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceTypeValue>(MaintenanceType.Irrigation);
  const [notes, setNotes] = useState("");
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
        completedDate: new Date().toISOString().slice(0, 10),
        notes: notes.trim() || null,
      });
      setResult({ createdIds: created.map((r) => r.id), count: created.length });
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
