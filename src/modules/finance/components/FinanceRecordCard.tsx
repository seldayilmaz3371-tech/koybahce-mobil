/**
 * FinanceRecordCard — Tek Kayıt Kartı
 * ======================================
 * `ObservationCard` ile aynı desen (Kural 12) — ayrı bir bileşen
 * olarak çıkarıldı, ileride bir Finans Raporu/Timeline görünümü
 * doğrudan yeniden kullanabilir.
 */

import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "../../../i18n/formatters";
import type { FinanceRecord } from "../domain/finance.types";

interface FinanceRecordCardProps {
  record: FinanceRecord;
  onSelect: (record: FinanceRecord) => void;
}

export function FinanceRecordCard({ record, onSelect }: FinanceRecordCardProps) {
  const { t, i18n } = useTranslation();
  const typeLabel = t(`finance.type.${record.recordType}`);
  const formattedAmount = formatCurrency(record.amount, record.currencyCode, i18n.language);
  const formattedDate = formatDate(record.recordDate, i18n.language);

  return (
    <button
      type="button"
      className="parcel-list__item"
      onClick={() => onSelect(record)}
      aria-label={`${typeLabel}, ${formattedAmount}, ${formattedDate}`}
    >
      <span className="parcel-list__name">{formattedAmount}</span>
      <span className="parcel-list__meta">
        {typeLabel} · {formattedDate}
      </span>
    </button>
  );
}
