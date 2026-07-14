# ADR 0010 — Android Auto Backup Devre Dışı Bırakıldı

**Durum:** Kabul edildi
**Tarih:** 2026-07-14
**İlgili:** ADR 0004 (Veritabanı Şifreleme), ADR 0008 (Yedekleme Stratejisi)

## Bağlam

Modül 1 sonrası yapılan derin teknik incelemede, Capacitor'ın varsayılan
olarak bıraktığı `android:allowBackup="true"` ayarının, ADR 0004'te
alınan Keystore tabanlı şifreleme kararıyla çakıştığı tespit edildi.

Android Auto Backup, uygulama dosyalarını (şifreli SQLite veritabanımız
dahil) otomatik olarak kullanıcının Google Drive hesabına yedekler.
Ancak Android Keystore'da üretilen şifreleme anahtarları **donanıma
bağlıdır ve bu yedeğe dahil edilmez** (bu, Android'in temel güvenlik
mimarisinin bir parçasıdır, giderilebilir bir hata değildir). Kullanıcı
telefon değiştirdiğinde Google'ın otomatik geri yüklemesi çalışırsa,
şifreli veritabanı dosyası geri gelir ama onu açacak anahtar gelmez —
sonuç, kalıcı ve geri döndürülemez veri erişilemezliğidir.

## Karar

`AndroidManifest.xml` içinde `android:allowBackup="false"` ayarlandı.

## Gerekçe

- Bu risk, zaten ADR 0008'de bilinçli olarak aldığımız "otomatik/bulut
  yedekleme yok, sadece kullanıcı tetiklemeli yerel yedekleme" kararıyla
  doğrudan çelişiyordu — Android'in arka planda sessizce çalışan bu
  mekanizması bizim tasarım kararımızın dışında, bizim kontrolümüz
  olmayan bir yoldan veriyi tehlikeye atıyordu.
- Kural 31 (veri güvenliği her zaman önceliklidir) gereği, bu potansiyel
  veri kaybı senaryosu kabul edilemez.

## Alternatifler ve Neden Reddedildi

- **`dataExtractionRules`/`fullBackupContent` ile sadece SQLite dosyasını
  hariç tutmak:** Teknik olarak mümkün, ancak gereksiz karmaşıklık
  ekliyor (Kural 4) — zaten otomatik bulut yedeklemesi hiç
  istemediğimiz için, tüm mekanizmayı kapatmak daha basit ve daha az
  hataya açık.

## Sonuçlar

- Kullanıcılar artık telefon değiştirdiklerinde verilerini SADECE
  ADR 0008'de tanımlanan manuel yedekleme özelliğiyle taşıyabilecek.
  Bu, manuel yedekleme modülünün önceliğini daha da artırıyor.
- Bu değişiklik `android/app/src/main/AndroidManifest.xml` dosyasında,
  tek satırlık, düşük riskli bir düzeltmedir.
