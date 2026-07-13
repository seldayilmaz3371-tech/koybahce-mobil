# ADR 0004 — Veritabanı Şifreleme ve Güvenli Depolama

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Kullanıcı, Gemini API anahtarının düz metin veya kolay erişilebilir bir
yöntemle saklanmamasını, Android Keystore/Secure Storage kullanılmasını
açıkça talep etti. Bu, projenin genel "veri güvenliği her zaman yeni
özellik geliştirmekten önceliklidir" ilkesiyle birlikte değerlendirildi.

## Karar

1. **Gizli değerler (API anahtarı, DB şifreleme anahtarı):**
   `@aparajita/capacitor-secure-storage` ile Android Keystore korumalı
   depoda saklanır (AES şifreleme, uygulamaya özel, uygulama silinince
   silinir).
2. **Veritabanının tamamı** SQLCipher ile şifreli açılır
   (`androidIsEncryption: true`). Şifreleme parolası, ilk açılışta
   Web Crypto API ile üretilen rastgele 256 bit'lik bir değerdir ve
   yukarıdaki güvenli depoda tutulur.

## Gerekçe

- Kullanıcının açık talebi karşılanıyor: API anahtarı hiçbir zaman düz
  metin olarak kod, log veya dosyada bulunmuyor.
- Veritabanının tamamını şifrelemek, sadece API anahtarını değil,
  parsel konumları, mali kayıtlar gibi tüm çiftlik verisini de cihaz
  kaybı/çalınması senaryosuna karşı koruyor — bu, "veri güvenliği
  önceliklidir" ilkesinin doğal bir uzantısı.
- Şifreleme anahtarı kullanıcıya SORULMUYOR (otomatik üretiliyor):
  saha kullanılabilirliği (Kural 15) için ekstra bir "veritabanı
  şifresi" istemi kabul edilemez bir sürtünme yaratırdı. Buradaki
  şifreleme "kullanıcıdan gizli bir sır" değil, "ham dosya cihaz dışına
  çıkarsa okunamasın" savunmasıdır — erişim kontrolü ayrı bir katmanda
  (ADR 0003) sağlanıyor.

## Alternatifler ve Neden Reddedildi

- **Kullanıcının kendi belirlediği bir ana şifre:** Unutulma riski
  taşır ve saha kullanımını yavaşlatır; kurtarma mekanizması
  olmadığında veri kaybına yol açabilir.
- **Şifrelemesiz veritabanı:** Kural 31'e ("veri güvenliği her zaman
  önceliklidir") ve kullanıcının API anahtarı güvenliği talebinin
  ruhuna aykırı.

## Sonuçlar

- `src/data/db/encryptionKey.ts`, anahtar üretimi ve saklanmasından
  sorumludur.
- `src/data/db/connection.ts`, bağlantı kurulmadan önce
  `setEncryptionSecret()` ile bu anahtarı eklentiye tanıtır.
- **Risk:** Güvenli depo bir şekilde bozulur/erişilemez hale gelirse
  (ör. Android sistem güncellemesi kaynaklı bir KeyStore sorunu),
  veritabanı da açılamaz hale gelir. Bu risk, manuel yedekleme
  modülünün (ADR 0008) önemini artırıyor — yedekler ayrı bir mekanizma
  ile dışa aktarılmalı.
