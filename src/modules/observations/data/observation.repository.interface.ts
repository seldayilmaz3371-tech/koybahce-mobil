/**
 * Gözlem Repository Sözleşmesi
 * ===============================
 * bkz. docs/repository-contract-matrix.md, docs/observation-domain-review.md
 *
 * MİMARİ KARAR (Sprint 3.1 Ön Kontrol): İki ayrı kapsam metodu —
 * `listByTree` (Modül 3 Hedefi'ndeki birincil akış: Parsel→Ağaç→
 * Gözlem) ve `listByParcel` (SADECE parsel geneli, `tree_id IS NULL`
 * kayıtlar — bir ağacın gözlemlerini parsel listesinde TEKRAR
 * göstermemek için). Bu, `ITreeRepository`'nin `listByParcel`/
 * `listReferenceTrees` dual-scope deseniyle tutarlı (Kural 12).
 *
 * SAYFALAMA (Domain Review'da onaylandı — Ağaç'ın DEĞİL, Parsel'in
 * deseni): `ParcelListOptions`teki gibi `limit`/`offset`, hook
 * katmanında `hasMore`/`loadMore` ile kullanılacak.
 */

import type {
  BulkCreateObservationsInput,
  NewObservationInput,
  Observation,
  ObservationUpdateInput,
} from "../domain/observation.types";

export interface ObservationListOptions {
  /** Varsayılan true — pasife alınmış gözlemler listelenmez. */
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface IObservationRepository {
  /** Belirli bir ağacın gözlemleri, en yeni önce (bkz. Domain Review Soru 4). */
  listByTree(treeId: string, options?: ObservationListOptions): Promise<Observation[]>;
  /** Sadece parsel geneli (tree_id IS NULL) gözlemler, en yeni önce. */
  listByParcel(parcelId: string, options?: ObservationListOptions): Promise<Observation[]>;
  getById(id: string): Promise<Observation | null>;
  create(input: NewObservationInput): Promise<Observation>;
  /**
   * bkz. Sprint 10.1 (Saha Operasyonları Paketi). AYNI gözlem
   * içeriğini `input.treeIds`'teki HER ağaç için TEK bir transaction
   * içinde oluşturur (`Tree.createMany()`'nin KANITLANMIŞ deseni —
   * `runInTransaction()` içinde döngü). `treeIds` boşsa boş dizi
   * döner, hata FIRLATILMAZ.
   */
  createMany(input: BulkCreateObservationsInput): Promise<Observation[]>;
  update(id: string, changes: ObservationUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
  /**
   * bkz. Sprint 10.2 (Toplu İşlemler "Geri Al" özelliği). `createMany()`'nin
   * döndürdüğü id listesini TEK bir transaction içinde pasife alır —
   * `createMany()`'nin BİREBİR AYNI deseni (`runInTransaction()` içinde
   * döngü). Fiziksel SİLME DEĞİL — soft-delete (Kural: mevcut desen).
   */
  deactivateMany(ids: string[]): Promise<void>;
}
