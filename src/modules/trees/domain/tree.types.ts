/**
 * Ağaç Domain Tipleri
 * ======================
 * bkz. docs/adr/0016-modul2-veri-modeli.md
 *
 * NOT: `treeCount` gibi ayrı bir sayaç alanı yok — ağaç sayısı her
 * zaman ilgili repository üzerinden anlık hesaplanır (bkz. ADR 0016,
 * web projesindeki senkronizasyon riski taşıyan `TreeCountChangeLog`
 * deseninin BİLİNÇLİ OLARAK tekrarlanmaması kararı).
 */

export interface Tree {
  id: string;
  parcelId: string;
  treeNumber: string;
  /** Serbest metin (çeşit adı) — kullanıcının kendi dilinde, çeviri gerektirmez. */
  variety: string;
  plantingYear: number | null;
  latitude: number | null;
  longitude: number | null;
  isReferenceTree: boolean;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Yeni bir ağaç oluştururken gereken alanlar. */
export interface NewTreeInput {
  parcelId: string;
  treeNumber: string;
  variety: string;
  plantingYear?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isReferenceTree?: boolean;
  notes?: string | null;
}

export type TreeUpdateInput = Partial<Omit<NewTreeInput, "parcelId">>;
