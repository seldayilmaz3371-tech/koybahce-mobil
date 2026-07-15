/**
 * Ağaç Repository Sözleşmesi
 * =============================
 * bkz. docs/adr/0016-modul2-veri-modeli.md
 *
 * Bu dosya sadece SÖZLEŞMEYİ tanımlar. İmplementasyon (`tree.repository.ts`)
 * bu adımda YAZILMIYOR — Protocol Bölüm 8 gereği küçük, ayrı adımlarla
 * ilerliyoruz; bu commit sadece ParcelRepository'yi tamamlıyor. Bu
 * arayüz, gelecekteki TreeRepository implementasyonunun sözleşmesini
 * şimdiden sabitliyor.
 */

import type { BulkCreateTreesInput, NewTreeInput, Tree, TreeUpdateInput } from "../domain/tree.types";

export interface ITreeRepository {
  listByParcel(parcelId: string): Promise<Tree[]>;
  /** Sadece `is_reference_tree = 1` olan ağaçlar — AI Master Architecture Bölüm 11 (Fotoğraf Analizi) için. */
  listReferenceTrees(): Promise<Tree[]>;
  getById(id: string): Promise<Tree | null>;
  create(input: NewTreeInput): Promise<Tree>;
  /**
   * Toplu ağaç oluşturma (Sprint 3.10) — tek transaction, ya hepsi ya
   * hiçbiri. Numara çakışması varsa `TreeNumberConflictError` fırlatır
   * (hiçbir INSERT denemeden, ön kontrolle).
   */
  createMany(input: BulkCreateTreesInput): Promise<Tree[]>;
  update(id: string, changes: TreeUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
  /** Web projesindeki ayrı sayaç deseni yerine anlık hesaplama (bkz. ADR 0016). */
  countByParcel(parcelId: string): Promise<number>;
}
