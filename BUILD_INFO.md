# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 7 — Hasat (Harvest) |
| **Sprint** | 8.1 |
| **Feature** | Migration + Domain + Repository (veri katmanı) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 499/499 başarılı (+16 yeni — 12 repository + 4 migration) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 395.82kB → 396.57kB (+0.75kB, yeni migration/repository kodu, makul) |
| **Lint** | ✅ 0 uyarı/hata (189 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (yeni: `harvest_records`) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `1353f3a` |
| **ADR** | Yeni ADR gerekmedi — mevcut desenlerin (dual-scope repository, soft-delete) doğrudan tekrarı, yeni bir mimari karar YOK |

## Bu Sprintte Yapılanlar (Gerçek, Kanıtlı)

Şema Sürüm 11 (`harvest_records` — `parcel_id` NOT NULL FK, `tree_id` NULLABLE FK, `harvest_date`, `quantity_kg`, `notes`, `is_active`), domain tipleri, `IHarvestRepository` (dual-scope: `listByParcel`/`listByTree`, Finans/Bakım/Gözlem ile aynı desen). **Audit-log/durum geçişi bilinçli olarak eklenmedi** (Hasat, Bakım'dan farklı — sadece gerçekleşmiş bir olayın kaydı).

## Sonraki Sprint

Sprint 8.2: Hook + Form + Screen (Bakım Kaydı'nın Sprint 5.2 deseni).

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-7.5 | ✅ Onaylandı |
| Modül 7 — Hasat, Sprint 8.1 | 🟡 Bu teslimat (veri katmanı) |
