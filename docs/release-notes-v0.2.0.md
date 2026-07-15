# Bahçem Mobile — Release Notes v0.2.0

**Tarih:** 2026-07-15 (kod tamamlandı, gerçek cihaz onayı bekleniyor)

## Bu Sürümde Neler Var

### 🌳 Yeni: Parseller ve Ağaçlar
- Parsel ekleme, düzenleme, silme (geri alınabilir — soft delete)
- Parsel listesinde arama ve sıralama (isim/alan)
- Ağaç ekleme, düzenleme, silme — her parselin kendi ağaç listesi
- **Referans Ağaçlar** — çiftlik genelinde, tüm parsellerdeki referans olarak işaretlenmiş ağaçları tek ekranda görüntüleme
- Parsel ekranından doğrudan o parselin ağaçlarına geçiş

### 🌍 Dil Desteği
- Türkçe ve İngilizce tam destek, cihaz diline göre otomatik algılama
- Cihaz dili değiştiğinde uygulama otomatik güncellenir (kalıcı bir tercih seçilmemişse)

### 📱 Kullanılabilirlik
- Android'in fiziksel geri tuşu artık doğal şekilde çalışıyor (Ağaç ekranından Parsellere, formdan listeye döner)
- Tüm formlar büyük dokunma alanları ve ekran okuyucu desteğiyle tasarlandı

### 🔒 Güvenlik ve Güvenilirlik
- Tüm veriler cihazda şifreli olarak saklanıyor
- Biyometrik/PIN kilit ekranı
- Offline çalışma — internet bağlantısı gerektirmez

## Bu Sürümde Olmayanlar (Bilinçli Kapsam Dışı)
- Fotoğraf ekleme
- Sulama/Gübreleme/İlaçlama kayıtları
- Finans ve Stok takibi
- AI destekli tarım danışmanlığı

Bunlar gelecek sürümlerde (Modül 3+) planlanıyor.

## Teknik Özet
58 otomatik test, sürekli entegrasyon kontrolleri (derleme, kod kalite denetimi) her adımda çalıştırıldı.
