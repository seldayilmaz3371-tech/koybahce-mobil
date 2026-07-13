# ADR 0006 — Güvenli Depolama Eklentisi Seçimi

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Android Keystore korumalı anahtar/değer depolaması sağlayan birden
fazla açık kaynak Capacitor eklentisi mevcut:
`@aparajita/capacitor-secure-storage`, `martinkasa/capacitor-secure-storage-plugin`
ve türevleri (`@evva/...`, `@atroo/...`).

## Karar

`@aparajita/capacitor-secure-storage` (v8.0.0) kullanılacak.

## Gerekçe

- **Ekosistem tutarlılığı:** Aynı geliştiricinin, zaten seçtiğimiz
  `@aparajita/capacitor-biometric-auth` ile birlikte tasarlanmış
  "companion" paketi — ikisi birlikte test edilmiş, tutarlı bir API
  yüzeyi sunuyor (Kural 12).
- **Capacitor 8 için özel olarak geliştirilmiş**, tek ve net bakım
  hattına sahip.
- Android'de AES şifreleme + KeyStore üretilen gizli anahtar + uygulamaya
  özel depo — kullanıcının talep ettiği güvenlik modeliyle birebir
  örtüşüyor.
- Ücretsiz, açık kaynak.

## Alternatifler ve Neden Reddedildi

`martinkasa/capacitor-secure-storage-plugin` ve türevleri: Aynı temel
mekanizmayı (Android Keystore + EncryptedSharedPreferences) sunuyor,
ancak paket birden fazla kez yeniden adlandırılmış/fork'lanmış
(`martinkasa` → `evva` → `atroo`), hangisinin "asıl" güncel sürüm
olduğu net değil. Bu belirsizlik, 10 yıllık bir projede bakım riski
taşıyor.

## Sonuçlar

- Tüm gizli veri erişimi `src/native/secureStorage.ts` üzerinden
  yapılır; eklenti başka hiçbir dosyada import edilmez.
