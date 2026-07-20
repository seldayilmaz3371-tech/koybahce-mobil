# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 10 — Saha Operasyonları (Toplu İşlemler) |
| **Sprint** | 10.4 — Beta UX / Saha Geri Bildirimleri Sprinti |
| **Feature** | Geriye Dönük Tarih/Saat (Toplu Gözlem/Bakım) + Sulama Başlangıç/Bitiş Saati |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 635/635 başarılı (+28 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 429.66kB → 432.47kB (+2.81kB, makul) |
| **Lint** | ✅ 0 uyarı/hata (224 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | **12** (11'den yükseltildi — `maintenance_records.start_time`/`end_time`, additive, ADR 0005 deseni) |
| **Tarih** | 2026-07-19 |
| **Git Commit** | `84bd8e2` |
| **ADR** | Yeni ADR yazılmadı — mevcut migration/form deseninin (ADR 0005) genişletmesi |

## Migration Bilgileri

**Şema Sürüm 12:** `ALTER TABLE maintenance_records ADD COLUMN start_time TEXT;` + `ALTER TABLE maintenance_records ADD COLUMN end_time TEXT;` — additive, nullable, mevcut veri **hiç etkilenmez**. 4 migration testi + 32 mevcut repository testi ile geriye dönük uyumluluk kanıtlandı.

## Mimari Analiz Sonucu

- **Madde 1 (geriye dönük tarih/saat):** Migration **gerekmedi** — `observations.observed_at`/`maintenance_records.completed_date` zaten esnek TEXT sütunlar, sadece formlar şimdiye kadar `new Date()`'i otomatik/düzenlenemez kullanıyordu.
- **Madde 2 (Sulama süresi):** Migration **gerekti** — `start_time`/`end_time` hiç yoktu. Toplam süre **veritabanına kaydedilmiyor** (türetilebilir değer, YAGNI) — sadece UI'da canlı hesaplanıyor.

## Gerçek Bulgular (Kod Yazarken Bulunup Düzeltildi)

1. `combineDateAndTimeToIso`'da yerel saat değerine yanlışlıkla "Z" (UTC) etiketi yapıştırılıyordu — saat dilimi kayması yaratırdı. `Date` nesnesinin yerel yorumlayan constructor'ı kullanılarak düzeltildi.
2. `BulkMaintenanceForm`'da `completedDate`'e saat bilgisi kırpılarak yazılıyordu — kullanıcının "saat de girilsin" isteğini karşılamıyordu.

## Dosya Değişiklikleri

- `src/data/db/migrations/schema.ts` — Şema Sürüm 12
- `src/modules/maintenance/domain/maintenance.types.ts` — `startTime`/`endTime` alanları
- `src/modules/maintenance/data/maintenance.repository.ts` — INSERT/UPDATE/row-mapping güncellemesi
- `src/shared/utils/dateInputConversion.ts` — 4 yeni yardımcı fonksiyon (mevcut fonksiyonlara dokunulmadı)
- `src/shared/utils/durationCalculation.ts` — YENİ dosya
- `src/shared/components/form/TimeField.tsx` — YENİ bileşen
- `src/modules/bulkOperations/BulkObservationForm.tsx` + `BulkMaintenanceForm.tsx` — tarih/saat + Sulama süresi UI'ı

## Gelecek Sprint Önerileri

(Bu sprintte kodlanmadı — kullanıcının talimatı gereği sadece burada listeleniyor.)

- UX öz-denetiminin (Sprint 10.3) önceliklendirdiği maddeler hâlâ bekliyor (Undo görsel vurgusu).
- Tekli Bakım Kaydı formu (`MaintenanceRecordForm`) henüz Sulama Başlangıç/Bitiş Saati'ni desteklemiyor — sadece Toplu formlar güncellendi (kullanıcının açık kapsamı).
- Gece yarısını geçen sulama senaryosu (`calculateDuration`'ın bilinçli sınırı) — gerçek bir ihtiyaç görülürse ele alınabilir.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.3 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (ilk akış) | ✅ Onaylandı |
| Modül 10 — Saha Operasyonları (Sprint 10.4) | 🟡 Bu teslimat |
