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

/**
 * Toplu Ağaç Oluşturma Girişi (Sprint 3.10)
 * ============================================
 * BİLEREK `NewTreeInput`'tan AYRI bir tip — `Tree`/`NewTreeInput`
 * hiç değişmedi (Sprint 3.10 onayı: "Veri modeli değişmeyecek").
 * `variety` burada isteğe bağlı (Minimum Dokunuş İlkesi) — verilmezse
 * boş string (`""`) olarak saklanır, `Tree.variety`'nin kendisi hâlâ
 * `string` (asla `null`), sadece DEĞERİ boş olabilir. Bu, tek-tek
 * oluşturma formundaki zorunluluk kuralından BİLİNÇLİ bir UX sapması —
 * veri modeli seviyesinde değil.
 */
export interface BulkCreateTreesInput {
  parcelId: string;
  startNumber: number;
  count: number;
  variety?: string;
  isReferenceTree?: boolean;
}

/**
 * `TreeRepository.createMany()`'nin, INSERT denemeden ÖNCE tespit
 * ettiği numara çakışmalarını taşıyan özel hata tipi — ham SQLite
 * `UNIQUE constraint failed` hatasının kullanıcıya hiç gösterilmemesi
 * için (Sprint 3.10 onayı madde 2).
 */
export class TreeNumberConflictError extends Error {
  readonly conflictingNumbers: string[];

  constructor(conflictingNumbers: string[]) {
    super(`Tree numbers already exist in this parcel: ${conflictingNumbers.join(", ")}`);
    this.name = "TreeNumberConflictError";
    this.conflictingNumbers = conflictingNumbers;
  }
}
