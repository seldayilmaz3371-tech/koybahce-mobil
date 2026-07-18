# Saha Operasyonları Paketi — Kod Öncesi Mimari Analizi

**Tarih:** 2026-07-18 · **Kural:** Kod yazmadan önce zorunlu analiz.

## 🔴 Kritik Bulgu 1 — Madde 1 (Toplu Ağaç Oluşturma) Zaten Mevcut

`treeRepository.createMany()` (Sprint 3.10) **zaten tam olarak istenen özelliği** karşılıyor: aynı parsele, otomatik numaralandırmayla (`startNumber`+`count`), tek bir transaction içinde toplu ağaç oluşturma. `BulkTreeCreateForm.tsx` UI'ı da zaten var. **Bu maddede hiçbir yeni geliştirme gerekmiyor.**

## 🔴 Kritik Bulgu 2 — Madde 3-6 (Sulama/Gübreleme/İlaçlama/Budama) Mimari Olarak TEK Özellik

`MaintenanceType` enum'u (`src/modules/maintenance/domain/maintenance.types.ts`) **zaten** `irrigation`/`fertilization`/`pesticide`/`pruning` değerlerini içeriyor. "Toplu Sulama", "Toplu Gübreleme", "Toplu İlaçlama", "Toplu Budama" **4 ayrı özellik değil** — **tek bir "Toplu Bakım Kaydı Oluşturma" mekanizmasının** (`maintenanceType` parametresiyle) 4 kullanım biçimidir. Bu, geliştirme kapsamını **4 ayrı repository/UI'dan 1 ortak mekanizmaya** indiriyor — gereksiz kod tekrarını baştan önlüyor.

## Mevcut Batch/Transaction Deseni (Yeniden Kullanılacak)

`BaseRepository.runInTransaction()` (Sprint 3.10.1 kök neden düzeltmesi) **gerçek** bir native transaction kullanıyor (`db.beginTransaction()`/`commitTransaction()`/`rollbackTransaction()`, `execute()`'un `transaction` parametresi doğru yönetiliyor — dıştaki transaction'a katılma). `treeRepository.createMany()` bu deseni **döngü içinde `create()` çağırarak** kullanıyor — gerçek bir "multi-row INSERT" değil, ama tek transaction içinde çoklu insert, SQLite'ın asıl maliyeti olan "her INSERT ayrı commit" sorununu zaten çözüyor.

## Analiz Soruları — Cevaplar

| Soru | Cevap |
|---|---|
| Veri modeli yeterli mi? | **Evet** — `observations`/`maintenance_records` şemaları zaten `parcelId`+`treeId?` (dual-scope) destekliyor. Toplu oluşturma, AYNI şemaya BİRDEN FAZLA satır yazmaktan ibaret. |
| Migration gerekiyor mu? | **Hayır** — hiçbir şema değişikliği gerekmiyor. |
| Repository değişmeli mi? | **Evet, ama sadece EKLEME** — `IObservationRepository`/`IMaintenanceRepository`'ye `createMany()` eklenecek (Tree'nin deseniyle birebir aynı), mevcut metotlara dokunulmayacak. |
| Yeni servis gerekiyor mu? | **Hayır** — repository seviyesinde yeterli, AI Session gibi ayrı bir servis katmanı gerekmiyor. |
| Batch insert mimarisi nasıl olmalı? | `runInTransaction()` içinde döngü — Tree'nin KANITLANMIŞ deseni. |
| SQLite performansı yeterli mi? | **Doğrulanmadı, bu sprintte GERÇEKTEN test edilecek** (100/250/500 senaryosu, aşağıya bkz.). |
| Offline kullanım etkileniyor mu? | **Hayır** — tamamen yerel SQLite işlemi, ağ bağımlılığı yok. |
| UI sadeleştirilebilir mi? | **Evet** — Madde 3-6'nın TEK bir "Toplu Bakım Kaydı" formuna indirilmesi (Bulgu 2), UI karmaşıklığını da azaltıyor. |

## Önerilen Sprint Planı (Gerekçeli)

| Sprint | İçerik | Zorluk | Gerekçe |
|---|---|---|---|
| 10.1 | Repository katmanı: `observationRepository.createMany()` + `maintenanceRepository.createMany()` + **gerçek performans testi** (100/250/500 ağaç senaryosu) | Orta | Önce temel altyapı — Tree'nin Sprint 3.10→3.10.1 aşamalı deseniyle tutarlı |
| 10.2 | "Toplu İşlemler" UI — Parsel ekranında ağaç seçim mekanizması (mevcutta YOK, yeni bir bileşen) + Toplu Gözlem formu + Toplu Bakım formu (4 tip TEK formda) | Zor | Seçim UI'ı gerçek bir yeni bileşen, dikkatli tasarım gerektiriyor |
| 10.3 | Navigasyon entegrasyonu + uçtan uca gerçek test | Orta | Hasat/Dashboard'ın aşamalı yaklaşımıyla tutarlı |

**Bu mesajda Sprint 10.1'e başlanıyor.**
