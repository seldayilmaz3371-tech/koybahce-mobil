/**
 * MaintenanceRecordCard — Tek Kayıt Kartı
 * ==========================================
 * `FinanceRecordCard` ile aynı desen (Kural 12).
 *
 * Gösterilecek tarih: `completedDate` varsa o, yoksa `scheduledDate`
 * (ikisi de yoksa — ör. iptal edilmiş bir kayıt — tarih hiç gösterilmez).
 */

import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/formatters";
import type { MaintenanceRecord } from "../domain/maintenance.types";

interface MaintenanceRecordCardProps {
  record: MaintenanceRecord;
  onSelect: (record: MaintenanceRecord) => void;
}

export function MaintenanceRecordCard({ record, onSelect }: MaintenanceRecordCardProps) {
  const { t, i18n } = useTranslation();
  const typeLabel = t(`maintenance.type.${record.maintenanceType}`);
  const statusLabel = t(`maintenance.status.${record.status}`);
  const displayDateIso = record.completedDate ?? record.scheduledDate;
  const formattedDate = displayDateIso ? formatDate(displayDateIso, i18n.language) : null;
  const metaText = formattedDate ? `${statusLabel} · ${formattedDate}` : statusLabel;

  return (
    <button
      type="button"
      className="parcel-list__item"
      onClick={() => onSelect(record)}
      aria-label={`${typeLabel}, ${metaText}`}
    >
      <span className="parcel-list__name">{typeLabel}</span>
      <span className="parcel-list__meta">{metaText}</span>
    </button>
  );
}
