# Sprint 10.4 — Teknik Rapor

**Tarih:** 2026-07-19 · **Kapsam:** Beta UX / Saha Geri Bildirimleri — Geriye Dönük Tarih/Saat + Sulama Başlangıç/Bitiş Saati

## Bağlam

Bu sprint, Sprint 10.3 sonrasında gerçek saha kullanımından gelen **iki spesifik ihtiyaç** için açıldı. Kullanıcının kesin talimatı: "Sadece Sprint 10.3 sonrasında gerçek saha kullanımında ortaya çıkan ihtiyaçları geliştir" — roadmap değiştirilmedi, yeni modül geliştirilmedi, kapsam genişletilmedi.

## Kod Öncesi Mimari Analiz (Kod Yazılmadan Önce Yapıldı)

| Soru | Madde 1 (Tarih/Saat) | Madde 2 (Sulama Süresi) |
|---|---|---|
| Migration gerekiyor mu? | **Hayır** — `observed_at`/`completed_date` zaten esnek TEXT | **Evet** — `start_time`/`end_time` hiç yoktu |
| Veri modeli değişmeli mi? | Hayır (aynı sütun, farklı değer) | Evet (2 yeni nullable sütun) |
| Repository değişmeli mi? | Hayır (zaten parametre alıyordu) | Evet (INSERT/UPDATE/row-mapping) |
| Eski kayıtlar etkileniyor mu? | Hayır | Hayır (nullable, additive) |
| Performans etkileniyor mu? | Hayır | Hayır (2 sütunluk ekleme, index gerekmiyor) |

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

### Migration
`src/data/db/migrations/schema.ts` — Şema Sürüm 12: `ALTER TABLE maintenance_records ADD COLUMN start_time TEXT;` + `ADD COLUMN end_time TEXT;` (additive, ADR 0005 deseni).

### Domain + Repository
`MaintenanceRecord`/`NewMaintenanceRecordInput`/`BulkCreateMaintenanceRecordsInput`'a `startTime`/`endTime` eklendi. `maintenance.repository.ts`'in `create()`/`update()`/`mapRowToMaintenanceRecord()` fonksiyonları güncellendi. `createMany()` zaten `create()`'i çağırdığı için otomatik destekleniyor.

### Yardımcı Fonksiyonlar
- `dateInputConversion.ts`'e **4 yeni fonksiyon eklendi** (`combineDateAndTimeToIso`, `isoToTimeInputValue`, `nowAsDateInputValue`, `nowAsTimeInputValue`) — **mevcut hiçbir fonksiyona dokunulmadı**.
- `durationCalculation.ts` — yeni dosya, `calculateDuration(startTime, endTime)`.

