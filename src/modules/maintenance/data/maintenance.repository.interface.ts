/**
 * Bakım Repository Sözleşmesi
 * ==============================
 * bkz. Module 5 Technical Blueprint (Onaylandı), Revizyon 3 — Referans
 * Ağaç: "Repository arayüzü ileride genişletilebilir tasarlanacaktır."
 *
 * `listByParcel`/`listByTree` — Finance/Observation ile aynı dual-scope
 * desen. `maintenanceType`/`fromDate`/`toDate`, Blueprint'in AÇIKÇA
 * istediği filtreler — bugün ERTELENMEDİ (Observation'ın backlog #8'i
 * gibi), çünkü bu revizyon repository katmanının BUGÜN bunu doğal
 * olarak desteklemesini talep ediyor.
 *
 * "Bir referans ağacın bakım geçmişi" İÇİN AYRI BİR METOD YOK —
 * `listByTree(treeId)` zaten HERHANGİ bir ağaç (referans olsun
 * olmasın) için çalışıyor, referans ağaçlar sadece `is_reference_tree
 * = 1` işaretli normal `Tree` satırları (Modül 2'den beri). Gereksiz
 * bir soyutlama eklemek Kural 4/YAGNI ihlali olurdu.
 */

import type {
  BulkCreateMaintenanceRecordsInput,
  MaintenanceRecord,
  MaintenanceRecordUpdateInput,
  MaintenanceTypeValue,
  NewMaintenanceRecordInput,
} from "../domain/maintenance.types";

export interface MaintenanceListOptions {
  /** Varsayılan true — pasife alınmış kayıtlar listelenmez. */
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  /** Belirli bir bakım türüne göre filtreler (Revizyon 3). */
  maintenanceType?: MaintenanceTypeValue;
  /** `scheduled_date` veya `completed_date` (hangisi doluysa) bu tarihten SONRA olan kayıtlar (dahil). */
  fromDate?: string;
  /** `scheduled_date` veya `completed_date` (hangisi doluysa) bu tarihten ÖNCE olan kayıtlar (dahil). */
  toDate?: string;
}

export interface IMaintenanceRepository {
  /** Bir parseldeki TÜM bakım kayıtları (ağaç-özel olanlar dahil — Finance'teki gerekçeyle aynı: parsel özeti toplamı göstermeli). */
  listByParcel(parcelId: string, options?: MaintenanceListOptions): Promise<MaintenanceRecord[]>;
  /** Sadece belirli bir ağaca bağlı bakım kayıtları (referans ağaçlar dahil — özel bir ayrım yok). */
  listByTree(treeId: string, options?: MaintenanceListOptions): Promise<MaintenanceRecord[]>;
  getById(id: string): Promise<MaintenanceRecord | null>;
  create(input: NewMaintenanceRecordInput): Promise<MaintenanceRecord>;
  /**
   * bkz. Sprint 10.1 (Saha Operasyonları Paketi). "Toplu Sulama/
   * Gübreleme/İlaçlama/Budama" — `input.maintenanceType` parametresiyle
   * TEK bir mekanizma. `input.treeIds`'teki HER ağaç için TEK bir
   * transaction içinde `create()` çağrılır — `create()`'in KENDİ
   * audit-log mantığı (`maintenance_status_log`) HER kayıt için DOĞAL
   * olarak tetiklenir (özel bir ek mantık GEREKMEZ).
   */
  createMany(input: BulkCreateMaintenanceRecordsInput): Promise<MaintenanceRecord[]>;
  /**
   * `changes.status` mevcut durumdan FARKLIYSA, `maintenance_status_log`'a
   * otomatik bir satır eklenir — TEK transaction içinde (Revizyon 4:
   * bu davranış UI katmanından TETİKLENMEZ, her zaman burada olur).
   */
  update(id: string, changes: MaintenanceRecordUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
  /**
   * bkz. Sprint 10.2 (Toplu İşlemler "Geri Al" özelliği). `createMany()`'nin
   * BİREBİR AYNI deseni — soft-delete, fiziksel SİLME DEĞİL.
   */
  deactivateMany(ids: string[]): Promise<void>;
}
