/**
 * Hasat Repository Sözleşmesi
 * ==============================
 * bkz. Sprint 8.1. `listByParcel`/`listByTree` — Finance/Observation/
 * Maintenance ile AYNI dual-scope desen.
 *
 * BİLİNÇLİ FARK (Bakım'a göre): Hasat'ta durum geçişi/audit-log YOK —
 * bir hasat kaydının "planlı/tamamlandı/iptal" gibi bir durumu yok,
 * sadece GERÇEKLEŞMİŞ bir olayın kaydı (miktar+tarih). Bakım'ın
 * `maintenance_status_log` karmaşıklığını buraya KOPYALAMAK YAGNI
 * ihlali olurdu — bugün hiçbir gerçek ihtiyaç YOK.
 */

import type {
  HarvestRecord,
  HarvestRecordUpdateInput,
  NewHarvestRecordInput,
} from "../domain/harvest.types";

export interface HarvestListOptions {
  /** Varsayılan true — pasife alınmış kayıtlar listelenmez. */
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  /** Bu tarihten SONRA olan kayıtlar (dahil). */
  fromDate?: string;
  /** Bu tarihten ÖNCE olan kayıtlar (dahil). */
  toDate?: string;
}

export interface IHarvestRepository {
  /** Bir parseldeki TÜM hasat kayıtları (ağaç-özel olanlar dahil — Finance/Maintenance'teki gerekçeyle aynı: parsel özeti toplamı göstermeli). */
  listByParcel(parcelId: string, options?: HarvestListOptions): Promise<HarvestRecord[]>;
  /** Sadece belirli bir ağaca bağlı hasat kayıtları. */
  listByTree(treeId: string, options?: HarvestListOptions): Promise<HarvestRecord[]>;
  getById(id: string): Promise<HarvestRecord | null>;
  create(input: NewHarvestRecordInput): Promise<HarvestRecord>;
  update(id: string, changes: HarvestRecordUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
}
