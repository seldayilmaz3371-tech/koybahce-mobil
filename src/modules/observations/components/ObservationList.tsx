/**
 * ObservationList — Liste Render Bileşeni
 * ==========================================
 * `ParcelList`/`TreeList` ile aynı desen (Kural 12) — liste render
 * sorumluluğu ekrandan ayrı tutuluyor. `ObservationCard`'ı map'liyor.
 */

import type { Observation } from "../domain/observation.types";
import { ObservationCard } from "./ObservationCard";

interface ObservationListProps {
  observations: Observation[];
  onSelect: (observation: Observation) => void;
}

export function ObservationList({ observations, onSelect }: ObservationListProps) {
  return (
    <ul className="parcel-list">
      {observations.map((observation) => (
        <li key={observation.id}>
          <ObservationCard observation={observation} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
