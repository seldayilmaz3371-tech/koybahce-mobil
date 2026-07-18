# ADR 0026 — Release Signing Architecture

**Durum:** Kabul edildi (mimari karar) — **gerçek uygulama (keystore oluşturma) kullanıcının kendi ortamında yapılacak**
**Tarih:** 2026-07-18
**Kapsam:** Sprint 7.5. ADR 0025'in (Beta Release Strategy) Karar 4'ünü (Keystore Stratejisi) **somut bir mimariye** dönüştürüyor.

## Bağlam

Sprint 7.5 analizi (`docs/sprint-7.5-signing-architecture-analysis.md`), `android/app/build.gradle`'da **hiçbir `signingConfigs` bloğu olmadığını** ve `.gitignore`'daki keystore koruma satırlarının **aktif olmadığını** gerçek dosya incelemesiyle kanıtladı. Bu ADR, bu boşluğu dolduracak mimariyi tanımlıyor — **hiçbir keystore bu ADR'nin yazımı sırasında oluşturulmadı**.

## Karar 1 — Kimlik Bilgisi Taşıma Mekanizması: `local.properties`

Keystore yolu/şifre/alias, **`android/local.properties`** üzerinden okunur (Gradle'ın zaten `rootProject.file('local.properties')` ile native olarak desteklediği, standart Android mekanizması). **Alternatifler değerlendirildi ve reddedildi:**

- **Ortam değişkenleri (CI/CD için tipik):** Bahçem Mobile'ın bugün bir CI/CD boru hattı YOK (her build elle, geliştiricinin kendi makinesinde yapılıyor) — ortam değişkenleri gereksiz bir soyutlama katmanı olurdu (YAGNI).
- **`build.gradle` içine doğrudan yazma:** Kesinlikle REDDEDİLDİ — bu dosya git'e commit edilir, şifreleri herkese açık hale getirir.
- **Ayrı bir `keystore.properties` dosyası:** Teknik olarak mümkün, ama `local.properties` ZATEN `.gitignore`'da var ve Android'in kendi geleneksel "yerel, commit edilmeyen ayarlar" dosyası — yeni bir dosya icat etmek yerine MEVCUT deseni kullanmak (Kural 4).

## Karar 2 — `signingConfigs` Yapısı

`android/app/build.gradle`'a TEK bir `release` signing config eklenir (bkz. `release-signing-guide.md` Adım 5'in tam kodu). **Debug build type'a HİÇBİR değişiklik yapılmaz** — mevcut, kanıtlanmış debug-imzalı akış (Sprint 6-7.4 boyunca kullanılan) korunur.

## Karar 3 — `minifyEnabled` Düzeltmesi (Gerçek Bulgu)

**ADR 0025'in taslak metni yanlış bir varsayım içeriyordu** ("Beta için genellikle `true` olur") — Sprint 7.5'in gerçek dosya incelemesi, `minifyEnabled false` olduğunu kanıtladı. Bu ADR, bunu **bilinçli bir karar olarak** onaylıyor: **Beta aşamasında `minifyEnabled: false` KALACAK.**

**Gerekçe:** Kod küçültme (R8/ProGuard), yanlış yapılandırılırsa GERÇEK ÇALIŞMA ZAMANI HATALARINA yol açabilir (özellikle WebView tabanlı bir Capacitor uygulamasında, native köprü sınıflarının yanlışlıkla kaldırılması riski). Beta aşamasının amacı **kararlılığı doğrulamak** — bu aşamada `minifyEnabled: true`'ya geçmenin getirdiği risk, kazanacağı APK boyutu avantajından DAHA ÖNEMLİ. **1.0 Release öncesi**, `proguard-rules.pro`'nun gerçek bir denetimiyle birlikte `minifyEnabled: true`'ya geçiş AYRI bir sprintte değerlendirilmelidir.

## Karar 4 — `.gitignore` Güvenlik Düzeltmesi

`android/.gitignore`'daki şu satırlardaki `#` işaretlerinin kaldırılması (aktifleştirilmesi) ÖNERİLİR:

```diff
- #*.jks
- #*.keystore
+ *.jks
+ *.keystore
```

**Bu bir "keystore oluşturma" veya "signingConfigs ekleme" işlemi DEĞİLDİR** — sadece gelecekte yanlışlıkla bir keystore dosyasının commit edilmesini önleyen bir güvenlik ayarıdır. Kullanıcının Sprint 7.5 yasağı ("keystore oluşturma/şifre üretme/sahte Release APK") bu kapsama girmiyor gibi görünse de, **bu ADR bunu bir ÖNERİ olarak sunar, otomatik uygulamaz** — gerçek uygulama, kullanıcının Sprint 7.5 Teknik Raporu'ndaki onayına bağlıdır.

## Karar 5 — Debug ve Release Ayrımının Netleştirilmesi

| | Debug (bugüne kadar kullanılan) | Release (bu ADR'nin konusu) |
|---|---|---|
| İmza | Otomatik/geçici (Android Studio veya `~/.android/debug.keystore`) | `bahcem-release-key` alias'lı kalıcı keystore |
| `minifyEnabled` | `false` (varsayılan) | `false` (Karar 3 gereği, bilinçli) |
| Kullanım Amacı | Geliştirme, Sprint 7.1-7.4'te GERÇEK cihazda test edilen build | Beta/Production dağıtımı |
| Google Play Uyumluluğu | ❌ Kabul edilmez | ✅ Gerekli |

## Sonuç

Bu ADR, Release Signing için **mimariyi** tanımlıyor — **gerçek keystore, kullanıcının kendi ortamında `release-signing-guide.md`'yi takip ederek oluşturulacak**. Bu ADR'nin kendisi hiçbir kod dosyasını DEĞİŞTİRMEDİ (sadece bu belge yazıldı) — `signingConfigs` bloğunun `build.gradle`'a gerçekten eklenmesi, kullanıcının kendi ortamındaki bir sonraki adımdır.
