# Mimari Karar Kayıtları (ADR)

> **Üst düzey referans belgeleri:** [Bahçem Mobile Engineering Protocol](../engineering-protocol.md) · [AI Master Architecture Document](../ai-architecture.md)

Bu klasör, Bahçem Mobile projesinde alınan önemli mimari kararları
belgeler. Her karar, neden alındığını ve hangi alternatiflerin neden
reddedildiğini içerir — amaç, bir yıl sonra "biz bunu neden böyle
yapmıştık?" sorusuna kod kazmadan cevap verebilmektir.

| # | Başlık | Durum |
|---|---|---|
| [0001](0001-genel-teknoloji-yigini.md) | Genel Teknoloji Yığını | Kabul edildi |
| [0002](0002-sqlite-eklentisi-secimi.md) | SQLite Eklentisi Seçimi | Kabul edildi |
| [0003](0003-kimlik-dogrulama-modeli.md) | Kimlik Doğrulama Modeli | Kabul edildi |
| [0004](0004-veri-tabani-sifreleme.md) | Veritabanı Şifreleme ve Güvenli Depolama | Kabul edildi |
| [0005](0005-migration-stratejisi.md) | Şema Migration Stratejisi | Kabul edildi |
| [0006](0006-guvenli-depolama-eklentisi-secimi.md) | Güvenli Depolama Eklentisi Seçimi | Kabul edildi |
| [0007](0007-ses-kaydi-eklentisi-secimi.md) | Ses Kaydı Eklentisi Seçimi | Kabul edildi (Modül 3'te uygulanacak) |
| [0008](0008-yedekleme-stratejisi.md) | Yedekleme Stratejisi | Kabul edildi (ileriki modülde uygulanacak) |
| [0009](0009-rag-faz2-ertelenmesi.md) | RAG'ın Faz 2'ye Ertelenmesi | Kabul edildi |
| [0010](0010-android-auto-backup-kapatildi.md) | Android Auto Backup Devre Dışı Bırakıldı | Kabul edildi |
| [0011](0011-i18n-mimarisi.md) | Uluslararasılaştırma (i18n) Mimarisi | Kabul edildi |
| [0012](0012-i18n-standartlari-brand-runtime-dil.md) | Translation Key Convention, Brand Config (ilk), Runtime Dil Değiştirme | Kabul edildi |
| [0013](0013-brand-config-genisletildi.md) | Brand Configuration Tam Kapsama Genişletildi | Kabul edildi |
| [0014](0014-play-store-yol-haritasi.md) | Play Store Yayını Yol Haritası (Paket Adı Değişimi, Marka Varlıkları) | Belgelendi — uygulanmadı, gelecek çalışma |

## Yeni bir ADR ne zaman eklenir?

- Bir bağımlılık/eklenti seçildiğinde
- Veri modelinde geri dönüşü zor bir karar alındığında
- Bir güvenlik/gizlilik kararı alındığında
- Önceden alınmış bir kararın tersine çevrildiği durumlarda (eski ADR
  silinmez, "Durum" alanı "Yerini aldı: 00XX" olarak güncellenir ve yeni
  bir ADR eklenir)
