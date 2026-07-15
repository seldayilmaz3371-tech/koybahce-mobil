# Bahçem Mobile — Known Issues (v0.2.0)

Bu belge, bilinçli olarak ertelenen veya henüz tam çözülmemiş konuları şeffafça listeler.

## Açık Teknik Borçlar

| # | Konu | Etki | Durum |
|---|---|---|---|
| 1 | `restore()` — pasife alınmış bir parsel/ağacı geri getirme UI'ı yok | Kullanıcı yanlışlıkla sildiği bir kaydı arayüzden geri getiremiyor (veri kaybolmuyor, sadece arayüzü yok) | Repository Contract Matrix'te belgelendi, gelecek modülde ele alınacak |
| 2 | Error Code Standard, UI'da henüz tüketilmiyor | Hata mesajları hâlâ ham/çevrilmemiş (İngilizce, teknik) gösteriliyor | Altyapı (`ErrorCode`, `mapSqliteError`) hazır, hook'lara eklendi — UI entegrasyonu gelecek modülde |
| 3 | Fotoğraf↔Gözlem veri ilişkisi henüz tasarlanmadı | Modül 3 tasarımını etkileyecek bir açık karar | Bilinçli olarak erken karar verilmedi (Database Master Schema) |
| 4 | ADR 0022 (foreign key zorlaması) — kod düzeltmesi yapıldı ama native davranış %100 gerçek cihazda doğrulanmadı | Düşük risk (uygulama zaten her zaman geçerli ID'ler kullanıyor) | Gerçek cihaz testinde ek bir doğrulama adımı önerilir (aşağıda) |
| 5 | Genel `count()` repository metodu yok | Şu an ihtiyaç yok | YAGNI kararı, gerçek ihtiyaç doğarsa eklenecek |

## Bilinçli Olarak Ertelenen Kararlar

- **Çoklu çiftlik (Farm) desteği** — tek çiftlik varsayımı korunuyor, AI Master Architecture'da "muhtemelen yıllarca gerekmeyebilir" olarak değerlendirildi.
- **Sulama/Gübreleme/İlaçlama için birleşik `treatments` tablosu önerisi** — henüz uygulanmadı, ilgili modül tasarımı başladığında kesinleşecek.

## Önerilen Ek Doğrulama (Gerçek Cihaz Testi Sırasında)

ADR 0022 ile ilgili: mümkünse, var olmayan bir parsele bağlı bir ağaç oluşturma denemesinin gerçek cihazda da hata verdiğini (uygulamanın CHECK/FOREIGN KEY hatasıyla karşılaştığını, sessizce başarılı olmadığını) manuel olarak gözlemlemek, bu belgedeki 4. maddeyi kapatacaktır.
