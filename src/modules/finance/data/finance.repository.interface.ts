/**
 * Finans Repository Sözleşmesi
 * ===============================
 * bkz. docs/repository-contract-matrix.md, Modül 4 Mimari Onayı.
 *
 * Observation'daki dual-scope (listByTree/listByParcel) + sayfalama
 * deseninin AYNISI — bir parselin finans geçmişi de yıllar boyunca
 * birikir (Observation ile aynı ölçek gerekçesi).
 */

import type {
  FinanceRecord,
  NewFinanceRecordInput,
  FinanceRecordUpdateInput,
} from "../domain/finance.types";

export interface FinanceRecordListOptions {
  /** Varsayılan true — pasife alınmış kayıtlar listelenmez. */
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface IFinanceRepository {
  /** Bir parseldeki TÜM finans kayıtları (ağaç-özel olanlar dahil), en yeni önce. */
  listByParcel(parcelId: string, options?: FinanceRecordListOptions): Promise<FinanceRecord[]>;
  /** Sadece belirli bir ağaca bağlı finans kayıtları, en yeni önce. */
  listByTree(treeId: string, options?: FinanceRecordListOptions): Promise<FinanceRecord[]>;
  getById(id: string): Promise<FinanceRecord | null>;
  create(input: NewFinanceRecordInput): Promise<FinanceRecord>;
  update(id: string, changes: FinanceRecordUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
}
