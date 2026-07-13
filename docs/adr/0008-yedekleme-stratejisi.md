# ADR 0008 — Yedekleme Stratejisi

**Durum:** Kabul edildi (uygulama sonraki modüllerde yapılacak)
**Tarih:** 2026-07-13

## Bağlam

Web projesi, bir Google Drive Desktop senkron klasörüne kopyalayarak
API anahtarı gerektirmeyen otomatik bulut yedeklemesi yapıyordu. Bu
mekanizma, masaüstü senkron istemcisi kavramına dayandığı için
Android'de doğrudan karşılığı yoktur.

## Karar

v1.0'da yedekleme **tamamen yerel ve manuel**dir: kullanıcı bir
"Yedekle" eylemini tetikler, veritabanı + fotoğraflar tek bir dosyaya
paketlenip kullanıcının seçtiği bir konuma (cihaz depolama, SD kart
veya kullanıcının kendi bulut senkron uygulamasının klasörü) yazılır.
Otomatik/zamanlanmış yedekleme **yok**.

## Gerekçe

Kullanıcının açık kararı bu yönde. Ayrıca ADR 0004'te belirtilen risk
(güvenli depo erişilemez hale gelirse veritabanı açılamaz) göz önüne
alındığında, kullanıcının kontrolünde, düzenli aralıklarla tetiklenen
bir yedekleme alışkanlığı veri kaybına karşı en gerçekçi savunmadır.

## Alternatifler ve Neden Ertelendi

Otomatik zamanlanmış yedekleme: v1.0 kapsamı dışına bırakıldı ama mimari
buna kapalı değil — var olan dışa aktarma fonksiyonunun üzerine bir
zamanlayıcı eklemek yeterli olacak (Kural 8: genişletilebilir mimari).

## Sonuçlar

İlgili modül geldiğinde `@capacitor/filesystem` bağımlılığı o modülün
kapsamında eklenecek (bkz. Modül 1'de bu paketin bilinçli olarak
kaldırılması — henüz gerekli değildi).
