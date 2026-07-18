/**
 * HarvestRecordList — Liste Render Bileşeni
 * =============================================
 * `MaintenanceRecordList`/`FinanceRecordList` ile aynı desen (Kural 12).
 */

import type { HarvestRecord } from "../domain/harvest.types";
import { HarvestRecordCard } from "./HarvestRecordCard";

interface HarvestRecordListProps {
  records: HarvestRecord[];
  onSelect: (record: HarvestRecord) => void;
}

export function HarvestRecordList({ records, onSelect }: HarvestRecordListProps) {
  return (
    <ul className="parcel-list">
      {records.map((record) => (
        <li key={record.id}>
          <HarvestRecordCard record={record} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
