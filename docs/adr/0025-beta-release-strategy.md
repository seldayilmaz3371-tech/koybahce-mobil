# ADR 0025 — Beta Release Strategy

**Durum:** Taslak — kullanıcı onayı bekliyor
**Tarih:** 2026-07-17
**Kapsam:** Sprint 7.3, Madde 4. **Not:** Talimatta "ADR-0008" istenmişti — gerçek bir çakışma bulundu (`0008`, `docs/adr/0008-yedekleme-stratejisi.md` olarak zaten kayıtlı, ADR 0024'te izlenen desenle aynı şekilde doğru sıraya, **0025**'e taşındı).

## Bağlam

Modül 6 (AI Altyapısı) + Sprint 7.1-7.2 sonrası, proje ilk kez **gerçek bir Android cihazda çalışır** durumda (kullanıcının Sprint 7.2 onayında doğrulandı). Ancak `apk-beta-readiness-checklist.md`'nin bulduğu gibi, **imzalama yapılandırması eksik** ve **versiyon numaraları hiç güncellenmemiş** — bu ADR, bu boşlukları kalıcı bir strateji olarak kapatıyor.

## Karar 1 — Versioning Politikası

**SemVer ön-sürüm deseni benimsenir:** `MAJOR.MINOR.PATCH-beta.N`

- `0.x.y` → proje **henüz 1.0'a ulaşmadı** (planlanan modüllerin — Hasat/Hava Durumu/Harita/Fotoğraf Analizi/Sesli Asistan/RAG — tamamı bitmeden `1.0.0` kullanılmaz).
- `-beta.N` → her Beta dağıtımı, `N`'i bir artırır (`beta.1`, `beta.2`, ...).
- **Üç dosyada AYNI sürüm string'i** tutulur: `package.json` → `version`, `android/app/build.gradle` → `versionName`, Git Tag → `v` öneki eklenmiş hali. Bu, "hangisi doğru?" karışıklığını yapısal olarak önler.
- `versionCode` (Android'e özel, tam sayı) **ayrı** bir sayaçtır — her yayında (Beta dahil) **1 artar**, kullanıcıya hiç görünmez, sadece Google Play/cihazın "hangisi daha yeni" karşılaştırması için kullanılır.

## Karar 2 — Release Stratejisi

Üç aşamalı bir yayın modeli benimsenir:

1. **Debug (geliştirme boyunca):** Her sprint sonu, gerçek cihaz test döngüsü için debug-imzalı APK. Kalıcı dağıtım YOK.
2. **Beta (bu ADR'nin odağı):** Sınırlı bir kullanıcı grubuna (ör. birkaç gerçek çiftçi), gerçek saha koşullarında geri bildirim toplamak için. **İmzalı** (debug DEĞİL) ama Google Play'e YAYINLANMAZ — doğrudan APK dağıtımı veya (ileride) Play Console'un "Internal Testing" kanalı.
3. **Release (gelecek, bu ADR'nin kapsamı DIŞINDA):** Kamuya açık, Google Play üzerinden. Bu ADR bunu detaylandırmıyor — ayrı bir gelecek karar.

## Karar 3 — Debug/Release Farkları

| | Debug | Beta |
|---|---|---|
| İmzalama | Otomatik debug keystore (`~/.android/debug.keystore`) | **Gerçek bir keystore gerekli** (Karar 4) |
| `minifyEnabled` | Kontrol edilmeli (bu ADR'de doğrulanmadı — gerçek `build.gradle` incelemesi gerekiyor) | Genellikle `true` (kod küçültme, APK boyutu) |
| Dağıtım | Sadece geliştirme cihazına `adb install` | Sınırlı kullanıcı grubuna paylaşılan APK dosyası |
| `debugMode` (AI Ayarları) | Kullanıcı isteğe bağlı açabilir | Varsayılan **kapalı** kalmalı (Sprint 6'nın güvenli varsayılan ilkesi) |

## Karar 4 — Keystore Stratejisi

**Bu ADR bir keystore OLUŞTURMUYOR** — sadece stratejiyi belgeliyor, gerçek uygulama kullanıcı onayıyla ayrı bir adımda yapılacak:

1. Bir **release keystore** (`.jks` dosyası) oluşturulacak — `keytool -genkeypair` ile, **proje deposuna ASLA commit edilmeyecek** (`.gitignore`'a eklenmeli).
2. Keystore şifresi ve anahtar takma adı **güvenli bir yerde** (proje deposu DIŞINDA — ör. bir şifre yöneticisi) saklanacak — kaybedilirse, **aynı `applicationId` ile güncelleme yayınlamak imkansız hale gelir** (Android'in kendi kısıtı, geri dönüşü yok).
3. `android/app/build.gradle`'a bir `signingConfigs { beta { ... } }` bloğu eklenecek, gerçek kimlik bilgileri **ortam değişkenleri** veya **`local.properties`** (git'e commit edilmeyen) üzerinden okunacak — asla kaynak koduna gömülmeyecek.

## Karar 5 — APK Üretim Süreci

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug    # Debug için
./gradlew assembleRelease  # Beta/Release için (Karar 4'teki signingConfig kurulduktan SONRA)
```

Üretilen APK'nın **gerçek cihazda** `docs/sprint-6-apk-device-test-plan.md`'deki **zorunlu** test seti ile doğrulanması, dağıtımdan ÖNCE **zorunludur**.

## Karar 6 — Beta Dağıtım Süreci

1. APK üretilir, imzalanır (Karar 4).
2. `docs/sprint-6-apk-device-test-plan.md`'nin zorunlu testleri **en az bir gerçek cihazda** geçilir.
3. APK, sınırlı Beta kullanıcı grubuna **doğrudan dosya paylaşımıyla** dağıtılır (bu aşamada Google Play Console kullanılmıyor — ileride değerlendirilebilir).
4. Her Beta sürümüyle birlikte, kullanıcılara **neyin değiştiğine dair kısa bir not** (bu projenin `CHANGELOG` alışkanlığına uygun) paylaşılır.

## Karar 7 — Git Tag Politikası

- Her Beta yayını, `versionName` ile **birebir eşleşen** bir Git tag alır (ör. `v0.1.0-beta.1`).
- Tag'ler **sadece gerçekten dağıtılan** build'ler için oluşturulur — ara geliştirme commit'leri için tag ATILMAZ.
- Önceki modül kapanışlarında (`docs/git-tag-v0.2.0.md`/`v0.3.0.md`) önerilen tag'ler **hiç uygulanmamıştı** — bu ADR ile birlikte, **gerçek Beta yayınından itibaren** tag disiplini fiilen başlatılır.

## Sonuç

Bu ADR, **hiçbir dosyayı değiştirmeden**, Beta dağıtımına giden yolu kayıt altına alıyor. Gerçek uygulama (keystore oluşturma, `build.gradle` değişikliği, versiyon numaralarının yazılması) kullanıcının `sprint-7.3-version-proposal.md`'deki önerileri onaylamasından SONRA, ayrı bir adımda yapılacak.
