# Sprint 7.5 — Release Signing Mimarisi Analiz Raporu

**Tarih:** 2026-07-18 · **Kural:** Hiçbir değişiklik yapılmadan ÖNCE hazırlanan analiz. Tüm bulgular gerçek dosyalar okunarak elde edildi — varsayılmadı.

---

## 1. `android/app/build.gradle` — Gerçek Durum

```gradle
android {
    namespace = "com.bahcem.mobile"
    compileSdk = rootProject.ext.compileSdkVersion   // = 36
    defaultConfig {
        applicationId "com.bahcem.mobile"
        minSdkVersion rootProject.ext.minSdkVersion       // = 24
        targetSdkVersion rootProject.ext.targetSdkVersion // = 36
        versionCode 2
        versionName "0.1.0-beta.1"
        ...
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Gerçek bulgular:**
1. **`signingConfigs` bloğu tamamen YOK.** `release` build type, hiçbir `signingConfig { ... }` referansı içermiyor — bu, Gradle'ın `release` derlemesini **varsayılan olarak imzasız** bırakması, ya da (Android Studio kullanılıyorsa) IDE'nin kendi geçici "debug" imzasını kullanması anlamına gelir. Kalıcı, kontrollü bir imzalama **yok**.
2. **`minifyEnabled false`** — ADR 0025'in (Sprint 7.3'te yazdığım) taslak metninde "genellikle `true` olur" şeklinde bir GENEL VARSAYIM vardı; gerçek dosya bunun `false` olduğunu gösteriyor. **Bu, ADR 0025'te düzeltilmesi gereken bir yanlışlık** — bu raporda kayıt altına alınıyor, ADR güncellenecek.
3. **Firebase/`google-services.json` koşullu entegrasyonu var** (try/catch ile "dosya yoksa uygulama") — bugün dosya YOK, bu yüzden plugin uygulanmıyor. Bu, imzalama ile DOĞRUDAN ilgili değil ama gelecekte Push Notification eklenirse SHA-1/SHA-256 parmak izinin Firebase Console'a girilmesi gerekeceğini işaret ediyor (Rehber'de bu bilgi verilecek).

## 2. `android/build.gradle` (Proje Kökü) — Gerçek Durum

- **Android Gradle Plugin (AGP): `8.13.0`**
- **Gradle Wrapper: `8.14.3`** (`gradle-wrapper.properties`'ten doğrulandı)
- Bu iki sürüm **birbiriyle uyumlu** (AGP 8.13, Gradle 8.13+ gerektirir — 8.14.3 bu şartı karşılıyor).

## 3. `android/variables.gradle` — SDK Sürümleri

| Değişken | Değer |
|---|---|
| `minSdkVersion` | 24 (Android 7.0 Nougat) |
| `compileSdkVersion` | 36 |
| `targetSdkVersion` | 36 |

**Not:** `targetSdkVersion 36`, Google Play'in **güncel** hedef SDK zorunluluklarıyla uyumlu (Play Store, düzenli olarak minimum targetSdk şartı yükseltir — 36 bugün için güncel, ama Beta/Release süreci uzarsa bu şart TEKRAR değişebilir, bu bir izleme noktası).

## 4. `android/gradle.properties` — Gerçek Durum

Sadece standart Gradle/AndroidX ayarları var (`org.gradle.jvmargs`, `android.useAndroidX=true`). **Hiçbir imzalama kimlik bilgisi (şifre, alias) burada YOK** — bu doğru bir başlangıç durumu (kimlik bilgileri BURAYA da YAZILMAMALI, Rehber'de bunun yerine önerilecek yöntem açıklanacak).

## 5. `local.properties` — Gerçek Durum

**Dosya bugün mevcut DEĞİL** (`ls` ile doğrulandı). Bu, normal bir durum — bu dosya genelde Android Studio tarafından ilk açılışta otomatik oluşturulur (SDK yolu için). Rehber'de, imzalama kimlik bilgilerinin BURAYA eklenmesi önerilecek (zaten `.gitignore`'da aktif olarak hariç tutulmuş durumda — doğrulandı).

## 6. 🔴 `.gitignore` — KRİTİK GÜVENLİK BULGUSU

`android/.gitignore` dosyasında:

```
# Keystore files
# Uncomment the following lines if you do not want to check your keystore files in.
#*.jks
#*.keystore
```

**Bu iki satır YORUM SATIRI olarak bırakılmış — aktif DEĞİL.** Yani bugün, eğer bir `.jks`/`.keystore` dosyası `android/` klasörünün içine konursa, **`git add .` ile yanlışlıkla commit edilebilir**. Bu, Release Signing Rehberi'nin en kritik güvenlik uyarısı olacak — **kullanıcının kendi bilgisayarında bu satırların yorumdan çıkarılması (aktifleştirilmesi) gerekiyor**, ben bunu BURADAN değiştiremem (bu, kullanıcının kendi ortamındaki bir dosya — ama mevcut proje deposundaki `.gitignore`'u BEN güncelleyebilirim, çünkü bu KOD DEĞİŞİKLİĞİ değil, güvenlik yapılandırması; aşağıda bu ayrımı netleştiriyorum).

**Önemli ayrım:** `.gitignore` düzeltmesi, "keystore oluşturma" veya "signingConfigs ekleme" DEĞİL — sadece gelecekte yanlışlıkla bir keystore dosyasının commit edilmesini ÖNLEYEN bir güvenlik ayarı. Kullanıcının yasağı ("keystore oluşturma, signingConfigs ekleme, şifre üretme") bunu KAPSAMIYOR gibi görünüyor, ama emin olmak için bu raporu SUNUP, `.gitignore` düzeltmesini AYRI bir onay maddesi olarak İŞARETLİYORUM — kod/config değişikliği olduğu için tek taraflı yapmıyorum.

## 7. `capacitor.config.ts` — İmzalama ile İlgisi

Doğrudan bir imzalama ayarı İÇERMİYOR (`appId`/`appName`/`webDir`/SQLite plugin ayarları var). **Önemli bir kavramsal ayrım:** `androidIsEncryption: true` (ADR 0004), **veritabanı şifrelemesi** için — bu, **APK imzalama keystore'undan TAMAMEN FARKLI bir güvenlik mekanizması**. İkisi de "Android Keystore" terimini içerebilir ama biri "çalışma zamanı gizli değer deposu", diğeri "APK'nın kriptografik imzası". Bu rapor ve Rehber'de bu ikisi AÇIKÇA ayrıştırılacak — kullanıcının kafası KARIŞMASIN.

## 8. `src/config/brand.ts` — Yeni Keşfedilen, İlgili Bir Dosya

ADR 0013'ten gelen bu dosya, `BRAND.displayName`/`playStoreName`/`packageName` alanlarını merkezileştiriyor. **Kendi belgesindeki açık not:** `packageName`'in DEĞİŞTİRİLMESİ, native `android/app/build.gradle`'daki gerçek paket adını OTOMATİK GÜNCELLEMEZ — bu, "Play Store yayını öncesi ayrı bir çalışma" olarak zaten işaretlenmiş. Bu, Release Architecture belgesinde referans verilecek ama bu sprintte `brand.ts`'e DOKUNULMAYACAK (kapsam dışı).

## Sonuç — Analiz Özeti

| Bulgu | Durum |
|---|---|
| `signingConfigs` | ❌ Yok — Rehber'de adım adım anlatılacak, BEN oluşturmayacağım |
| AGP/Gradle sürümleri | ✅ Uyumlu (8.13.0 / 8.14.3) |
| `minifyEnabled` | `false` (ADR 0025'in yanlış varsayımı düzeltilecek) |
| `.gitignore` keystore koruması | 🔴 **Aktif değil — düzeltme öneriliyor, ayrı onay bekliyor** |
| `local.properties` | Yok, normal — Rehber'de kimlik bilgisi taşıyıcısı olarak önerilecek |
| SQLCipher şifreleme vs. APK imzalama | Kavramsal olarak FARKLI, karıştırılmamalı |
