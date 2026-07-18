# Bahçem Mobile — Release Signing Rehberi

**Kimin İçin:** Android Studio veya keystore konusunda HİÇ deneyimi olmayan biri için, adım adım.
**Nerede Uygulanacak:** **SADECE kendi bilgisayarınızda.** Bu rehberdeki HİÇBİR adım bu proje deposunda (Claude'un çalıştığı ortamda) uygulanmamıştır ve uygulanmamalıdır.
**Neden:** Bir Android uygulamasının Google Play'e veya güvenilir bir Beta kanalına dağıtılabilmesi için **kriptografik olarak imzalanması** gerekir. Bu imza, "bu APK gerçekten Bahçem Mobile'ın geliştiricisinden geliyor" garantisini verir.

---

## 🔴 En Önemli Kural — Baştan Okuyun

**Oluşturacağınız keystore dosyasını ve şifrelerini KAYBEDERSENİZ**, `com.bahcem.mobile` paket adıyla **bir daha ASLA güncelleme yayınlayamazsınız** — Google Play dahil hiçbir yerde. Bu, Android'in kendi kuralı, geri dönüşü YOKTUR. Bu yüzden bu rehberin **6. Adımı (Güvenli Saklama)** en az imzalama işleminin kendisi kadar önemlidir.

---

## Ön Gereksinimler

1. Bilgisayarınızda **Java Development Kit (JDK)** kurulu olmalı — `keytool` komutu JDK'nın bir parçasıdır. Android Studio kuruluysa JDK zaten YANINDA gelir.
2. Bir **terminal** (Mac/Linux: Terminal, Windows: PowerShell veya Command Prompt) açmayı bilmeniz yeterli — Android Studio'nun GUI'sini kullanmanıza GEREK YOK, ama isterseniz Android Studio'nun kendi "Generate Signed Bundle/APK" sihirbazı da aynı işi görsel olarak yapar (bu rehber terminal yolunu anlatıyor, çünkü her işletim sisteminde AYNI şekilde çalışır ve tam olarak ne yaptığınızı GÖRMENİZİ sağlar).

### `keytool` Kurulu mu? (Doğrulama)

Terminali açın ve şunu yazın:

```bash
keytool -version
```

**Beklenen çıktı** (sürüm numarası farklı olabilir, önemli olan bir HATA vermemesi):
```
keytool 21.0.x
```

Eğer `command not found` gibi bir hata alırsanız, JDK kurulu değildir veya `PATH`'e eklenmemiştir — Android Studio'yu kurup, onun kendi JDK'sının `bin` klasörünü kullanabilirsiniz (Android Studio kurulum klasörü içinde `jbr/bin/keytool` şeklinde bulunur).

---

## Adım 1 — Keystore (`.jks`) Dosyasını Oluşturma

Terminalde, **proje deposunun DIŞINDA** bir klasöre gidin (ör. `~/bahcem-keystore/` gibi ayrı, güvenli bir klasör — **ASLA proje klasörünün İÇİNE değil**, aşağıda nedenini açıklıyoruz):

```bash
mkdir ~/bahcem-keystore
cd ~/bahcem-keystore
```

Şimdi keystore'u oluşturan komutu çalıştırın:

```bash
keytool -genkeypair -v \
  -keystore bahcem-release.jks \
  -alias bahcem-release-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Bu komut sizden şunları SIRAYLA soracak** (her birine terminal üzerinden yazıp Enter'a basacaksınız):

```
Enter keystore password:                    ← Keystore'un ANA şifresi (Adım 3'e bakın — güçlü bir şifre seçin)
Re-enter new password:                       ← Aynı şifreyi tekrar yazın
What is your first and last name?
  [Unknown]:  Bahçem Mobile                 ← Geliştirici/organizasyon adı, serbest metin
What is the name of your organizational unit?
  [Unknown]:  Development
What is the name of your organization?
  [Unknown]:  Bahçem Mobile
What is the name of your City or Locality?
  [Unknown]:  Istanbul
What is the name of your State or Province?
  [Unknown]:  Istanbul
What is the two-letter country code for this unit?
  [Unknown]:  TR
Is CN=Bahçem Mobile, OU=Development, O=Bahçem Mobile, L=Istanbul, ST=Istanbul, C=TR correct?
  [no]:  yes                                 ← "yes" yazıp Enter
Enter key password for <bahcem-release-key>
        (RETURN if same as keystore password):   ← Boş bırakıp Enter'a basarsanız keystore şifresiyle AYNI olur (basitlik için ÖNERİLİR, ikisini FARKLI tutmak istiyorsanız ayrı bir şifre girebilirsiniz)
