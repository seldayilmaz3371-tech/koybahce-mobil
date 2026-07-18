# Bahçem Mobile Beta 1 — Release Checklist

**Tarih:** 2026-07-18 (Sprint 7.5) · **Amaç:** Beta APK'sının GERÇEKTEN dağıtılmasından ÖNCE tamamlanması gereken HER ŞEYİN tek bir yerde toplanması.

## Bölüm 1 — Kod/Sürüm Hazırlığı

- [x] `versionCode: 2` (Sprint 7.4'te uygulandı)
- [x] `versionName: "0.1.0-beta.1"` (Sprint 7.4'te uygulandı)
- [x] `package.json version: "0.1.0-beta.1"` (Sprint 7.4'te uygulandı)
- [x] Beta adı onaylandı: "Bahçem Mobile Beta 1"
- [x] 484/484 test geçiyor, `tsc`/lint/build/`cap sync` temiz (Sprint 7.4'te doğrulandı)

## Bölüm 2 — İmzalama (KULLANICININ KENDİ ORTAMINDA)

- [ ] `release-signing-guide.md`'nin 1-6. adımları tamamlandı (keystore oluşturuldu, güvenli saklandı)
- [ ] `android/app/build.gradle`'a `signingConfigs` bloğu eklendi (Adım 5)
- [ ] `android/local.properties` dosyası oluşturuldu, git'e commit EDİLMEDİĞİ doğrulandı
- [ ] `android/.gitignore`'daki `*.jks`/`*.keystore` satırları aktifleştirildi (ADR 0026 Karar 4 — öneri)
- [ ] İmzalı Release APK/AAB **kullanıcının kendi ortamında** üretildi (`./gradlew assembleRelease`)
- [ ] İmza `keytool -printcert -jarfile ...` ile doğrulandı

## Bölüm 3 — Gerçek Cihaz Testleri (bkz. `sprint-7.5-device-test-gap-analysis.md`)

- [ ] **Öncelik 1 — Güvenlik:** SEC-001, SEC-002, SEC-003, SEC-005 (HEPSİ zorunlu, hiçbiri henüz test edilmedi)
- [ ] **Öncelik 2 — Veri Bütünlüğü:** INSTALL-003/004/005, DB-003/004 (HEPSİ zorunlu)
- [ ] **Öncelik 3 — AI Hata Senaryoları:** AI-006/007/008/009/012/014 (HEPSİ zorunlu)
- [ ] **Öncelik 4 — Yaşam Döngüsü/İzinler:** UX-002, PERM-001/002 (HEPSİ zorunlu)
- [x] Temel smoke-test (Sprint 7.2'de kısmen doğrulandı — açılış, parsel listesi, SQLite okuma, AI Ayarları, API anahtarı kaydı, AI ekranı, galeri)

## Bölüm 4 — Dağıtım Kararları (bkz. `beta-distribution-strategy.md`)

- [ ] Dağıtım yöntemi seçildi (Seçenek A/B/C — öneri: A, doğrudan APK)
- [ ] İlk Beta kullanıcı grubu belirlendi (öneri: 2-5 gerçek çiftçi)
- [ ] Release Notes hazırlandı

## Bölüm 5 — Git/Dokümantasyon

- [ ] Git Tag `v0.1.0-beta.1` atıldı — **SADECE** Bölüm 2-3 TAMAMLANDIKTAN ve APK GERÇEKTEN dağıtıldıktan SONRA (ADR 0025 Karar 7)
- [x] `BUILD_INFO.md` güncel
- [x] `module-status.md` güncel
- [x] İlgili ADR'ler (0024/0025/0026) güncel

## 🔴 Şu Anki Durum (Sprint 7.5 Sonu)

**Bölüm 1 ve 5 TAMAMLANDI. Bölüm 2, 3, 4 HENÜZ BAŞLAMADI** — bunların hepsi kullanıcının kendi kararı/ortamı gerektiriyor, bu sprint sadece BUNLARI belgelemekle görevliydi.

**Beta'nın gerçekten dağıtılabilmesi için minimum gereksinim:** Bölüm 2 (imzalama) TAMAMLANMALI + Bölüm 3'ün EN AZ Öncelik 1 (Güvenlik) maddeleri geçilmeli. Bölüm 3'ün geri kalanı, ilk Beta dalgasından SONRA da tamamlanabilir (riski kullanıcı kabul ederse) — ama bu, **kullanıcının bilinçli bir kararı** olmalı, varsayılan davranış DEĞİL.
