/**
 * Finans Domain Tipleri
 * ========================
 * bkz. Modül 4 Mimari Onayı (2026-07-15), Sprint 4.3.1 (para birimi
 * düzeltmesi — bkz. `money.ts`).
 *
 * record_type SADECE 'cost' | 'sale' — hasat (fiziksel miktar/verim:
 * kg/adet/kalite/randıman) BİLEREK burada YOK, gelecekteki ayrı bir
 * Hasat modülüne bırakıldı (Modül 4 Ön Analizi, kullanıcı onayı).
 *
 * `amountMinor` — KURUŞ cinsinden TAM SAYI (asla ondalık/kayan nokta
 * DEĞİL). Sprint 4.3.1'de `amount: number` (REAL/kayan nokta)
 * yerine geçti — bkz. `money.ts` başlığındaki gerekçe. UI katmanı
 * `toMinorUnits`/`toMajorUnits` ile dönüştürür, hiçbir yerde doğrudan
 * `* 100` yapılmaz.
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
  /** KURUŞ cinsinden TAM SAYI. Kullanıcıya göstermeden önce `toMajorUnits()` ile TL'ye çevirin. */
  amountMinor: number;
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
  /** KURUŞ cinsinden TAM SAYI — formdan TL girilir, `toMinorUnits()` ile burada verilmeden ÖNCE dönüştürülür. */
  amountMinor: number;
  recordDate: string;
  notes?: string | null;
}

export type FinanceRecordUpdateInput = Partial<Omit<NewFinanceRecordInput, "parcelId" | "treeId">>;
