/**
 * BulkOperationsScreen
 * =======================
 * bkz. Sprint 10.2. Parsel ekranından erişilen "Toplu İşlemler"
 * bölümü — 6 işlem seçeneği (Gözlem + 5 Bakım türü, "Biçme" dahil).
 * Seçime göre `BulkObservationForm`/`BulkMaintenanceForm`'a geçer.
 *
 * NAVİGASYON: Bu ekran henüz hiçbir rotaya bağlı DEĞİL (diğer
 * modüllerin aşamalı yaklaşımıyla tutarlı — Sprint 10.3'te navigasyon).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTrees } from "../trees/hooks/useTrees";
import { BulkObservationForm } from "./BulkObservationForm";
import { BulkMaintenanceForm } from "./BulkMaintenanceForm";
import { MaintenanceType, type MaintenanceTypeValue } from "../maintenance/domain/maintenance.types";

interface BulkOperationsScreenProps {
  parcelId: string;
  onBack: () => void;
}

type View =
  | { mode: "menu" }
  | { mode: "observation" }
  | { mode: "maintenance"; initialType: MaintenanceTypeValue };

const MAINTENANCE_MENU_ITEMS: { type: MaintenanceTypeValue; labelKey: string }[] = [
  { type: MaintenanceType.Irrigation, labelKey: "maintenance.type.irrigation" },
  { type: MaintenanceType.Fertilization, labelKey: "maintenance.type.fertilization" },
  { type: MaintenanceType.Pesticide, labelKey: "maintenance.type.pesticide" },
  { type: MaintenanceType.Pruning, labelKey: "maintenance.type.pruning" },
  { type: MaintenanceType.Other, labelKey: "bulkOperations.mowingLabel" },
];

export function BulkOperationsScreen({ parcelId, onBack }: BulkOperationsScreenProps) {
  const { t } = useTranslation();
  const { trees, status } = useTrees({ mode: "parcel", parcelId });
  const [view, setView] = useState<View>({ mode: "menu" });

  if (status === "loading" || status === "idle") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }

  if (view.mode === "observation") {
    return <BulkObservationForm parcelId={parcelId} trees={trees} onBack={() => setView({ mode: "menu" })} />;
  }

  if (view.mode === "maintenance") {
    return <BulkMaintenanceForm parcelId={parcelId} trees={trees} onBack={() => setView({ mode: "menu" })} />;
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("bulkOperations.screenTitle")}</h1>
      <p className="status-card__value">{t("bulkOperations.treeCount", { count: trees.length })}</p>

      <button
        type="button"
        className="lock-screen__button"
        onClick={() => setView({ mode: "observation" })}
        style={{ marginTop: 12 }}
      >
        {t("bulkOperations.observationMenuItem")}
      </button>

      {MAINTENANCE_MENU_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          className="lock-screen__button"
          onClick={() => setView({ mode: "maintenance", initialType: item.type })}
          style={{ marginTop: 8 }}
        >
          {t(item.labelKey)}
        </button>
      ))}

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
