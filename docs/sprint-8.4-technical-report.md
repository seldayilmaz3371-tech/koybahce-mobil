# Sprint 8.4 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Dashboard Modülü — Hook + Screen

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

- `src/modules/dashboard/hooks/useDashboardSummary.ts` — mevcut `parcelRepository`/`treeRepository`/`maintenancePlanRepository`/`observationRepository`/`harvestRepository`'nin `listByParcel` metotlarını `Promise.all` ile TÜM parseller için paralel çalıştırıp JS tarafında birleştiren bir hook.
- `src/modules/dashboard/DashboardScreen.tsx` — özet kartları.
- `dashboard.*` i18n anahtarları EN/TR'ye eklendi.
- **9 yeni test** (6 hook, 3 screen) — **gerçekten çalıştırıldı**, hepsi geçti.
- `npx tsc -b`, `npm run test` (534/534), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Kod Öncesi Gerçek Bulgu

Hiçbir repository'de "TÜM parseller genelinde" bir GLOBAL sorgu olmadığı doğrulandı (`observation.repository.interface.ts`, `maintenancePlan.repository.interface.ts` gerçekten okunarak) — Parcel/Tree/MaintenancePlan/Observation/Harvest repository'lerinin hepsi `listByParcel`/`listByTree` (dual-scope) deseninde. Bu, Dashboard'ın **Hook seviyesinde birleştirme** yaklaşımını gerekli kıldı (repository katmanına dokunmadan).

## ÖNERİ

- Dashboard'ın navigasyonu (yeni ana ekran mı, yoksa Parseller ekranına ek bir giriş mi) için kullanıcı kararı gerekiyor.
- Roadmap'in sıradaki adımı: Sprint 9.1-9.2 (Fotoğraf Analizi) veya kullanıcının belirleyeceği başka bir öncelik.

## VARSAYIM

Hiçbiri. `MaintenancePlan`'ın `create()` metodunun `maintenanceType`'ı zorunlu kıldığı, ilk test taslağımda eksikti — gerçek `domain/maintenance.types.ts` dosyası okunarak düzeltildi.

## Bilinen Sınır (Gerçek, Kayıtlı — Spekülatif Değil)

`parcelRepository.list()`'in varsayılan limiti (50) aşılırsa Dashboard eksik gösterir. Bugün bir sorun DEĞİL (Beta aşaması) — gerçek bir ölçek sorunu ortaya çıkarsa, gerçek bir özet-sorgu repository metodu değerlendirilmelidir (YAGNI, bugün eklenmedi).

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Repository Pattern bozulmadı | ✅ — Hiçbir repository değişmedi, sadece mevcut metotlar Hook'ta birleştirildi |
| Offline First bozulmadı | ✅ |
| SQLite şeması keyfi değişmedi | ✅ — Bu sprintte hiçbir migration yok |
| Yeni mimari kategori üretilmedi | ✅ — Roadmap'in kendi notuyla tutarlı |
| Mevcut ortak bileşenler kullanıldı | ✅ — `status-card`/`parcel-list` deseni, `formatDate`, mevcut Error Code Standard |
| Uydurma özellik eklenmedi | ✅ — Hava Durumu/Fotoğraf Analizi/Raporlar'a bağlı hiçbir öge yok |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: Mevcut repository'lerin Hook seviyesinde birleştirilmesi, yeni bir mimari karar değil — roadmap'in kendi notuyla ("yeni bir mimari kategori GEREKMİYOR") tutarlı.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (534/534, +9), bundle boyutu (+0.57kB) ve commit hash (`1ce38d8`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Dashboard'ın veri/UI katmanı tamamlandı ve gerçek verilerle test edildi. Navigasyon kararı (App.tsx'in varsayılan rotasını etkileyebileceği için) kullanıcı onayı bekliyor — tek taraflı yapılmadı.
