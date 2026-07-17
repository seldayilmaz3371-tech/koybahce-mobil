/**
 * MaintenancePlanList — Liste Render Bileşeni
 * ===============================================
 * `MaintenanceRecordList` ile aynı desen (Kural 12).
 */

import type { MaintenancePlan } from "../domain/maintenance.types";
import { MaintenancePlanCard } from "./MaintenancePlanCard";

interface MaintenancePlanListProps {
  plans: MaintenancePlan[];
  onSelect: (plan: MaintenancePlan) => void;
}

export function MaintenancePlanList({ plans, onSelect }: MaintenancePlanListProps) {
  return (
    <ul className="parcel-list">
      {plans.map((plan) => (
        <li key={plan.id}>
          <MaintenancePlanCard plan={plan} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
