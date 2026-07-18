# Sprint 10.2 — Toplu İşlemler Gerçek Cihaz Performans Test Planı

**Tarih:** 2026-07-18 · **Kapsam:** 100/250/500 ağaçlı parsellerde toplu işlem performansı — **gerçek Android cihazda**.

**🔴 Kapsam Notu:** Bu, `sprint-6-apk-device-test-plan.md` emsaliyle hazırlanmış bir TEST PLANIDIR — bu ortamda gerçek bir Android cihaz bulunmadığı için TESTLERİN KENDİSİ ÇALIŞTIRILAMADI. Sprint 10.1'in in-memory ölçümleri (500 ağaç için ~29-53ms) gerçek cihaz performansının **yerine geçmez** — bu belge, o boşluğu kapatacak somut bir test protokolü sunuyor.

## Ön Hazırlık

1. En az 3 test parseli oluşturun: 100, 250, 500 ağaçlı (Toplu Ağaç Oluşturma — Sprint 3.10 — ile hızlıca oluşturulabilir).
2. Cihaz: gerçek bir Android telefon, orta seviye donanım tercih edilir (bütçe/orta segment bir cihaz, "en iyi senaryo" değil "gerçekçi senaryo" ölçmek için).
3. `adb logcat` açık tutulmalı (donma/ANR — Application Not Responding — belirtilerini yakalamak için).

## Test Senaryoları

### PERF-BULK-001 — Toplu Gözlem, "Tüm Ağaçlara Uygula", 100 ağaç
**Adımlar:** Toplu İşlemler → Toplu Gözlem → Tüm Ağaçlara Uygula → Uygula → Onayla.
**Beklenen:** İşlem **10 saniyeden kısa** sürede tamamlanmalı, UI **donmamalı** (buton tıklandıktan sonra spinner/loading göstergesi görünmeli — bu, Sprint 10.2'nin `isSubmitting` state'i tarafından ZATEN sağlanıyor, gerçek cihazda GÖRSEL olarak doğrulanmalı).
**Ölçüm:** Butona basıştan "N kayıt oluşturuldu" mesajına kadar geçen süre (stopwatch veya `adb logcat` zaman damgası).

### PERF-BULK-002 — Toplu Gözlem, 250 ağaç
Aynı senaryo, 250 ağaç. **Beklenen:** 15 saniyeden kısa.

### PERF-BULK-003 — Toplu Gözlem, 500 ağaç
Aynı senaryo, 500 ağaç. **Beklenen:** 30 saniyeden kısa (kullanıcının UX hedefi: "50-500 ağacı 30-60 saniye içinde işaretleyip tamamlama" — bu süre, İŞLEMİN KENDİSİNİ, ağaç İŞARETLEME süresini İÇERMEZ, sadece "Uygula"ya bastıktan SONRAKİ veritabanı işlemini ölçer).

### PERF-BULK-004 — Toplu Bakım (Sulama), 500 ağaç
Aynı senaryo, `maintenanceRepository.createMany()` için — Observation'dan biraz daha fazla sütun içerdiği için AYRI ölçülmeli.

### PERF-BULK-005 — Ağaç Seçerek Uygula, 500 ağaçtan 50'sini işaretleme
**Amaç:** Checkbox listesinin KENDİSİNİN (500 satırlık bir liste render etmenin) UI performansını ölçmek — bu, Sprint 10.1'in ölçmediği YENİ bir boyut (repository DEĞİL, React render performansı).
**Beklenen:** Liste açılışı 2 saniyeden kısa, her checkbox tıklaması ANINDA (100ms altı) tepki vermeli.
**🔴 Bilinen risk:** `TreeSelectorList`'in bugünkü implementasyonu **hiçbir sanallaştırma (virtualization) İÇERMİYOR** — 500 satırlık bir liste TAMAMEN DOM'a render ediliyor. Bu, GERÇEK bir performans riski olabilir, gerçek cihazda MUTLAKA doğrulanmalı. Sorun çıkarsa, bir sonraki sprintte `react-window` benzeri bir sanallaştırma değerlendirilebilir (YAGNI — bugün spekülatif olarak eklenmedi).

### PERF-BULK-006 — Geri Al (Undo), 500 kayıt
**Adımlar:** 500 ağaca toplu işlem uygula → sonuç ekranında "Geri Al"a bas.
**Beklenen:** 30 saniyeden kısa, tüm kayıtlar GERÇEKTEN pasife alınmalı (Toplu Gözlem/Bakım ekranına dönüp "0 kayıt" görülerek doğrulanmalı).

### PERF-BULK-007 — ANR (Application Not Responding) Kontrolü
**Amaç:** 500 ağaçlık bir transaction'ın Android'in ana thread'ini BLOKE EDİP ETMEDİĞİNİ doğrulamak.
**🔴 Bilinen risk:** `runInTransaction()`, native SQLite eklentisinin (`@capacitor-community/sqlite`) kendi async API'sini kullanıyor — teorik olarak ana thread'i BLOKE ETMEMELİ, ama bu GERÇEK cihazda DOĞRULANMADI. Eğer 500 ağaçlık bir işlemde ANR uyarısı (Android'in kendi "Uygulama Yanıt Vermiyor" diyalogu) çıkarsa, bu KRİTİK bir bulgu olur ve ayrı bir hotfix sprinti gerektirir.

## Test Sonuçlarının Raporlanması

Her senaryo için: **Gerçekten çalıştırıldı mı?** (Evet/Hayır), **Gerçek ölçülen süre**, **ANR/donma gözlendi mi?**, **Ekran görüntüsü/video (varsa)**.

**Bu plan, bu mesajda ÇALIŞTIRILMADI** — kullanıcının kendi cihazında uygulanması gerekiyor, sonuçlar bir sonraki sprintte (10.3 veya ayrı bir doğrulama sprinti) raporlanmalı.
