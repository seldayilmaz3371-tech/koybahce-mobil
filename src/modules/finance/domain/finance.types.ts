/**
 * Finans Domain Tipleri
 * ========================
 * bkz. Modül 4 Mimari Onayı (2026-07-15).
 *
 * record_type SADECE 'cost' | 'sale' — hasat (fiziksel miktar/verim:
 * kg/adet/kalite/randıman) BİLEREK burada YOK, gelecekteki ayrı bir
 * Hasat modülüne bırakıldı (Modül 4 Ön Analizi, kullanıcı onayı).
 *
 * currency_code formda HİÇ gösterilmiyor — sessizce 'TRY' atanıyor
 * (bkz. repository).
 */

export type FinanceRecordType = "cost" | "sale";

export interface FinanceRecord {
  id: string;
  parcelId: string;
  /** nullable — bir maliyet/satış kaydı parsel geneli olabilir (Gözlem'deki tree_id nullable deseniyle tutarlı). */
  treeId: string | null;
  recordType: FinanceRecordType;
  amount: number;
  currencyCode: string;
  /** Kayıt genellikle geriye dönük girilir — bkz. onaylanan UX kararı (Gözlem'in aksine, bu alan formda GÖRÜNÜR). */
  recordDate: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewFinanceRecordInput {
  parcelId: string;
  treeId?: string | null;
  recordType: FinanceRecordType;
  amount: number;
  recordDate: string;
  notes?: string | null;
}

export type FinanceRecordUpdateInput = Partial<Omit<NewFinanceRecordInput, "parcelId" | "treeId">>;
