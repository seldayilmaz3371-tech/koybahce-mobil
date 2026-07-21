/**
 * BulkOperationsScreen
 * =======================
 * bkz. Sprint 10.2/10.3. Parsel ekranından erişilen "Toplu İşlemler"
 * bölümü — 6 işlem seçeneği (Gözlem + 5 Bakım türü, "Biçme" dahil).
 * Seçime göre `BulkObservationForm`/`BulkMaintenanceForm`'a geçer.
 *
 * Sprint 10.3 EKLENTİLERİ:
 *   - "Son Kullanılan İşlem" hızlı erişim butonu (menünün EN ÜSTÜNDE,
 *     `localPreferences`'ten okunuyor) — kullanıcı sürekli AYNI işlemi
 *     yapıyorsa, TEK dokunuşla o forma gidebilir.
 *   - Ardışık İşlem Sihirbazı: bir alt formun sonuç ekranından "Aynı
 *     Ağaçlara Başka İşlem Uygula" ile buraya dönülürse, `carriedTreeIds`
 *     state'i o ağaç listesini YENİ forma AKTARIR — kullanıcı AYNI
 *     seçimi TEKRAR yapmak ZORUNDA kalmaz.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTrees } from "../trees/hooks/useTrees";
import { BulkObservationForm } from "./BulkObservationForm";
import { BulkMaintenanceForm } from "./BulkMaintenanceForm";
import { MaintenanceType, type MaintenanceTypeValue } from "../maintenance/domain/maintenance.types";
import { localPreferences, LocalPreferenceKey } from "../../native/preferences";
import { addBackButtonListener } from "../../native/appBackButton";

interface BulkOperationsScreenProps {
  parcelId: string;
  onBack: () => void;
}

type View =
  | { mode: "menu" }
  | { mode: "observation" }
  | { mode: "maintenance"; initialType: MaintenanceTypeValue };

const OBSERVATION_PREFERENCE_MARKER = "observation";

const MAINTENANCE_MENU_ITEMS: { type: MaintenanceTypeValue; labelKey: string }[] = [
  { type: MaintenanceType.Irrigation, labelKey: "maintenance.type.irrigation" },
  { type: MaintenanceType.Fertilization, labelKey: "maintenance.type.fertilization" },
  { type: MaintenanceType.Pesticide, labelKey: "maintenance.type.pesticide" },
  { type: MaintenanceType.Pruning, labelKey: "maintenance.type.pruning" },
  { type: MaintenanceType.Other, labelKey: "bulkOperations.mowingLabel" },
];

function resolveLastUsedLabel(lastUsed: string | null): string | null {
  if (!lastUsed) return null;
  if (lastUsed === OBSERVATION_PREFERENCE_MARKER) return "bulkOperations.observationMenuItem";
  const found = MAINTENANCE_MENU_ITEMS.find((item) => item.type === lastUsed);
  return found?.labelKey ?? null;
}

export function BulkOperationsScreen({ parcelId, onBack }: BulkOperationsScreenProps) {
  const { t } = useTranslation();
  const { trees, status } = useTrees({ mode: "parcel", parcelId });
  const [view, setView] = useState<View>({ mode: "menu" });
  const [carriedTreeIds, setCarriedTreeIds] = useState<string[] | null>(null);
  const [lastUsed, setLastUsed] = useState<string | null>(null);

  useEffect(() => {
    localPreferences
      .get(LocalPreferenceKey.LAST_USED_BULK_OPERATION)
      .then(setLastUsed)
      .catch(() => setLastUsed(null));
  }, []);

  // bkz. Sprint 10.3 — GERÇEK bulgu: bu ekran donanım geri tuşunu HİÇ
  // desteklemiyordu (Bakım/Hasat'ın aksine) — kullanıcının "hızlı saha
  // kullanımı" hedefiyle ÇELİŞEN bir eksiklikti, MaintenanceScreen'in
  // KANITLANMIŞ deseniyle düzeltildi.
  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "menu") {
        setView({ mode: "menu" });
      } else {
        onBack();
      }
    });
  }, [view, onBack]);

  const handleApplyAnotherOperation = (treeIds: string[]) => {
    setCarriedTreeIds(treeIds);
    setView({ mode: "menu" });
  };

  if (status === "loading" || status === "idle") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }

  if (view.mode === "observation") {
    return (
      <BulkObservationForm
        parcelId={parcelId}
        trees={trees}
        onBack={() => setView({ mode: "menu" })}
        initialSelectedTreeIds={carriedTreeIds ?? undefined}
        onApplyAnotherOperation={handleApplyAnotherOperation}
      />
    );
  }

  if (view.mode === "maintenance") {
    return (
      <BulkMaintenanceForm
        parcelId={parcelId}
        trees={trees}
        onBack={() => setView({ mode: "menu" })}
        initialSelectedTreeIds={carriedTreeIds ?? undefined}
        onApplyAnotherOperation={handleApplyAnotherOperation}
        initialMaintenanceType={view.initialType}
      />
    );
  }

  const lastUsedLabelKey = resolveLastUsedLabel(lastUsed);

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("bulkOperations.screenTitle")}</h1>
      <p className="status-card__value">{t("bulkOperations.treeCount", { count: trees.length })}</p>

      {carriedTreeIds ? (
        <div className="status-card">
          <p className="status-card__value">
            {t("bulkOperations.carriedSelectionNotice", { count: carriedTreeIds.length })}
          </p>
        </div>
      ) : null}

      {lastUsedLabelKey ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 12, border: "2px solid var(--color-primary)" }}
          onClick={() =>
            lastUsed === OBSERVATION_PREFERENCE_MARKER
              ? setView({ mode: "observation" })
              : setView({ mode: "maintenance", initialType: lastUsed as MaintenanceTypeValue })
          }
        >
          {t("bulkOperations.lastUsedButton", { operation: t(lastUsedLabelKey) })}
        </button>
      ) : null}

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
