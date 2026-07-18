/**
 * Hasat Domain Tipleri
 * =======================
 * bkz. Sprint 8.1, `docs/roadmap/01-current-state-and-roadmap.md`
 * Bölüm 2.1. Hasat, Finans'tan BİLİNÇLİ olarak ayrı tutulur (Modül 4
 * kararı) — bu domain SADECE miktar (kg) kaydı taşır, finansal bir
 * alan İÇERMEZ.
 *
 * YAGNI: Bugün `HarvestRecord` hiçbir Finans/AI/Foto alanı İÇERMİYOR —
 * gelecekte gerekirse ADR 0005'in additive migration deseniyle
 * (nullable FK) sancısız eklenebilir (Bakım/Gözlem modüllerinin
 * emsaliyle tutarlı).
 */

export interface HarvestRecord {
  id: string;
  parcelId: string;
  /** nullable — parsel geneli bir hasat kaydı olabilir, belirli bir ağaca bağlı OLMAK ZORUNDA değil (Bakım/Gözlem'in dual-scope deseniyle tutarlı). */
  treeId: string | null;
  harvestDate: string;
  quantityKg: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewHarvestRecordInput {
  parcelId: string;
  treeId?: string | null;
  harvestDate: string;
  quantityKg: number;
  notes?: string | null;
}

export type HarvestRecordUpdateInput = Partial<
  Omit<NewHarvestRecordInput, "parcelId"> & { isActive: boolean }
>;
