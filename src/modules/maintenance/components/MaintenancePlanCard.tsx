/**
 * MaintenancePlanCard — Tek Plan Kartı
 * =======================================
 * `MaintenanceRecordCard` ile aynı desen (Kural 12).
 */

import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/formatters";
import type { MaintenancePlan } from "../domain/maintenance.types";

interface MaintenancePlanCardProps {
  plan: MaintenancePlan;
  onSelect: (plan: MaintenancePlan) => void;
}

export function MaintenancePlanCard({ plan, onSelect }: MaintenancePlanCardProps) {
  const { t, i18n } = useTranslation();
  const typeLabel = t(`maintenance.type.${plan.maintenanceType}`);
  const formattedDate = formatDate(plan.nextDueDate, i18n.language);
  const intervalText = t("maintenancePlan.intervalDays") + `: ${plan.intervalDays}`;
  const metaText = `${formattedDate} · ${intervalText}`;

  return (
    <button
      type="button"
      className="parcel-list__item"
      onClick={() => onSelect(plan)}
      aria-label={`${typeLabel}, ${metaText}`}
    >
      <span className="parcel-list__name">{typeLabel}</span>
      <span className="parcel-list__meta">{metaText}</span>
    </button>
  );
}
