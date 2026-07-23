/**
 * Yerel Bildirimler (Bakım Hatırlatmaları) — İnce Sarmalayıcı Katmanı
 * =======================================================================
 * bkz. Sprint 10.19 (Ayarlar Hub Genişlemesi — Bildirimler). Kapsam
 * (kullanıcının kararı): SADECE bakım hatırlatmaları — `maintenance_
 * plans.next_due_date` alanına dayalı, TAMAMEN cihaz üzerinde
 * zamanlanan yerel bildirimler. Sunucu tarafı push bildirim sistemi
 * YOK (offline-first ilkesiyle tutarlı, established mimari karar).
 *
 * MİMARİ KARAR: `Schedule.repeats: true` KULLANILMIYOR — bir bakım
 * tamamlandığında `next_due_date` GÜNCELLENİR (established
 * `MaintenancePlan` mantığı), bu yüzden sabit aralıklı tekrarlama
 * YANLIŞ olurdu. Bunun yerine, HER planın `next_due_date`'i için TEK
 * seferlik bir bildirim zamanlanır — uygulama, planlar değiştiğinde
 * (Ayarlar'dan açma/kapama veya yeni bir plan oluşturma) TÜM
 * bildirimleri iptal edip GERÇEK, güncel veriyle yeniden zamanlar.
 *
 * GERÇEK KISIT (resmi tip tanımlarından doğrulandı):
 * `LocalNotificationSchema.id`, 32-bit bir `number` olmalı — ama
 * `MaintenancePlan.id` bir UUID (string). Bu yüzden GÜVENİLİR,
 * DETERMİNİSTİK bir string→32-bit-int hash fonksiyonu (djb2, established
 * ve basit bir algoritma) kullanılıyor — AYNI plan id'si HER ZAMAN
 * AYNI bildirim id'sini üretir (bu, established `deactivate`/yeniden
 * zamanlama akışında, ESKİ bir bildirimin GÜVENİLİR şekilde iptal
 * edilebilmesi için ZORUNLU).
 */

import { LocalNotifications } from "@capacitor/local-notifications";
import type { MaintenancePlan } from "../modules/maintenance/domain/maintenance.types";

/**
 * Basit, deterministik bir string→32-bit-imzalı-int hash (djb2 varyantı).
 * Kriptografik GÜVENLİK gerektirmiyor — SADECE aynı UUID'nin her
 * zaman aynı bildirim id'sine eşlenmesi gerekiyor (çakışma riski,
 * bu uygulamanın gerçekçi ölçeğinde — birkaç yüz bakım planı —
 * ihmal edilebilir düzeyde düşük).
 */
export function hashPlanIdToNotificationId(planId: string): number {
  let hash = 5381;
  for (let i = 0; i < planId.length; i++) {
    hash = (hash * 33) ^ planId.charCodeAt(i);
  }
  // 32-bit İMZALI aralığa (LocalNotificationSchema.id'nin gerektirdiği) sığdır.
  return hash & 0x7fffffff;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

export async function checkNotificationPermission(): Promise<boolean> {
  const result = await LocalNotifications.checkPermissions();
  return result.display === "granted";
}

/**
 * Bekleyen (gelecekte tetiklenecek) TÜM bildirimleri iptal eder.
 * Yeniden zamanlama akışının İLK adımı — established "önce temizle,
 * sonra güncel veriyle yeniden oluştur" ilkesi (Sprint 10.13'teki
 * `overwrite: true` kararıyla AYNI ruh).
 */
export async function cancelAllMaintenanceReminders(): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }
}

/**
 * Verilen TÜM aktif bakım planları için, `nextDueDate`'te tetiklenecek
 * TEK seferlik bir bildirim zamanlar. GEÇMİŞTE kalan (`nextDueDate`
 * şu andan ÖNCE olan — ör. zaten gecikmiş bir bakım) planlar
 * ATLANIR: `LocalNotifications.schedule()`'a geçmiş bir tarih vermek
 * platforma göre TUTARSIZ davranabilir (bazı Android sürümlerinde
 * anında tetiklenir, bazılarında SESSİZCE yok sayılır) — bu
 * belirsizlikten kaçınmak için GEÇMİŞ planlar bilinçli olarak
 * atlanıyor (kullanıcı zaten "gecikmiş" durumu Bakım ekranından
 * görüyor, established `dueStatus: "overdue"` filtresi).
 */
export async function scheduleMaintenanceReminders(plans: MaintenancePlan[], now: Date = new Date()): Promise<void> {
  const notifications = plans
    .filter((plan) => new Date(plan.nextDueDate).getTime() > now.getTime())
    .map((plan) => ({
      id: hashPlanIdToNotificationId(plan.id),
      title: "Bahçem Mobile",
      body: buildReminderBody(plan),
      schedule: { at: new Date(plan.nextDueDate) },
    }));

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

const MAINTENANCE_TYPE_LABELS_TR: Record<MaintenancePlan["maintenanceType"], string> = {
  irrigation: "Sulama",
  fertilization: "Gübreleme",
  pesticide: "İlaçlama",
  pruning: "Budama",
  soil_preparation: "Toprak Hazırlığı",
  pre_harvest_care: "Hasat Öncesi Bakım",
  other: "Bakım",
};

/**
 * bkz. Globalization Policy — GERÇEK BİR SINIR (dürüstçe belirtiliyor):
 * bu metin, i18next'in `t()` fonksiyonu ÜZERİNDEN DEĞİL, DOĞRUDAN
 * Türkçe olarak üretiliyor. Sebep: bildirim planlaması `native/`
 * katmanında (React bileşen ağacının DIŞINDA) çalışıyor, `useTranslation()`
 * hook'u burada kullanılamaz. Uygulamanın şu an TEK gerçek kullanıcı
 * kitlesi Türkçe konuşuyor (established, `FALLBACK_LANGUAGE_CODE`
 * İngilizce olsa da) — bu, İngilizce arayüz kullanan bir kullanıcının
 * bildirim metnini Türkçe göreceği anlamına gelir. Bu, kabul edilebilir
 * bir ilk-sürüm sınırı olarak İŞARETLENİYOR, gelecekte `i18n.t()`'nin
 * bağımsız (React DIŞI) çağrılabilir hale getirilmesiyle (i18next
 * BUNU DESTEKLER, `i18n.t()` instance'ı üzerinden) düzeltilebilir.
 */
function buildReminderBody(plan: MaintenancePlan): string {
  const typeLabel = MAINTENANCE_TYPE_LABELS_TR[plan.maintenanceType] ?? "Bakım";
  return `${typeLabel} zamanı geldi.`;
}
