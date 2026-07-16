/**
 * FinanceRecordList — Liste Render Bileşeni
 * ============================================
 * `ObservationList` ile aynı desen (Kural 12).
 */

import type { FinanceRecord } from "../domain/finance.types";
import { FinanceRecordCard } from "./FinanceRecordCard";

interface FinanceRecordListProps {
  records: FinanceRecord[];
  onSelect: (record: FinanceRecord) => void;
}

export function FinanceRecordList({ records, onSelect }: FinanceRecordListProps) {
  return (
    <ul className="parcel-list">
      {records.map((record) => (
        <li key={record.id}>
          <FinanceRecordCard record={record} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
