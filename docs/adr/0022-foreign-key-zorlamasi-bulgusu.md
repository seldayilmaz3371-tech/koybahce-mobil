# ADR 0022 — Foreign Key Zorlaması Muhtemelen Etkin Değil (Kritik Bulgu)

**Durum:** Kabul edildi — **düzeltme uygulandı (Sprint 2.6), gerçek cihaz testinde nihai doğrulama bekliyor**
**Tarih:** 2026-07-15
**İlgili:** Database Master Schema, Database Migration Strategy (Belge 1)

## Bağlam

Kullanıcının talebiyle native SQLite transaction/FK davranışı araştırıldı (varsayımla değil, sqlite.org resmi dokümantasyonu ve `capacitor-community/sqlite` GitHub kaynaklarıyla).

## Bulgu

1. **SQLite'ın kendisi, foreign key kısıtlarını her bağlantıda varsayılan olarak KAPALI tutar** (geriye dönük uyumluluk, sqlite.org/pragma.html'de açıkça belgelenmiş, kesin doğrulanmış platform gerçeği). Etkinleştirmek için her bağlantıda `PRAGMA foreign_keys = ON` çalıştırılması gerekir.
2. `@capacitor-community/sqlite`'ın bunu otomatik yaptığına dair **hiçbir kanıt bulunamadı** — ne CHANGELOG'da ne API.md'de ne `capacitor.config.ts` seçeneklerinde böyle bir belgelenmiş davranış var.
3. Projenin `src/data/db/connection.ts` kodu, bağlantı kurulurken bu PRAGMA'yı **çalıştırmıyor**.

**Güven seviyesi:** Yüksek ama **%100 değil** — plugin'in native (Kotlin) kaynak kodunu satır satır incelemedim (arama sonuçları bunu getirmedi). Bu, "kesin doğrulanmış" değil, "genel SQLite davranışına ve mevcut dokümantasyonun sessizliğine dayanan güçlü bir çıkarım" olarak sınıflandırılmalı.

## Etki

Database Master Schema'daki tüm `REFERENCES ... ON DELETE RESTRICT` kısıtları muhtemelen **şu anda zorlanmıyor**. Pratik sonuç: teorik olarak var olmayan bir `parcel_id`'ye sahip bir `tree` satırı eklenebilir; bir parsel, ona bağlı ağaçlar varken bile (eğer birileri hard-delete denerse) engellenmeyebilir.

**Bugünkü gerçek risk düşük** çünkü:
- Uygulama zaten hard-delete kullanmıyor (her yerde soft-delete, Database Master Schema Kural 1).
- `TreeRepository.create()` her zaman geçerli bir `parcelId` ile çağrılıyor (UI, var olan bir parselden yönlendirdiği için) — bu bir uygulama-seviyesi garanti, DB-seviyesi değil.

**Ama risk sıfır değil:** Gelecekteki bir kod hatası (ör. bir formda yanlış `parcelId` gönderilmesi), FK kısıtı zorlanmadığı için **sessizce** yanlış veriye yol açabilir — SQLite hata vermeyecektir.

## Önerilen Düzeltme (Bugün Uygulanmıyor)

`src/data/db/connection.ts`'te, bağlantı açıldıktan hemen sonra:
```typescript
// Önerilen — bugün UYGULANMIYOR
await db.execute("PRAGMA foreign_keys = ON;");
```
Bu, **tek satırlık, düşük riskli** bir düzeltmedir. Ağaç modülü kod aşamasına eklenmesi öneriliyor.

## Diğer Doğrulanan Bulgular (Bu Araştırmadan)

| Konu | Sonuç |
|---|---|
| WAL journal mode | ✅ Doğrulandı — plugin CHANGELOG'unda açıkça belirtilmiş, Android'de WAL2 varsayılan |
| ACID garantisi | ✅ SQLite'ın temel platform garantisi, plugin değiştirmiyor |
| Transaction sırasında uygulama kapanması | ✅ Genel SQLite davranışı: commit edilmemiş değişiklikler otomatik geri alınır |
| Nested transaction | 🟡 Muhtemelen desteklenmiyor (genel SQLite kısıtı) — `BaseRepository.runInTransaction()` **asla iç içe çağrılmamalı** |
| Migration'ların atomikliği | 🟡 Kesin doğrulanamadı — Database Migration Strategy'de (Belge 1) zaten "açık araştırma maddesi" olarak işaretliydi, bu araştırma bunu değiştirmedi |
| Android Auto Backup | ✅ **Bağımsız doğrulama** — plugin'in kendi dokümantasyonu da "data_extraction_rules.xml ekleyin, sistem yedeklemesini önleyin" öneriyor, bu **ADR 0010'daki kararımızı bağımsız olarak doğruluyor** |

## Sonuç

Bu, kod tabanında bugün **acil bir çökme riski değil**, ama gerçek bir veri bütünlüğü açığı. Ağaç modülü kod aşamasına, `PRAGMA foreign_keys = ON` eklenmesi **öncelikli bir düzeltme maddesi** olarak ekleniyor.

## ✅ Çözüm (Sprint 2.6, 2026-07-15)

Üçüncü bir araştırma turu daha yapıldı (SQLite forum, plugin CHANGELOG, GitHub issue geçmişi) — **hâlâ plugin'in FK'yi varsayılan olarak açtığına dair kesin bir onay bulunamadı** (dürüstçe belirtiliyor). Ama CHANGELOG'da FK/CASCADE davranışına dair eski bir hata düzeltmesi (*"Fix return changes in IOS plugin when FOREIGN KEY and ON DELETE CASCADE"*, 2020) bulundu — bu, FK zorlamasının plugin içinde işlevsel olduğuna dair dolaylı bir kanıt.

**Mühendislik kararı:** Kesinlik olmasa da, `PRAGMA foreign_keys = ON`'u **kendimiz açıkça çalıştırmak risksiz** — plugin zaten açıksa no-op, kapalıysa gerçek bir düzeltme. Bu ilkeyle:

- `src/data/db/connection.ts`: bağlantı açıldıktan hemen sonra `PRAGMA foreign_keys = ON;` çalıştırılıyor.
- `src/data/db/testDatabaseExecutor.ts`: aynı PRAGMA test veritabanında da etkinleştirildi.
- **Yeni test:** `tree.repository.test.ts`'e, var olmayan bir `parcel_id` ile ağaç oluşturmanın artık reddedildiğini kanıtlayan gerçek bir test eklendi — **geçti**, FK kısıtlarımızın (REFERENCES tanımları) sözdizimsel olarak doğru olduğunu ve zorlama açıkken gerçekten çalıştığını kanıtlıyor.

**Kalan sınır (dürüstçe belirtiliyor):** Bu test, `better-sqlite3` (Node) üzerinde çalışıyor — gerçek native `@capacitor-community/sqlite` bağlantısının Android'de aynı şekilde davrandığı, ancak **kullanıcının gerçek cihaz testiyle** nihai olarak doğrulanabilir. Kod düzeltmesi uygulandı ve mantıksal olarak doğru, ama "gerçek cihazda da bu satır çalışıyor mu" sorusunun kesin cevabı henüz yok.
