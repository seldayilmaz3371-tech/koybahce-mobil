# ADR 0002 — SQLite Eklentisi Seçimi

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Capacitor ekosisteminde SQLite'a erişim sağlayan iki gerçek seçenek
tespit edildi:

1. `@capacitor-community/sqlite` — açık kaynak, topluluk bakımlı
2. `@capawesome-team/capacitor-sqlite` — "Capawesome Insiders"
   aboneliği gerektiren ücretli paket

## Karar

`@capacitor-community/sqlite` (v8.1.0, Capacitor 8 ile tam uyumlu)
kullanılacak.

## Gerekçe

- **Maliyet (Kural 17):** Capawesome sürümü sürekli/yıllık lisans ücreti
  gerektiriyor — "sürekli aylık maliyet oluşturacak çözümler önerme"
  kuralına doğrudan aykırı.
- **Olgunluk:** `@capacitor-community/sqlite` uzun süredir üretimde
  kullanılıyor, aktif bakımı sürüyor (son sürüm Mart 2026).
- **Yerleşik migration mekanizması:** Eklenti, `addUpgradeStatement()`
  ve versiyonlu `createConnection()` ile native tarafta atomik şema
  yükseltmesi sağlıyor — bu bizim kendi migration sistemimizi
  yazmamıza gerek bırakmıyor (bkz. ADR 0005).
- **Şifreleme desteği:** SQLCipher tabanlı şifreleme yerleşik olarak
  geliyor (bkz. ADR 0004).

## Alternatifler ve Neden Reddedildi

`@capawesome-team/capacitor-sqlite`: Teknik olarak FTS5 ve ORM desteği
gibi ek özellikler sunuyor, ancak bu proje için gerekli değil ve
ücretli. 10 yıllık bir projede öngörülemeyen abonelik maliyeti riski
kabul edilemez.

## Sonuçlar

- Veritabanı erişimi her zaman `src/data/db/connection.ts` üzerinden
  yapılacak, eklenti hiçbir yerde doğrudan import edilmeyecek — ileride
  bu karar değişirse (ör. eklenti bakımı durursa), değişiklik tek
  dosyada kalır.
