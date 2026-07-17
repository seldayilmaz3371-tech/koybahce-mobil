/**
 * Bakım Planı Repository Sözleşmesi
 * ====================================
 * bkz. Sprint 5.4. `IMaintenanceRepository` ile AYNI dual-scope desen
 * (Kural 12).
 *
 * BİLİNÇLİ FARK (Sprint 5.1'in Revizyon 3'ünden): `MaintenanceListOptions`
 * (kayıtlar için) `maintenanceType`/`fromDate`/`toDate` filtreleri
 * TAŞIYORDU çünkü o revizyon BUNU AÇIKÇA istemişti. Bu sprint (5.4)
 * için böyle bir talep YOK — Blueprint'in tekrarlanan YAGNI vurgusu
 * gereği, planlar için SADECE `activeOnly`/`limit`/`offset` sağlanıyor.
 * Gerçek bir ihtiyaç doğarsa (ör. "sadece sulama planlarını göster"),
 * `MaintenanceListOptions`'taki AYNI desen buraya da eklenebilir —
 * bugün spekülatif olarak eklenmiyor.
 */

import type { MaintenancePlan, MaintenancePlanUpdateInput, NewMaintenancePlanInput } from "../domain/maintenance.types";

export interface MaintenancePlanListOptions {
  /** Varsayılan true — pasife alınmış planlar listelenmez. */
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface IMaintenancePlanRepository {
  /** Bir parseldeki TÜM planlar (ağaç-özel olanlar dahil — Finance/Maintenance Record'daki gerekçeyle aynı). */
  listByParcel(parcelId: string, options?: MaintenancePlanListOptions): Promise<MaintenancePlan[]>;
  /** Sadece belirli bir ağaca bağlı planlar. */
  listByTree(treeId: string, options?: MaintenancePlanListOptions): Promise<MaintenancePlan[]>;
  getById(id: string): Promise<MaintenancePlan | null>;
  create(input: NewMaintenancePlanInput): Promise<MaintenancePlan>;
  update(id: string, changes: MaintenancePlanUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
}
