# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 10 — Saha Operasyonları (Toplu İşlemler) |
| **Sprint** | 10.4 |
| **Feature** | Geriye Dönük Tarih/Saat + Sulama Başlangıç/Bitiş Saati |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 635/635 başarılı (+28 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 429.66kB → 432.47kB (+2.81kB, makul) |
| **Lint** | ✅ 0 uyarı/hata (224 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | **11 → 12** (yeni migration: `maintenance_records.start_time`/`end_time`, nullable, additive) |
| **Tarih** | 2026-07-19 |
| **Git Commit** | `e9134ee` |
| **ADR** | Yeni ADR yazılmadı — ADR 0005'in additive migration deseninin tekrarı |

## Migration Bilgileri

**Şema Sürüm 12** — `ALTER TABLE maintenance_records ADD COLUMN start_time TEXT;` + `ALTER TABLE maintenance_records ADD COLUMN end_time TEXT;`. Nullable, additive — **mevcut kullanıcı verisi hiç etkilenmedi** (4 migration testiyle kanıtlandı, geriye dönük uyumluluk dahil).

## Mimari Değişiklik Özeti

- **Madde 1 (tarih/saat):** Migration gerekmedi. `combineDateAndTimeToIso()`/`nowAsDateInputValue()`/`nowAsTimeInputValue()`/`isoToTimeInputValue()` yardımcıları `dateInputConversion.ts`'e eklendi. Yeni `TimeField` bileşeni (`DateField` deseninde).
- **Madde 2 (Sulama süresi):** `calculateDuration()` — süre veritabanına kaydedilmiyor, sadece UI'da canlı hesaplanıyor (YAGNI).

## Gerçek Bulgular

1. **İki gerçek hata** kod yazarken (testten önce) bulunup düzeltildi — biri saat dilimi kayması riski taşıyordu, diğeri kullanıcının isteğini (saat bilgisi) karşılamıyordu.
2. **Sprint 5.4'ün belgelediği bir kural** (migration testlerindeki "CURRENT_SCHEMA_VERSION" testinin sadece en güncel dosyada yaşaması) uygulanarak 2 test dosyası güncellendi — regresyon değil, bilinen bir bakım işi.

## Dosya Değişiklikleri (Özet)

**Yeni:** `TimeField.tsx`, `durationCalculation.ts` (+test), `schema-v12-irrigation-time.migration.test.ts`.
**Değiştirilen:** `schema.ts` (Sürüm 12), `maintenance.types.ts`, `maintenance.repository.ts` (+test), `dateInputConversion.ts` (+test), `BulkObservationForm.tsx` (+test), `BulkMaintenanceForm.tsx` (+test), `schema-v8-maintenance.migration.test.ts`, `schema-v11-harvest.migration.test.ts`, `MaintenanceRecordForm.test.tsx`, i18n dosyaları.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.3 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (ilk akış) | ✅ Onaylandı |
| Modül 10 — Saha Operasyonları (Sprint 10.4 dahil) | 🟡 Bu teslimat |
