# Bahçem Mobile

Mersin Toroslar / Değirmençay bölgesindeki zeytinlik için geliştirilen,
Android öncelikli, offline-first tarım yönetim uygulaması.

Bu proje, mevcut "Bahçem" web projesinin bir devamı **değildir** —
tamamen bağımsız, sıfırdan geliştirilen bir Android uygulamasıdır. Web
projesi yalnızca iş akışı ve veri modeli referansı olarak kullanılmıştır.

## Mimari Özeti

- **Uygulama çatısı:** Capacitor 8 + React 19 + TypeScript + Vite
- **Veritabanı:** Cihaz üzerinde şifreli SQLite (`@capacitor-community/sqlite`)
- **Kimlik doğrulama:** Cihaz biyometrisi/PIN (sunucu tarafı hesap sistemi yok)
- **Sunucu:** Yok — tüm veri cihazda yaşar (offline-first, tek kullanıcı)

Detaylı mimari kararlar için [docs/adr/](docs/adr/README.md) klasörüne
bakın. Projenin üç resmi referans belgesi:

- [Bahçem Mobile Engineering Protocol](docs/engineering-protocol.md) — geliştirme disiplini ve kalite standartları
- [AI Master Architecture Document](docs/ai-architecture.md) — AI modüllerinin referans mimarisi
- [ADR Kayıtları](docs/adr/README.md) — tek tek mimari kararlar

## Geliştirme Ortamı Kurulumu

### Ön koşullar

- Node.js 20+
- Android Studio (native derleme ve gerçek cihaz testi için)
- JDK 21+

### Kurulum

```bash
npm install
```

### Web tarayıcısında geliştirme (hızlı iterasyon için)

```bash
npm run dev
```

> Not: SQLite, biyometrik doğrulama ve güvenli depolama eklentileri
> yalnızca native (Android) platformda tam olarak çalışır. Tarayıcıda
> geliştirme sadece UI/mantık iterasyonunu hızlandırmak içindir; her
> modülün gerçek testi mutlaka fiziksel bir Android cihazda yapılmalıdır.

### Android'e derleme ve gerçek cihazda çalıştırma

```bash
npm run build
npx cap sync android
npx cap open android
```

Android Studio açıldıktan sonra, USB ile bağlı bir cihazı veya
emülatörü seçip "Run" ile başlatın.

### Kod kalitesi kontrolleri

```bash
npx tsc -b      # Tip kontrolü
npm run lint    # Lint kontrolü
```

## Klasör Yapısı

```
src/
├── data/
│   ├── db/               # SQLite bağlantı yönetimi, migration'lar
│   └── repositories/     # Her modül için veri erişim katmanı
├── modules/               # İş modülleri (auth, parcels, ...)
├── native/                # Capacitor eklenti sarmalayıcıları
docs/adr/                  # Mimari Karar Kayıtları
```
