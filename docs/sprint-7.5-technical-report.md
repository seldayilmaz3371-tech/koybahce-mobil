# Sprint 7.5 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Bahçem Mobile Beta 1 için Güvenli Release Altyapısının (Belge Seviyesinde) Tamamlanması

## Yapılanlar

1. **Release Signing Mimarisi Analizi** (`sprint-7.5-signing-architecture-analysis.md`) — `build.gradle` (app + root), `variables.gradle`, `gradle.properties`, `local.properties` (yok), `.gitignore`, `capacitor.config.ts`, `proguard-rules.pro`, `src/config/brand.ts` **gerçekten okunarak** incelendi.
2. **Release Signing Rehberi** (`release-signing-guide.md`) — keytool/JKS/alias/SHA-1/SHA-256/Gradle/`local.properties`/güvenlik/`.gitignore` konularını adım adım, terminal çıktı örnekleriyle anlatan kapsamlı rehber.
3. **ADR 0026** (Release Signing Architecture) — kimlik bilgisi taşıma mekanizması, `signingConfigs` yapısı, `minifyEnabled` kararı, `.gitignore` güvenlik önerisi.
4. **Gerçek Cihaz Test Planı — Eksik Analizi** (`sprint-7.5-device-test-gap-analysis.md`) — Sprint 7.2'nin onayı ile 42 maddelik test planı çapraz karşılaştırıldı, kalan zorunlu testler 4 önceliğe ayrıldı.
5. **Beta Dağıtım Stratejisi** (`beta-distribution-strategy.md`) — Doğrudan APK / Play Internal Testing / Play Closed Testing üç seçenek objektif karşılaştırıldı.
6. **Beta Release Checklist** (`beta-release-checklist.md`) — tüm bulgular tek bir kontrol listesinde birleştirildi.

## Yapılmayanlar (Kullanıcının Açık Yasağı Gereği)

- ❌ Hiçbir keystore/`.jks` dosyası oluşturulmadı.
- ❌ Hiçbir şifre üretilmedi.
- ❌ `android/app/build.gradle`'a `signingConfigs` bloğu **eklenmedi** (sadece Rehber'de örnek kod olarak gösterildi).
- ❌ `android/.gitignore` **değiştirilmedi** (sadece ADR 0026'da öneri olarak sunuldu, ayrı onay bekliyor).
- ❌ Gerçek/sahte hiçbir Release APK üretilmedi.

## 🔴 Gerçek Bulgular (Bu Sprintte Ortaya Çıktı)

1. **`android/.gitignore`'da `*.jks`/`*.keystore` satırları YORUM olarak bırakılmış** — aktif değil, gerçek bir güvenlik açığı riski.
2. **ADR 0025'in taslak metninde bir yanlışlık vardı** — "Beta için `minifyEnabled` genellikle `true` olur" demişti, gerçek dosya `false` olduğunu gösterdi. ADR 0026 ile düzeltildi.
3. **Sprint 7.2'nin onayladığı test kapsamı, `sprint-6-apk-device-test-plan.md`'nin zorunlu listesinin küçük bir alt kümesiydi** — Güvenlik (SEC-*), Veri Bütünlüğü (INSTALL-003/004/005, DB-003/004) ve AI Hata Senaryolarının (AI-006/007/008/009/012/014) **hiçbiri** henüz test edilmedi.
4. **`src/config/brand.ts`** (ADR 0013) yeni keşfedildi — Beta adının nereye yazılabileceğine dair bir referans noktası, ama bu sprintte DOKUNULMADI.

## Testler

Bu sprint **saf dokümantasyon** olduğu için (kullanıcının açık talimatı: "kod yazmaktan çok Release sürecini profesyonel seviyeye getirmek"), **hiçbir yeni otomatik test yazılmadı**. Mevcut testlerin regresyona uğramadığı, her belge değişikliğinden sonra `tsc -b` ile doğrulandı (kod dokunulmadığının kanıtı) — **`npm run test` bu sprintte tekrar ÇALIŞTIRILMADI çünkü hiçbir kod değişmedi, bunu koşmuş gibi raporlamıyorum.**

## Riskler

| Risk | Açıklama |
|---|---|
| Keystore kaybı | Rehber'de vurgulandı — kullanıcının kendi sorumluluğunda, geri dönüşü yok |
| Test kapsamının dar olması | `sprint-6-apk-device-test-plan.md`'nin çoğu zorunlu maddesi hâlâ test edilmedi — Beta'nın gerçek riskleri (güvenlik, veri bütünlüğü) henüz KANITLANMADI |
| `.gitignore` düzeltmesinin uygulanmaması | Kullanıcı onaylamazsa, keystore yanlışlıkla commit edilme riski **açık kalır** |
| Google Play politika değişiklikleri | Closed Testing şartları (20 kullanıcı/14 gün gibi) GÜNCEL DEĞİŞEBİLİR — `beta-distribution-strategy.md`'de bu AÇIKÇA belirtildi, varsayılmadı |

## Sonraki Sprint Önerisi (Sprint 7.6)

1. Kullanıcının kendi ortamında `release-signing-guide.md`'yi uygulaması (bu proje dışında bir adım).
2. `.gitignore` düzeltmesinin onaylanıp uygulanması (küçük, düşük riskli bir kod/config değişikliği).
3. `sprint-7.5-device-test-gap-analysis.md`'nin **Öncelik 1 (Güvenlik)** maddelerinin gerçek cihazda test edilmesi.
4. İlk gerçek imzalı Beta APK'sının üretimi ve dağıtımı.
