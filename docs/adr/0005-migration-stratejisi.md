# ADR 0005 — Şema Migration Stratejisi

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Web projesindeki `database.ts`, JSON dosyası üzerinde kendi yazdığı bir
migration/versiyon kontrol sistemi içeriyordu. SQLite'a geçerken bu
mantığı JavaScript tarafında yeniden yazmak (kendi
`schema_migrations` tablomuzu tutup kendi runner'ımızı çalıştırmak) bir
seçenekti.

## Karar

Kendi migration runner'ımızı YAZMIYORUZ. Bunun yerine
`@capacitor-community/sqlite`'ın yerleşik mekanizması kullanılıyor:
`SQLiteConnection.addUpgradeStatement(dbName, [{toVersion, statements}])`
ile her hedef sürüm için ham SQL kaydedilir; `createConnection()`'a
verilen `version` parametresi, native taraftaki mevcut `user_version`'dan
hedefe kadar olan tüm adımları atomik şekilde uygular.

Tüm sürüm tanımları `src/data/db/migrations/schema.ts` içinde, **sadece
eklenen, asla düzenlenmeyen** bir dizi olarak tutulur.

## Gerekçe

- Eklenti bu problemi zaten native tarafta, test edilmiş ve atomik
  şekilde çözüyor. Aynı şeyi JS tarafında yeniden yazmak Kural 4
  (gereksiz karmaşıklık) ve Kural 12'ye (kod tekrarı) aykırı olurdu.
- Native uygulama, JS tarafında try/catch ile taklit edilebilecek her
  hangi bir yarım kalma senaryosuna göre daha güvenilirdir.

## Sonuçlar

- Her yeni modül (Parseller, Gözlemler, ...) kendi tablolarını
  `SCHEMA_MIGRATIONS` dizisine yeni bir `{ toVersion, statements }`
  girişi olarak ekleyecek ve `CURRENT_SCHEMA_VERSION`'ı artıracak.
- **Kural:** Zaten dağıtılmış (kullanıcının cihazında çalışmış) bir
  sürümün SQL'i asla değiştirilmez — hata düzeltmesi her zaman yeni bir
  sürüm girişi olarak eklenir.
