/**
 * Gözlem Domain Tipleri
 * ========================
 * bkz. docs/observation-domain-review.md (onaylandı 2026-07-15)
 */

export type ObservationType = "general" | "health_concern" | "growth_stage" | "weather_impact" | "other";

export interface Observation {
  id: string;
  parcelId: string;
  /** nullable — parsel geneli bir gözlem olabilir (bkz. Domain Review Soru 3). */
  treeId: string | null;
  observationType: ObservationType;
  /** nullable — UI seviyesinde not VEYA fotoğraftan en az biri zorunlu kılınacak (Sprint 3.3), şema seviyesinde değil. */
  note: string | null;
  observedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewObservationInput {
  parcelId: string;
  treeId?: string | null;
  observationType: ObservationType;
  note?: string | null;
  observedAt: string;
}

export type ObservationUpdateInput = Partial<Omit<NewObservationInput, "parcelId" | "treeId">>;
