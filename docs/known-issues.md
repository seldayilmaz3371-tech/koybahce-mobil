# Bahçem Mobile — Known Issues (v0.3.0)

Bu belge, bilinçli olarak ertelenen veya henüz tam çözülmemiş konuları şeffafça listeler. v0.2.0'dan bu yana güncellendi.

## Açık Teknik Borçlar

| # | Konu | Etki | Durum |
|---|---|---|---|
| 1 | `restore()` — pasife alınmış bir kaydı geri getirme UI'ı yok | Kullanıcı yanlışlıkla sildiği bir kaydı arayüzden geri getiremiyor (veri kaybolmuyor) | Repository Contract Matrix'te belgeli |
| 2 | Error Code Standard, UI'da henüz tüketilmiyor | Hata mesajları hâlâ ham/çevrilmemiş gösteriliyor | Altyapı hazır, UI entegrasyonu gelecek modülde |
| 3 | ✅ ~~Fotoğraf↔Gözlem ilişkisi~~ | — | **v0.3.0'da çözüldü** (Seçenek B, Sprint 3.1/3.6) |
| 4 | ADR 0022 (foreign key) — native davranış %100 gerçek cihazda doğrulanmadı | Düşük risk | **v0.3.0'da güçlendi:** `observations`/`photos` tablolarında da gerçek testle kanıtlandı (test ortamında) — gerçek cihaz teyidi hâlâ öneriliyor |
| 5 | Genel `count()` repository metodu yok | Gözlem sayısı gibi göstergeler gösterilemiyor | YAGNI, gerçek ihtiyaç doğarsa eklenecek |
| 6 | 🆕 `isSubmitting` yarış durumu — sadece `PhotoGalleryScreen`'de düzeltildi | Düşük-orta (gerçek kullanıcı dokunuşlarında risk düşük) | `ParcelForm`/`TreeForm`/`ObservationForm`'da teorik olarak var, düzeltilmedi (backlog #15) |
| 7 | 🆕 Fotoğraf galerisinde thumbnail yok | Düşük (bir gözlemde tipik olarak az fotoğraf) | Backlog #17, gerçek performans sorunu gözlemlenirse eklenecek |
| 8 | 🆕 Router eksikliği artık 6 ekranla ciddileşti | Orta, büyüyen | Modül 4 planlamasının ilk önceliği olmalı |

## Bilinçli Olarak Ertelenen Kararlar

- **Çoklu çiftlik (Farm) desteği** — tek çiftlik varsayımı korunuyor.
- **Sulama/Gübreleme/İlaçlama için birleşik `treatments` tablosu önerisi** — henüz uygulanmadı.
- **EXIF tabanlı `taken_at`** — Sprint 3.7'de kesin olarak plugin API'sinin bunu desteklemediği doğrulandı, gelecekte ayrı bir kütüphane gerekecek.

## Önerilen Ek Doğrulama (Gerçek Cihaz Testi Sırasında)

- ADR 0022: var olmayan bir parsele/ağaca bağlı kayıt oluşturma denemesinin gerçek cihazda da hata verdiğini gözlemlemek.
- Kamera/galeri izin reddi senaryosunun gerçek cihazda çevrilmiş, engelleyici olmayan bir mesaj gösterdiğini doğrulamak.
- Fotoğrafların uygulama güncellemesi sonrası hâlâ erişilebilir olduğunu (kalıcı depolama) doğrulamak.
