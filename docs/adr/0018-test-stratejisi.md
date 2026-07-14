# ADR 0018 — Test Stratejisi (Vitest + Node SQLite Sürücüsü)

**Durum:** Kabul edildi — mimari tasarım tamamlandı, kurulum Modül 2 kod aşamasında yapılacak
**Tarih:** 2026-07-14
**İlgili:** Modül 1'de not düşülen açık eksik ("test altyapısı henüz kurulmadı")

## Bağlam

Modül 1'de repository katmanı küçük olduğu için test altyapısı kurulmamıştı. Modül 2 ile repository katmanı büyüyeceği için bu artık ertelenemez.

**Temel zorluk:** `@capacitor-community/sqlite`, native bir köprü (bridge) üzerinden çalışır — bu köprü, bir masaüstü Node.js test ortamında mevcut değildir. Gerçek native SQLite davranışını (şifreleme dahil) yalnızca gerçek Android cihazda test edebiliriz (zaten kurulu iki aşamalı doğrulama modelimiz: Kod Hazır → Cihaz Testi).

## Karar

**Test çalıştırıcı:** `vitest` (v4.1.10 doğrulandı) — Vite ile doğal entegre, ek yapılandırma neredeyse gerektirmiyor, zaten Vite kullandığımız için en düşük sürtünmeli seçenek.

**Repository/iş mantığı testleri için SQLite sürücüsü:** `better-sqlite3` (v12.11.1 doğrulandı, aktif bakımlı) — Node ortamında **şifresiz, gerçek bir SQLite motoruna karşı** repository sorgularını (SQL doğruluğu, veri eşleme, migration mantığı) test etmeyi sağlar. Sadece `devDependencies`'e eklenecek, üretim koduna asla girmeyecek.

**Neyin test edilebileceği / edilemeyeceği açıkça ayrılıyor:**

| Test türü | Araç | Kapsam |
|---|---|---|
| SQL sorgu doğruluğu, repository mantığı, migration şeması | Vitest + better-sqlite3 (Node) | ✅ Otomatik, her commit'te çalıştırılabilir |
| Native şifreleme, Keystore entegrasyonu, biyometrik akış, gerçek cihaz performansı | Gerçek Android cihaz (elle) | ❌ Otomatikleştirilemez — mevcut Test Kapısı süreci (Protocol Bölüm 10) devam ediyor |

## Gerekçe

- Vitest: en düşük sürtünme, Vite projeleriyle resmi olarak önerilen eşleşme.
- better-sqlite3: senkron API'si testleri basitleştiriyor, SQL lehçesi `@capacitor-community/sqlite`'ın kullandığı SQLite ile aynı (ikisi de standart SQLite), bu yüzden sorgu doğruluğu testleri gerçek native davranışla tutarlı sonuç verir — sadece şifreleme/native köprü katmanı test kapsamı dışında kalıyor.

## Sonuçlar

Modül 2 kod aşaması başladığında: `vitest` + `better-sqlite3` `devDependencies`'e eklenecek, her repository için karşılık gelen `.test.ts` dosyası yazılacak. Bu, Kalite Kapısı'na (Protocol Bölüm 9) yeni bir adım olarak eklenecek: `npm run test`.
