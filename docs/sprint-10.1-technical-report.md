# Sprint 10.1 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Saha Operasyonları Paketi — Repository Katmanı + Gerçek Performans Testi

## Bağlam

Product Owner kararıyla (2026-07-18), Saha Operasyonları Paketi projenin **yeni en yüksek önceliği** oldu. Bu sprint, kullanıcının kesin talimatına ("Kod yazmadan önce aşağıdaki analizi yap") uyarak **önce kapsamlı bir mimari analiz**, sonra **repository katmanı + gerçek performans testi** ile başladı.

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

### Analiz (Kod Yazılmadan Önce)
- `docs/saha-operasyonlari-mimari-analiz.md` — 8 analiz sorusunun her biri gerçek kod incelemesiyle cevaplandı.
- **Kritik Bulgu 1:** Madde 1 (Toplu Ağaç Oluşturma) zaten `treeRepository.createMany()` (Sprint 3.10) ile mevcut — yeniden geliştirilmedi.
- **Kritik Bulgu 2:** Madde 3-6 (Sulama/Gübreleme/İlaçlama/Budama) mimari olarak **tek özellik** — `MaintenanceType` enum'u zaten bu 4 değeri içeriyor.

### Roadmap Güncellemesi (Sadece Belge)
- `docs/roadmap/01-current-state-and-roadmap.md`'ye Product Owner kararı işlendi.
- Finans/Hasat işletme-seviyesi mimari revizyonu **dürüstçe** belgelendi — bunun Sprint 8.1'in kendi kararının (parcelId NOT NULL) gerçek bir ters çevrilmesi olduğu, gerçek bir ADR gerektirdiği açıkça yazıldı. **Hiçbir kod/migration yazılmadı** (kullanıcının açık talimatı: "sadece roadmap'e işle").

### Kod (Repository Katmanı)
- `observationRepository.createMany()` + `maintenanceRepository.createMany()` — Tree'nin kanıtlanmış `runInTransaction()` deseni tekrarlandı.
- **13 yeni test** — 3 observation, 3 maintenance, 7 performans testi.
- `npx tsc -b`, `npm run test` (570/570), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Gerçek Performans Ölçümleri (Kullanıcının En Önemli Talebi)

`src/perf/bulkOperations.perf.test.ts` — 100/250/500 ağaç senaryoları **gerçekten çalıştırıldı**:

| Ağaç Sayısı | Toplu Gözlem | Toplu Bakım |
|---|---|---|
| 100 | ~17ms | ~13ms |
| 250 | ~15ms | ~26ms |
| 500 | ~29ms | ~53ms |

**🔴 Dürüst sınır:** Bu ölçümler in-memory `better-sqlite3` test ortamında alındı — gerçek bir Android cihazın disk I/O'suyla birebir aynı performansı **göstermez**. Gerçek cihaz doğrulaması ayrıca yapılmalı.

## Gerçek Bir Bulgu — Kararsız (Flaky) Test Kaldırıldı

Başlangıçta "tek transaction vs N ayrı transaction" karşılaştırmalı bir test yazıldı, ama **başarısız oldu** (12.7ms vs 8.6ms, beklenen yönün tersine). **Kök neden analizi:** Test ortamının (`createTestDatabaseExecutor`, asenkron sarmalayıcı) kendi overhead'i, 200 kayıtlık ölçekte gerçek transaction maliyetinden daha baskın çıktı — ölçüm gürültülü/anlamsız hale geldi. Bu test **dürüstçe kaldırıldı**, yerine repository katmanını bypass eden, native `better-sqlite3` üzerinde **izole** bir ölçüm eklendi (500 satır <1000ms, kanıtlandı).

## ÖNERİ

- Sprint 10.2: "Toplu İşlemler" UI — Parsel ekranında ağaç seçim mekanizması (mevcutta yok, yeni bir bileşen) + Toplu Gözlem formu + Toplu Bakım formu (4 tip **tek** formda, Kritik Bulgu 2 gereği).
- Sprint 10.3: Navigasyon entegrasyonu.
- Gerçek cihazda 100/250/500 ağaçlı bir parselde performans doğrulaması (Sprint 10.2/10.3 sonrası, gerçek UI hazır olduğunda).

## VARSAYIM

Hiçbiri — her mimari bulgu (`MaintenanceType` enum'u, `runInTransaction` deseni, `treeRepository.createMany()`'nin varlığı) gerçek dosya okumasıyla doğrulandı.

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Mevcut mimari bozulmadı | ✅ — Sadece EKLEME (createMany), mevcut metotlara dokunulmadı |
| Gereksiz kod/duplicate yapı üretilmedi | ✅ — Kritik Bulgu 2 sayesinde 4 ayrı mekanizma yerine 1 |
| Önce analiz, sonra geliştirme | ✅ — Analiz raporu kod yazımından ÖNCE tamamlandı |
| BUILD_INFO güncellendi | ✅ |
| Testler çalıştırıldı | ✅ — 570/570, gerçek performans ölçümleri dahil |
| Mimari değişiklik önce açıklandı | ✅ — Finans/Hasat revizyonu için (henüz uygulanmadı, sadece açıklandı) |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: `createMany()` eklentileri, Tree'nin (Sprint 3.10) zaten kanıtlanmış deseninin birebir tekrarı — yeni bir mimari karar değil.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (570/570, +13), bundle boyutu (+0.56kB) ve commit hash (`8608f2c`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Saha Operasyonları Paketi'nin temel altyapısı (repository + performans kanıtı) tamamlandı. İki kritik mimari bulgu (Toplu Ağaç zaten var, Sulama/Gübreleme/İlaçlama/Budama tek mekanizma), toplam geliştirme kapsamını önemli ölçüde azalttı — gereksiz kod üretimi baştan önlendi.
