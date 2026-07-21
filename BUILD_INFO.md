# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 10 — Saha Operasyonları (Toplu İşlemler) + Modül 5 (Bakım Yönetimi) |
| **Sprint** | 10.4 Düzeltme Paketi |
| **Feature** | `initialMaintenanceType` Entegrasyonu + Sulama Saati Görüntüleme (Liste + Detay) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 659/659 başarılı (+13 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — **gerçekten çalıştırıldı** |
| **Lint** | ✅ 0 uyarı/hata (224 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **TypeScript Build** | ✅ `tsc -b` temiz — **gerçekten çalıştırıldı** |
| **🔴 Android APK Oluşturma** | ❌ **YAPILAMADI** — bu ortamın network erişim kısıtları (önceki sprintte `services.gradle.org`'a erişimin `HTTP 403` ile reddedildiği doğrulanmıştı) hâlâ geçerli. Bu turda tekrar denenmedi (aynı sonuç kesin, gereksiz tekrar) — dürüstçe "yapılamadı" olarak işaretleniyor. |
| **🔴 Gerçek Cihaz Doğrulaması** | ❌ **YAPILAMADI** — bu ortamda fiziksel bir Android cihaz/emülatör yok. |
| **Şema Sürümü** | 12 (değişmedi — bu düzeltme paketi hiçbir migration içermiyor) |
| **Tarih** | 2026-07-21 |
| **Git Commit** | `dd66e67` |
| **ADR** | Yeni ADR yazılmadı — mevcut desenlerin (lazy initializer, `isIrrigation` koşulu, `TimeField`) tekrarı |

## Sprint 10.4 Düzeltme Paketi — Yapılan İşler

| İş | Zorunlu/İsteğe Bağlı | Durum |
|---|---|---|
| `initialMaintenanceType` entegrasyonu | ZORUNLU | ✅ Tamamlandı — 5 senaryonun tamamı gerçek testle kanıtlandı |
| `MaintenanceRecordCard` Sulama saati gösterimi | ZORUNLU | ✅ Tamamlandı — koşullu, diğer türlerde görsel değişiklik yok |
| `MaintenanceRecordForm` Sulama saati düzenleme | ZORUNLU (risk değerlendirmesi sonucu uygulandı) | ✅ Tamamlandı — düşük risk doğrulandı, migration/yeni abstraction gerekmedi |
| "Biçme→Other" görüntüleme düzeltmesi | İSTEĞE BAĞLI | ❌ **Bilinçli olarak dokunulmadı** — kullanıcının açık talimatı, ayrı bir sprintte değerlendirilecek |

## Kök Neden (Kanıtlanmış)

`BulkOperationsScreen`'in menü seçimi (`initialType`), `BulkMaintenanceForm`'a hiç iletilmiyordu — form her zaman "Sulama" (Irrigation) varsayılanıyla açılıyordu, kullanıcı hangi türe tıklarsa tıklasın. Bu, Sprint 10.4'ün kodunun var olduğu ama kullanıcıya "beklenen şekilde görünmemesinin" tam kanıtlanmış nedeniydi.

## Değişen Dosyalar

| Dosya | Değişiklik Özeti |
|---|---|
| `src/modules/bulkOperations/BulkMaintenanceForm.tsx` | `initialMaintenanceType` prop'u eklendi, `maintenanceType` state'i lazy initializer ile başlatılıyor |
| `src/modules/bulkOperations/BulkOperationsScreen.tsx` | `view.initialType`, `BulkMaintenanceForm`'a gerçekten iletiliyor |
| `src/modules/maintenance/components/MaintenanceRecordCard.tsx` | `startTime`/`endTime` doluysa, saat aralığı `metaText`'e koşullu olarak ekleniyor |
| `src/modules/maintenance/MaintenanceRecordForm.tsx` | `TimeField` ile Sulama saati görüntüleme + düzenleme eklendi (`isIrrigation` koşuluyla) |
| `src/modules/bulkOperations/BulkOperationsScreen.test.tsx` | 5 senaryonun tamamını kanıtlayan parametrized test |
| `src/modules/maintenance/MaintenanceScreen.test.tsx` | Liste saat gösterimi + diğer türlerde gizlilik testleri |
| `src/modules/maintenance/MaintenanceRecordForm.test.tsx` | Detay saat görüntüleme/düzenleme/kaydetme testleri |

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN (Bakım Yönetimi'nin `MaintenanceRecordForm`'u bu pakette genişletildi — dondurma kuralının "kritik hata düzeltmesi" istisnası kapsamında) |
| Sprint 6-10.5 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi | ✅ Onaylandı |
| Modül 10 — Saha Operasyonları (Düzeltme Paketi) | 🟡 Bu teslimat |
