# ADR 0001 — Genel Teknoloji Yığını

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Bahçem Mobile, mevcut "Bahçem" web projesinin (Express + React + JSON
dosya veritabanı) doğrudan devamı değil, Android öncelikli, sıfırdan
geliştirilecek bağımsız bir uygulamadır. Uygulama gerçek saha
koşullarında (güneş altında, zayıf/yok internet, eldivenle, tek elle)
kullanılacak ve en az 10 yıl bakımı yapılacak şekilde tasarlanmalıdır.

## Karar

- **Uygulama çatısı:** Capacitor 8 (React 19 + TypeScript + Vite)
- **Veri modeli:** Offline-first, **tek kullanıcı** odaklı
- **Veritabanı:** Cihaz üzerinde SQLite (bkz. ADR 0002)
- **Sunucu:** Yok. Express/Node.js tabanlı bir backend'e ihtiyaç
  duymuyoruz — tüm veri cihazda yaşıyor.
- **Harici servis bağımlılığı:** Minimum. Yalnızca kullanıcı
  tetiklediğinde Google Gemini API (AI özellikleri) ve ücretsiz/anahtarsız
  Open-Meteo API (hava durumu).

## Gerekçe

Web projesindeki Express + JSON dosya veritabanı mimarisi, sunucu
gerektirdiği ve tek dosyalık veritabanının ölçeklenebilirlik/performans
sorunları taşıdığı (bkz. Master Architecture Report — 3203 embedding
parçasının aynı 3.5 MB'lık dosyada tutulması) için Android'e uygun
değildir. Mobil, offline-first bir uygulamada sunucu katmanı hem
gereksiz karmaşıklık hem de sürekli internet bağımlılığı (kural 15'e
aykırı) yaratır.

## Alternatifler ve Neden Reddedildi

- **Web projesini WebView'e sarmalamak (Capacitor + mevcut Express
  backend'i cihazda çalıştırmak):** Node.js sunucusunu Android'de arka
  planda sürekli çalıştırmak pil tüketimini artırır, işletim sistemi
  tarafından süreç öldürülme riski taşır, ve zaten offline-first
  gereksinimiyle çelişir.
- **React Native:** Kullanıcı açıkça Capacitor talep etti; ayrıca web
  projesindeki React bileşen mantığının bir kısmı kavramsal olarak daha
  kolay taşınabilir.

## Sonuçlar

- Web projesindeki tüm iş mantığı (parsel yönetimi, mali hesaplamalar,
  AI prompt tasarımı) **kavram olarak** referans alınacak, kod olarak
  taşınmayacak.
- Her modül, SQLite üzerinde çalışan kendi repository katmanını
  yazacak.
