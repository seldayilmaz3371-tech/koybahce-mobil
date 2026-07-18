/**
 * HarvestRecordCard — Tek Kayıt Kartı
 * ======================================
 * `MaintenanceRecordCard`/`FinanceRecordCard` ile aynı desen (Kural 12).
 */

import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/formatters";
import type { HarvestRecord } from "../domain/harvest.types";

interface HarvestRecordCardProps {
  record: HarvestRecord;
  onSelect: (record: HarvestRecord) => void;
}

export function HarvestRecordCard({ record, onSelect }: HarvestRecordCardProps) {
  const { t, i18n } = useTranslation();
  const formattedDate = formatDate(record.harvestDate, i18n.language);
  const quantityLabel = t("harvest.quantityValue", { value: record.quantityKg });
  const metaText = `${quantityLabel} · ${formattedDate}`;

  return (
    <button
      type="button"
      className="parcel-list__item"
      onClick={() => onSelect(record)}
      aria-label={metaText}
    >
      <span className="parcel-list__name">{quantityLabel}</span>
      <span className="parcel-list__meta">{formattedDate}</span>
    </button>
  );
}