```

**İşlem başarılı olursa**, aynı klasörde `bahcem-release.jks` adında bir dosya oluşacak. Bunu doğrulayın:

```bash
ls -la bahcem-release.jks
```

**Beklenen çıktı:** Dosyanın var olduğunu ve birkaç KB boyutunda olduğunu gösteren bir satır.

### Komuttaki Her Parametrenin Anlamı

| Parametre | Anlamı |
|---|---|
| `-genkeypair` | Yeni bir anahtar çifti (public/private key) oluştur |
| `-keystore bahcem-release.jks` | Oluşturulacak dosyanın adı — **istediğiniz adı verebilirsiniz**, `bahcem-release.jks` sadece bir öneri |
| `-alias bahcem-release-key` | Bu keystore İÇİNDEKİ bu belirli anahtarın **takma adı** — bir keystore dosyası TEORİK olarak birden fazla anahtar taşıyabilir, alias hangisini kullanacağınızı belirtir |
| `-keyalg RSA` | Kullanılacak şifreleme algoritması — Android'in standart, önerilen algoritması |
| `-keysize 2048` | Anahtar uzunluğu (bit) — 2048, Google'ın Play Store için **minimum önerdiği** güvenlik seviyesi |
| `-validity 10000` | Anahtarın geçerlilik süresi (gün) — 10.000 gün ≈ **27 yıl**, Google'ın kendi önerisi (uygulamanın kullanım ömrü boyunca geçerli olmalı) |

---

## Adım 2 — Alias Nedir, Neden Önemli?

**Alias**, bir keystore dosyası İÇİNDEKİ **belirli bir anahtarın adıdır**. Bir keystore dosyasında teorik olarak birden fazla anahtar (farklı alias'larla) olabilir, ama Bahçem Mobile için **TEK bir alias** (`bahcem-release-key`) yeterlidir — bunu **HER ZAMAN aynı alias'la** imzalamanız gerekir, aksi halde Google Play "bu farklı bir uygulama" der ve güncellemeyi REDDEDER.

**Bu alias'ı bir yere NOT EDİN** — `local.properties`'e yazacaksınız (Adım 5).

---

## Adım 3 — SHA-1 ve SHA-256 Parmak İzini Alma

Bazı entegrasyonlar (ör. gelecekte Firebase/Push Notification eklenirse, veya Google API'leri) uygulamanızın **imza parmak izini** ister. Bunu şu komutla alabilirsiniz:

```bash
keytool -list -v -keystore bahcem-release.jks -alias bahcem-release-key
```

Sizden keystore şifresini soracak, girdikten sonra ÇOK sayıda bilgi arasında şunları göreceksiniz:

```
Certificate fingerprints:
         SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
         SHA256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Bu iki değeri de** (SHA1 ve SHA256) bir yere kaydedin — ileride Firebase Console'a veya başka bir Google servisine uygulamanızı kaydederken bu değerleri gireceksiniz. **Bunlar GİZLİ değildir** (parola değildir, sadece bir "kimlik" değeridir), ama yine de düzenli tutulmalıdır.

---

## Adım 4 — `local.properties`'e Kimlik Bilgilerini Ekleme

Proje deposunun `android/` klasöründe, `local.properties` adında bir dosya oluşturun **(eğer yoksa)** — bu dosya **zaten `.gitignore`'da hariç tutulmuş** (Sprint 7.5 analizinde doğrulandı), yani git'e ASLA gitmez:

```
android/local.properties
```

İçine şunu ekleyin (kendi gerçek değerlerinizle):

```properties
BAHCEM_RELEASE_STORE_FILE=/Users/sizin-kullanici-adiniz/bahcem-keystore/bahcem-release.jks
BAHCEM_RELEASE_KEY_ALIAS=bahcem-release-key
BAHCEM_RELEASE_STORE_PASSWORD=buraya-keystore-sifreniz
BAHCEM_RELEASE_KEY_PASSWORD=buraya-anahtar-sifreniz
```

