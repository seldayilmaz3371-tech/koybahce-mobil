/**
 * Bakım Domain Tipleri
 * =======================
 * bkz. Module 5 Technical Blueprint (Onaylandı, 2026-07-16, Revizyon
 * 2 — Entity Genişletilebilirliği).
 *
 * REVİZYON 2 — MERKEZİ ENUM: `MaintenanceType`/`MaintenanceStatus`,
 * `as const` nesneleri (gerçek `enum` DEĞİL — `tsconfig.app.json`'daki
 * `erasableSyntaxOnly: true` zorunlu kılıyor, ADR 0017 ile tutarlı
 * desen). Uygulamanın TAMAMI (Repository, Form, Screen) bu sabitleri
 * kullanır — hiçbir yerde "magic string" yazılmaz. SQLite `CHECK`
 * kısıtındaki değerlerle (`schema.ts` Sürüm 8) BİREBİR eşleşir — tek
 * doğruluk kaynağı.
 *
 * REVİZYON 1 — ENTITY GENİŞLETİLEBİLİRLİĞİ: Bugün `MaintenanceRecord`
 * hiçbir Observation/Photo/Inventory/Finance/AI alanı İÇERMİYOR
 * (YAGNI korundu — Blueprint'in kendi talimatı: "bugün kullanılmayacak
 * alanlar eklenmeyecek"). Bu gelecekteki ilişkiler, ADR 0005'in
 * additive migration deseniyle (yeni nullable FK sütunları) sancısız
 * eklenebilir — Photo modülünün AI metadata kararıyla (backlog #12)
 * birebir aynı emsal, burada tekrar edilmiyor.
 */

export const MaintenanceType = {
  Irrigation: "irrigation",
  Fertilization: "fertilization",
  Pesticide: "pesticide",
  Pruning: "pruning",
  SoilPreparation: "soil_preparation",
  PreHarvestCare: "pre_harvest_care",
  Other: "other",
} as const;

export type MaintenanceTypeValue = (typeof MaintenanceType)[keyof typeof MaintenanceType];

export const MaintenanceStatus = {
  Planned: "planned",
  Completed: "completed",
  Cancelled: "cancelled",
} as const;

export type MaintenanceStatusValue = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

export interface MaintenanceRecord {
  id: string;
  parcelId: string;
  /** nullable — bir bakım kaydı parsel geneli olabilir (Observation/Finance'teki tree_id nullable deseniyle tutarlı). */
  treeId: string | null;
  maintenanceType: MaintenanceTypeValue;
  status: MaintenanceStatusValue;
  /** nullable — sadece `status: planned` için anlamlı bir tarih taşır. */
  scheduledDate: string | null;
  /** nullable — sadece `status: completed` için doldurulur. */
  completedDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewMaintenanceRecordInput {
  parcelId: string;
  treeId?: string | null;
  maintenanceType: MaintenanceTypeValue;
  status?: MaintenanceStatusValue;
  scheduledDate?: string | null;
  completedDate?: string | null;
  notes?: string | null;
}

export type MaintenanceRecordUpdateInput = Partial<Omit<NewMaintenanceRecordInput, "parcelId" | "treeId">>;

/** bkz. `IMaintenanceRepository.update()` — durum geçmişi asla UI'dan yazılmaz (Revizyon 4). */
export interface MaintenanceStatusLogEntry {
  id: string;
  maintenanceRecordId: string;
  previousStatus: MaintenanceStatusValue | null;
  newStatus: MaintenanceStatusValue;
  changedAt: string;
}

/**
 * Bakım Planı — Sprint 5.4
 * ===========================
 * bkz. Module 5 Technical Blueprint. `maintenanceType`, YUKARIDAKİ
 * `MaintenanceType` sabitini TEKRAR KULLANIYOR (DRY, Kural 8) — kayıt
 * (`MaintenanceRecord`) ve plan (`MaintenancePlan`) AYNI tür
 * kümesini paylaşıyor.
 *
 * BİLİNÇLİ SADELİK: SADECE `intervalDays` (gün cinsinden basit
 * aralık) — RRULE/Cron/Calendar Engine YOK (Blueprint'in YAGNI
 * talimatı). Bu, bir PLAN'ın "ÇALIŞTIRILMASI" (görev üretme,
 * hatırlatma) İÇİN DEĞİL, SADECE plan BİLGİSİNİ saklamak içindir —
 * çalıştırma motoru bu sprintin AÇIKÇA kapsamı DIŞINDA.
 */
export interface MaintenancePlan {
  id: string;
  parcelId: string;
  /** nullable — bir plan parsel geneli olabilir (kayıtlarla tutarlı desen). */
  treeId: string | null;
  maintenanceType: MaintenanceTypeValue;
  /** Gün cinsinden basit aralık — ör. 7 = haftalık, 30 = aylık. */
  intervalDays: number;
  /** Bir sonraki uygulamanın planlandığı tarih (ISO 8601). */
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewMaintenancePlanInput {
  parcelId: string;
  treeId?: string | null;
  maintenanceType: MaintenanceTypeValue;
  intervalDays: number;
  nextDueDate: string;
}

export type MaintenancePlanUpdateInput = Partial<Omit<NewMaintenancePlanInput, "parcelId" | "treeId">>;
