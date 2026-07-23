/**
 * Bakım Planı Repository Sözleşmesi
 * ====================================
 * bkz. Sprint 5.4. `IMaintenanceRepository` ile AYNI dual-scope desen
 * (Kural 12).
 *
 * GÜNCELLEME (Sprint 5.5): Sprint 5.4'te "bugün için böyle bir talep
 * yok, YAGNI" diyerek ERTELEDİĞİMİZ filtre ihtiyacı, TAM OLARAK bu
 * sprintte gerçek hale geldi — `dueStatus` eklendi (Yaklaşan/Geciken
 * görünümü). Bu, YAGNI ilkesinin nasıl çalışması gerektiğinin gerçek
 * bir örneği: spekülatif olarak ÖNCEDEN eklenmedi, gerçek ihtiyaç
 * doğunca eklendi.
 */

import type { MaintenancePlan, MaintenancePlanUpdateInput, NewMaintenancePlanInput } from "../domain/maintenance.types";

export type MaintenancePlanDueStatus = "overdue" | "today" | "upcoming";

export interface MaintenancePlanListOptions {
  /** Varsayılan true — pasife alınmış planlar listelenmez. */
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  /**
   * Sprint 5.5 — `next_due_date`'e göre filtreler. `referenceDate`
   * ile BİRLİKTE kullanılır (biri verilirse diğeri de ZORUNLU).
   */
  dueStatus?: MaintenancePlanDueStatus;
  /**
   * "Bugün" hangi tarih kabul edilsin (`YYYY-MM-DD`). Repository
   * KENDİ `new Date()`'ini ÜRETMEZ — çağırandan (Hook) alır. Bu,
   * repository'yi deterministik ve test edilebilir tutar (Kural 30 —
   * varsayımla değil, verilen veriyle çalışır).
   */
  referenceDate?: string;
}

export interface IMaintenancePlanRepository {
  /** Bir parseldeki TÜM planlar (ağaç-özel olanlar dahil — Finance/Maintenance Record'daki gerekçeyle aynı). */
  listByParcel(parcelId: string, options?: MaintenancePlanListOptions): Promise<MaintenancePlan[]>;
  /** Sadece belirli bir ağaca bağlı planlar. */
  listByTree(treeId: string, options?: MaintenancePlanListOptions): Promise<MaintenancePlan[]>;
  /**
   * bkz. Sprint 10.19 (Bildirimler — Bakım Hatırlatmaları). Sistemdeki
   * TÜM aktif planları (herhangi bir parsel/ağaç filtresi OLMADAN),
   * `next_due_date ASC` sıralı döner — SADECE bildirim zamanlama
   * akışının ihtiyacı için (established `photoRepository.listAll()`
   * deseniyle AYNI ilke — dar kapsamlı, açıkça gerekçeli bir ekleme).
   * `DEFAULT_LIST_LIMIT` SINIRI YOK (bildirimler için TÜM aktif
   * planların bilinmesi gerekir).
   */
  listAllActive(): Promise<MaintenancePlan[]>;
  getById(id: string): Promise<MaintenancePlan | null>;
  create(input: NewMaintenancePlanInput): Promise<MaintenancePlan>;
  update(id: string, changes: MaintenancePlanUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
}
