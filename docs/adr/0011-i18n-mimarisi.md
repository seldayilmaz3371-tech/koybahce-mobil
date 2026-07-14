# ADR 0011 — Uluslararasılaştırma (i18n) Mimarisi

**Durum:** Kabul edildi
**Tarih:** 2026-07-14
**İlgili:** ADR 0004 (Veritabanı Şifreleme), ADR 0006 (Güvenli Depolama), Engineering Protocol Bölüm 3 (Globalization Policy)

## Bağlam

Bahçem Mobile'ın uzun vadeli hedefi, Google Play üzerinden dünya çapında yayınlanabilen bir platform olmak. Çoklu dil desteği, sonradan eklenecek bir özellik değil, temel mimarinin bir parçası olarak kabul edildi.

Modül 1 denetiminde, kullanıcıya görünen 13 metnin doğrudan koda gömülü olduğu tespit edildi (`LockScreen.tsx`, `App.tsx`, `biometricAuth.ts`).

## Karar

### Kütüphane: `react-i18next` + `i18next`

Karşılaştırılan alternatifler:

| Kütüphane | Bundle | Değerlendirme |
|---|---|---|
| **react-i18next + i18next** ✅ | ~15-22KB gzip | En geniş ekosistem, en güçlü TypeScript desteği, CLDR çoğul kuralları (Arapça'nın 6 formu dahil) yerleşik, derleyici/macro adımı gerektirmiyor |
| react-intl (FormatJS) | ~13-18KB gzip | ICU MessageFormat standardı güçlü yönü, ama dil algılama/yükleme için kendi çözümümüzü yazmamız gerekirdi — react-i18next zaten bunu daha esnek sağlıyor |
| LinguiJS | ~10KB gzip | En küçük bundle, ama derleme zamanı macro/compiler adımı ekliyor — Kural 4/7 (gereksiz karmaşıklık/soyutlama) ile gerilimde |

**Eklenmeyenler (bilinçli tercih):**
- `i18next-http-backend`: Çeviri dosyalarını çalışma zamanında bir sunucudan çekmek için — offline-first ilkesine ve Kural 17'ye (harici servis bağımlılığı yok) aykırı olurdu. Tüm çeviriler derleme zamanında pakete gömülü statik JSON dosyalarıdır.
- `i18next-browser-languagedetector`: Web sitesi (cookie/URL) dil algılama için tasarlanmış; native Capacitor uygulaması için uygun değil. Kendi algılama mantığımız (`languagePreference.ts`) yazıldı.

### Üçüncü Depolama Katmanı: `@capacitor/preferences`

Dil tercihi, kilit ekranı (kimlik doğrulama öncesi, veritabanı kapalıyken) gösterilmeden önce bilinmesi gerektiği için SQLite'tan okunamaz. Secure Storage'a koymak katman kirliliği olurdu (o, gerçek sırlar içindir). Bu üçüncü ihtiyaç için resmi Capacitor eklentisi `@capacitor/preferences` (v8.0.1, Capacitor 8 ile doğrulanmış uyumlu) kullanılacak — hızlı, şifresiz, kimlik doğrulama öncesi erişilebilir.

**Üç depolama katmanının net sorumluluk ayrımı:**

| Katman | İçerik | Erişim Zamanı |
|---|---|---|
| SQLite (şifreli) | Yapılandırılmış iş verisi (parsel, ağaç, gözlem, finans...) | Kimlik doğrulama SONRASI |
| Secure Storage (Keystore) | Gerçek sırlar (API anahtarı, DB şifreleme anahtarı) | Her zaman, ama sadece dahili kod tarafından |
| **Preferences (yeni)** | Hassas olmayan, kimlik doğrulama öncesi gereken ayarlar (dil tercihi) | Her zaman, kimlik doğrulama öncesi dahil |

### Varsayılan Geliştirme Dili: İngilizce

Tüm kod tanımlayıcıları (değişken, fonksiyon, sınıf, dosya, SQLite tablo/kolon, API, repository, servis isimleri) İngilizcedir — bu zaten Modül 1'de böyleydi, denetimde herhangi bir Türkçe tanımlayıcı bulunmadı, değişiklik gerekmedi.

Çeviri dosyaları `src/i18n/locales/<dil kodu>/common.json` yapısında tutulur. Yeni bir dil eklemek, mevcut bileşen kodunu değiştirmeyi gerektirmez — sadece yeni bir JSON dosyası ve `supportedLanguages.ts`'e bir satır eklemek yeterlidir.

### RTL (Sağdan Sola) Desteği

`applyDocumentDirection()` fonksiyonu, aktif dile göre `<html dir="rtl|ltr">` özniteliğini ayarlar. Bunun çalışması için CSS'in **mantıksal özelliklerle** (`margin-inline-start` vb.) yazılması gerekir — Modül 1'in mevcut CSS'i denetlendi, hiçbir fiziksel yön özelliği (`margin-left` vb.) bulunmadı, değişiklik gerekmedi. Bu kural Engineering Protocol'e eklendi (bundan sonraki tüm modüller için bağlayıcı).

## Modül 1 Revizyonu — Yapılan Değişiklikler

| Dosya | Değişiklik |
|---|---|
| `LockScreen.tsx` | Tüm sabit metinler `useTranslation()` ile değiştirildi |
| `App.tsx` | Tüm sabit metinler `useTranslation()` ile değiştirildi |
| `biometricAuth.ts` | `cancelTitle` artık parametre olarak alınıyor (önceden sabit "İptal") |
| `main.tsx` | `initI18n()` ilk render'dan önce çağrılıyor (async bootstrap) |
| **Yeni:** `src/i18n/` | i18next kurulumu, dil algılama, RTL yardımcıları, çeviri dosyaları |
| **Yeni:** `src/native/preferences.ts` | `@capacitor/preferences` sarmalayıcısı |

**Değiştirilmeyenler:** SQLite şema, repository katmanı, kimlik doğrulama mantığı, native eklenti seçimleri — hiçbiri i18n ile ilgili olmadığı için dokunulmadı (Kural 26).

## Alternatifler ve Neden Reddedildi

Yukarıda kütüphane karşılaştırma tablosunda detaylandırıldı.

## Sonuçlar

- Modül 2'den itibaren her yeni ekran, metinlerini doğrudan yazmak yerine `useTranslation()` ile `common.json`'a (veya büyüdükçe modül bazlı namespace'lere) ekleyecek.
- `AIProvider` katmanı (bkz. AI Master Architecture) kullanıcının seçtiği dili miras alacak — bu, AI Master Architecture'a ayrıca işlendi (Bölüm 3, 5 güncellemesi).