**Not:** `BAHCEM_RELEASE_STORE_FILE`, keystore dosyanızın **tam yolu** olmalı (Adım 1'de oluşturduğunuz `~/bahcem-keystore/bahcem-release.jks` dosyasının bilgisayarınızdaki gerçek konumu).

---

## Adım 5 — `build.gradle`'a `signingConfigs` Ekleme

**Bu adımı SİZ kendi bilgisayarınızda yapacaksınız** — `android/app/build.gradle` dosyasını bir metin editörüyle açın ve `android { ... }` bloğunun İÇİNE, `defaultConfig { ... }` bloğundan SONRA şunu ekleyin:

```gradle
android {
    // ... mevcut namespace/compileSdk/defaultConfig İÇERİĞİ DEĞİŞMEDEN kalır ...

    signingConfigs {
        release {
            def localProps = new Properties()
            def localPropsFile = rootProject.file('local.properties')
            if (localPropsFile.exists()) {
                localProps.load(new FileInputStream(localPropsFile))
            }
            storeFile localProps['BAHCEM_RELEASE_STORE_FILE'] ? file(localProps['BAHCEM_RELEASE_STORE_FILE']) : null
            storePassword localProps['BAHCEM_RELEASE_STORE_PASSWORD']
            keyAlias localProps['BAHCEM_RELEASE_KEY_ALIAS']
            keyPassword localProps['BAHCEM_RELEASE_KEY_PASSWORD']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Bu kod parçası neden `local.properties`'ten okuyor, şifreleri DOĞRUDAN yazmıyor?** Çünkü `build.gradle` dosyası **git'e commit edilir** (proje deposunun bir parçasıdır) — şifreleri DOĞRUDAN buraya yazarsanız, GitHub'a (veya herhangi bir versiyon kontrolüne) gönderdiğinizde şifreleriniz **herkese açık hale gelir**. `local.properties` ise **hiçbir zaman commit edilmez** (zaten `.gitignore`'da), bu yüzden gizli bilgiler orada güvende kalır.

---

## Adım 6 — Güvenli Saklama (EN KRİTİK ADIM)

1. **Keystore dosyasını (`bahcem-release.jks`) proje deposunun DIŞINDA tutun** — asla `bahcem-mobile/` klasörünün içine kopyalamayın.
2. **En az bir yedek kopya** alın — harici bir disk, şifreli bir bulut depolama (ör. şifreli bir ZIP olarak) gibi.
3. **Şifreleri bir şifre yöneticisinde** (1Password, Bitwarden vb.) saklayın — asla düz metin bir dosyada (`.txt`, notlar uygulaması) bırakmayın.
4. **Ekip büyürse**, keystore'u paylaşmanız gerekebilir — bunu güvenli bir kanaldan (şifreli dosya transferi) yapın, ASLA e-posta/Slack'e düz dosya olarak eklemeyin.

---

## Adım 7 — GitHub'a Yanlışlıkla Yüklemeyi Önleme (Sprint 7.5 Analizinde Bulunan Gerçek Bulgu)

**🔴 Gerçek bir güvenlik açığı bulundu:** `android/.gitignore` dosyasında şu satırlar **YORUM olarak bırakılmış**:

```
#*.jks
#*.keystore
```

Bu, `#` işareti KALDIRILMADIĞI sürece **aktif değil** — yani bir `.jks` dosyası proje klasörüne (yanlışlıkla) konursa, git tarafından GÖRMEZDEN GELİNMEZ, commit edilebilir. **Bu satırların başındaki `#` işaretini kaldırmanız önerilir** (bu proje deposunun kendi `.gitignore`'unda — ayrı bir onay maddesi olarak sunuluyor, Sprint 7.5 Teknik Raporu'na bakın).

Ayrıca:
- Keystore dosyanızı Adım 1'de ZATEN proje deposu DIŞINDA oluşturduğunuz için, bu risk zaten en aza indirilmiş olur.
- Commit etmeden önce her zaman `git status` ile "eklenecek dosyalar" listesini KONTROL ETME alışkanlığı edinin.

---

## Adım 8 — Release APK/AAB Üretimi (Bu Rehberin Kapsamı — Gerçek Üretim DEĞİL)

Yukarıdaki adımları tamamladıktan SONRA, kendi bilgisayarınızda şu komutla imzalı bir Release APK üretebilirsiniz:

```bash
cd android
./gradlew assembleRelease
```

**Beklenen çıktı konumu:** `android/app/build/outputs/apk/release/app-release.apk`

Google Play için (APK yerine) genelde **AAB (Android App Bundle)** formatı tercih edilir:

```bash
./gradlew bundleRelease
```

**Beklenen çıktı konumu:** `android/app/build/outputs/bundle/release/app-release.aab`

### İmzanın Doğru Uygulandığını Doğrulama

```bash
keytool -printcert -jarfile android/app/build/outputs/apk/release/app-release.apk
```

Bu komutun çıktısında, Adım 1'de girdiğiniz "Bahçem Mobile" / "Istanbul" / "TR" gibi bilgilerin GÖRÜNMESİ, APK'nın doğru anahtarla imzalandığının kanıtıdır.

---

## Sık Yapılan Hatalar

| Hata | Neden | Çözüm |
|---|---|---|
| `keystore was tampered with, or password was incorrect` | Yanlış şifre girildi | `local.properties`'teki şifreyi kontrol edin |
| Gradle build "signingConfig not found" hatası | `signingConfigs` bloğu `buildTypes`'tan ÖNCE tanımlanmamış | Adım 5'teki kod sırasını kontrol edin |
| Google Play "APK imzası önceki sürümle eşleşmiyor" hatası | **FARKLI bir keystore/alias kullanıldı** | Aynı keystore + alias'ı HER ZAMAN kullanın — bu yüzden Adım 6 bu kadar kritik |
| `local.properties` git'e commit edildi (yanlışlıkla) | `.gitignore` bozulmuş/değiştirilmiş olabilir | `git rm --cached android/local.properties` ile geçmişten temizleyin, şifreleri DEĞİŞTİRİN (artık güvenli sayılmaz) |