### UI
- `TimeField.tsx` — yeni ortak form bileşeni (`DateField`'in `type="time"` varyantı).
- `BulkObservationForm`/`BulkMaintenanceForm` — `DateField`+`TimeField` eklendi (varsayılan "şimdi", düzenlenebilir). `BulkMaintenanceForm`'a ayrıca, sadece Sulama seçiliyken görünen Başlangıç/Bitiş Saati + canlı süre gösterimi eklendi.

### Testler ve Doğrulama
- **28 yeni test** — 4 migration, 5 repository (`startTime`/`endTime`), 9 `dateInputConversion`, 6 `durationCalculation`, ve `BulkObservationForm`/`BulkMaintenanceForm`'un Sprint 10.4 senaryoları.
- `npx tsc -b`, `npm run test` (635/635), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Gerçek Bulgular (Kod Yazarken Bulunup Düzeltildi)

1. **Saat dilimi hatası:** İlk taslakta `combineDateAndTimeToIso`, kullanıcının yerel saat girdisine doğrudan `"Z"` (UTC) etiketi ekliyordu — bu, saat dilimi farkı kadar bir kaymaya yol açardı (ör. Türkiye'de yerel 08:00 girilirse, yanlışlıkla UTC 08:00 = yerel 11:00 olarak kaydedilirdi). **Kök neden düzeltmesi:** `Date` nesnesinin yerel saat yorumlayan constructor'ı kullanılarak gerçek bir UTC dönüşümü yapıldı, testle doğrulandı (gidiş-dönüş testleri: 4 farklı saat değeri).
2. **Kırpılmış saat bilgisi:** İlk taslakta `BulkMaintenanceForm`, `completedDate`'e `isoToDateInputValue()` uygulayarak saat bilgisini kırpıyordu — kullanıcının "saat de girilsin, saat değiştirilebilsin" isteğini fiilen karşılamıyordu. Düzeltildi.

## Geriye Dönük Uyumluluk (Kanıtlı)

- 4 migration testi, önceki tüm şema sürümlerinin üzerine Sürüm 12'nin sorunsuz uygulandığını kanıtlıyor.
- Mevcut 32 repository testi (Sprint 10.1-10.3'ten) **hiç değişmeden** hâlâ geçiyor — yeni sütunlar mevcut davranışı bozmadı.
- Yeni bir test, `start_time`/`end_time` hiç verilmeden oluşturulan bir kaydın (eski kayıt senaryosunun davranışsal eşdeğeri) `null` döndüğünü doğruluyor.

## Kapsam Dışında Bırakılanlar (Kullanıcının Açık Talimatı Gereği)

- Tekli Bakım Kaydı formu (`MaintenanceRecordForm`) bu sprintte **değiştirilmedi** — kullanıcı sadece Toplu ekranları istedi.
- Gece yarısını geçen sulama senaryosu (`calculateDuration`'ın `null` döndüğü durum) — bilinçli bir sınır, kullanıcı bunu istemedi.

## Gelecek Sprint Önerileri (Kodlanmadı — Sadece Listeleniyor)

1. UX öz-denetiminin (Sprint 10.3) önceliklendirdiği maddeler hâlâ bekliyor — en kritiği Undo'nun görsel vurgusu.
2. Tekli Bakım Kaydı formuna da Sulama Başlangıç/Bitiş Saati eklenmesi (gerçek bir kullanıcı ihtiyacı görülürse) — bugün sadece Toplu formlar destekliyor.
3. Gece yarısını geçen sulama senaryosunun ele alınması (gerçek bir ihtiyaç görülürse).

## VARSAYIM

Hiçbiri — her mimari karar (migration gerekip gerekmediği, sütun formatları) gerçek şema/kod incelemesiyle doğrulandı.

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Mevcut mimari bozulmadı | ✅ — Sadece ekleme (yeni sütunlar, yeni fonksiyonlar), mevcut hiçbir dosya davranışsal olarak bozulmadı |
| Duplicate kod oluşturulmadı | ✅ — `DateField` deseni `TimeField`'e taşındı, yeni yardımcılar mevcut dosyaya eklendi |
| YAGNI korundu | ✅ — Süre veritabanına kaydedilmedi (türetilebilir değer) |
| Gereksiz abstraction oluşturulmadı | ✅ |
| TypeScript tip güvenliği korundu | ✅ — `tsc -b` temiz |
| Kapsam genişletilmedi | ✅ — Sadece istenen 2 madde geliştirildi, roadmap/modül planlaması değiştirilmedi |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: Migration, ADR 0005'in kendi additive deseninin doğrudan bir uygulaması — yeni bir mimari karar değil.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (635/635, +28), bundle boyutu (+2.81kB), şema sürümü (12) ve commit hash (`84bd8e2`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

İki saha ihtiyacı, mevcut mimariye (Repository/Hook/Form deseni, ADR 0005 migration deseni) sadık kalınarak, geriye dönük tam uyumlulukla karşılandı. Kod yazma sürecinde 2 gerçek hata (saat dilimi, saat kırpma) bulunup düzeltildi — bu, "kod öncesi analiz" disiplininin tek başına yeterli olmadığını, testle doğrulamanın da gerekli olduğunu gösteren somut bir kanıt.
