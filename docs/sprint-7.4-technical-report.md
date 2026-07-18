# Sprint 7.4 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Beta Versiyon Altyapısının Gerçekten Uygulanması

## 1. Yapılan İşler

Kullanıcının onayladığı öneri (`sprint-7.3-version-proposal.md`, Seçenek A) **gerçekten kod tabanına yazıldı**:

1. `android/app/build.gradle`: `versionCode 1 → 2`, `versionName "1.0" → "0.1.0-beta.1"`
2. `package.json`: `version "0.0.0" → "0.1.0-beta.1"`
3. Beta adı "Bahçem Mobile Beta 1" belgelerde resmileştirildi.
4. ADR 0025'in durumu "Taslak" → "Kısmen Kabul Edildi" olarak güncellendi (Karar 1 uygulandı, Karar 4 bilinçli olarak bekletildi).

**Kullanıcının açık yasağına tam uyuldu:** Hiçbir keystore oluşturulmadı, `signingConfigs` eklenmedi, Release APK üretilmedi.

## 2. Değişen Dosyalar

**Kod (sadece 2 satır, gerçek davranış değişikliği YOK):** `android/app/build.gradle`, `package.json`.

**Belgeler:** `docs/adr/0025-beta-release-strategy.md`, `docs/adr/README.md`, `BUILD_INFO.md`, `docs/module-status.md`, `docs/sprint-7.4-release-readiness-report.md` (yeni), bu rapor.

## 3. Test Özeti

| Metrik | Değer |
|---|---|
| Toplam test | **484/484** ✅ (değişmedi — bu sprint kod davranışı değiştirmedi) |
| `tsc -b` | ✅ Temiz |
| `oxlint` | ✅ 0 uyarı/hata — **çıktı artık `bahcem-mobile@0.1.0-beta.1` gösteriyor (gerçek kanıt)** |
| Regresyon | ❌ Yok |

## 4. Build/Bundle Doğrulaması

Bundle boyutu **tamamen değişmedi** (395.82kB ana + 346.40kB AI chunk) — beklenen, çünkü versiyon numarası değişikliği hiçbir kodu etkilemez. `cap sync`, 9 native plugin ile sorunsuz tamamlandı.

## 5. Release Readiness Raporu Özeti

Tam belge: `docs/sprint-7.4-release-readiness-report.md`. Özet: **Beta Release'e giden yolda kalan TEK kritik engel, imzalama.** Versiyon artık hazır, ama imzasız bir APK anlamlı şekilde dağıtılamaz. İkincil engel: `sprint-6-apk-device-test-plan.md`'nin zorunlu test setinin TAM olarak çalıştırılmamış olması.

## 6. Kalan Teknik Borçlar

**Yeni teknik borç oluşturulmadı.** Değişmeyen açık konular (Sprint 7.3'ten taşınan):

1. **İmzalama (keystore)** — En kritik, kullanıcının kendi ortamında (bu sandbox DEĞİL — keystore güvenliği için) yapması gereken bir adım.
2. Gerçek Logcat/ağ isteği doğrulaması.
3. `sprint-6-apk-device-test-plan.md`'nin tam zorunlu test seti.

## 7. Sonraki Sprint Önerisi (Sprint 7.5)

**Tek odak: İmzalama.** Kullanıcının kendi ortamında bir keystore oluşturması, `signingConfigs`'in nasıl güvenli entegre edileceğine dair rehberlik (ADR 0025 Karar 4'ün gerçek uygulanması), ardından ilk gerçek imzalı Beta APK'sının üretimi ve `sprint-6-apk-device-test-plan.md`'nin zorunlu test setinin tam çalıştırılması.
