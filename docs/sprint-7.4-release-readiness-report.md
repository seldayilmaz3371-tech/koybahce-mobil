# Sprint 7.4 — Release Readiness Report

**Tarih:** 2026-07-18 · **Kapsam:** Beta Release'e giden yolda kalan gerçek engeller.

## Bu Sprintte Yapılanlar

| İş | Durum |
|---|---|
| `versionCode: 1 → 2` | ✅ Uygulandı |
| `versionName: "1.0" → "0.1.0-beta.1"` | ✅ Uygulandı |
| `package.json version: "0.0.0" → "0.1.0-beta.1"` | ✅ Uygulandı |
| Beta adı: "Bahçem Mobile Beta 1" | ✅ Onaylandı, belgelendi |
| ADR 0025 durumu güncellendi | ✅ Kısmen kabul edildi |
| **Keystore oluşturma** | ❌ **Bilinçli olarak yapılmadı** (kullanıcı yasağı) |
| **`signingConfigs` eklenmesi** | ❌ **Bilinçli olarak yapılmadı** (kullanıcı yasağı) |
| **Release APK üretimi** | ❌ **Bilinçli olarak yapılmadı** (kullanıcı yasağı) |

## Gerçek Doğrulama

`npm run lint` çıktısı artık `bahcem-mobile@0.1.0-beta.1` gösteriyor — `package.json`'ın gerçekten okunduğunun kanıtı. 484/484 test hâlâ geçiyor, build/lint/`cap sync` temiz, bundle boyutu değişmedi.

## Beta Release'e Giden Yolda Kalan Gerçek Engeller (Öncelik Sırasıyla)

### 1. 🔴 İmzalama (En Kritik Engel)
`android/app/build.gradle`'da hâlâ `signingConfigs` yok. **Bir Release APK, imzasız üretilemez veya üretilse bile hiçbir cihaza güvenli şekilde dağıtılamaz.** ADR 0025 Karar 4'ün gerçek uygulanması gerekiyor: `keytool` ile bir `.jks` dosyası oluşturulmalı, `.gitignore`'a eklenmeli, şifreler proje deposu DIŞINDA saklanmalı.

**Bu, bir sonraki sprintin (Sprint 7.5?) TEK VE EN ÖNEMLİ görevi olmalı** — kullanıcının açık bir kararı ve muhtemelen kendi bilgisayarında (bu sandbox ortamında değil — keystore şifresi/dosyası HİÇBİR ZAMAN bu tür bir geçici ortamda oluşturulup kaybedilmemeli, bu GERÇEK bir veri kaybı riski taşır, Android'in kendi kısıtı: keystore kaybedilirse aynı `applicationId` ile güncelleme yayınlamak İMKANSIZ hale gelir) gerçekleştirmesi gereken bir adım.

### 2. 🟡 Gerçek Cihaz Tam Doğrulama
`docs/sprint-6-apk-device-test-plan.md`'nin **zorunlu** test seti (APK-001/002, INSTALL-001-005, AI-001-009/012/014, DB-001-005, UX-002, ERR-001/003, SEC-001/002/003/005, PERM-001/002) henüz **tam olarak** çalıştırılmadı — Sprint 7.2'de sadece bir alt küme (açılış, parsel listesi, SQLite, AI Ayarları, Secure Storage kaydı, AI ekranı, galeri) doğrulanmıştı.

### 3. 🟢 Git Tag (Düşük Risk, Hazır)
ADR 0025 Karar 7'ye göre, tag SADECE **gerçekten dağıtılan** bir build için atılmalı — bu yüzden `v0.1.0-beta.1` tag'i, **imzalı bir Beta APK gerçekten üretilip test edildikten SONRA** atılmalı, şimdi DEĞİL (versiyon numarası kod tabanına yazıldı ama henüz "dağıtılan" bir şey yok).

## Sonuç

Versiyon numaralandırması artık **gerçek ve kod tabanında** — ama Beta Release'in **gerçek engeli hâlâ imzalama**. Bu sprint, imzalama YAPMADAN, sadece versiyon altyapısını hazırladı — kullanıcının açık talimatına tam uyuldu.
