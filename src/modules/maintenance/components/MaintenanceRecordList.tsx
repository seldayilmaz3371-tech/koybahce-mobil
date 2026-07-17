/**
 * MaintenanceRecordList — Liste Render Bileşeni
 * =================================================
 * `FinanceRecordList` ile aynı desen (Kural 12).
 */

import type { MaintenanceRecord } from "../domain/maintenance.types";
import { MaintenanceRecordCard } from "./MaintenanceRecordCard";

interface MaintenanceRecordListProps {
  records: MaintenanceRecord[];
  onSelect: (record: MaintenanceRecord) => void;
}

export function MaintenanceRecordList({ records, onSelect }: MaintenanceRecordListProps) {
  return (
    <ul className="parcel-list">
      {records.map((record) => (
        <li key={record.id}>
          <MaintenanceRecordCard record={record} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
