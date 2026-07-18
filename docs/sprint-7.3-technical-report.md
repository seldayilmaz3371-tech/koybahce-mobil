# Sprint 7.3 — Teknik Rapor

**Tarih:** 2026-07-17 · **Kapsam:** AI Asistan Mobil UX (Öncelik 1) + AI Davranış Analizi + Beta APK Hazırlığı + Release Hazırlığı

## 1. Yapılan İşler

### 1.1 AI Asistan Mobil UX İyileştirmesi (Öncelik 1)
Kullanıcının tam istek listesi karşılandı — tek satırlı `<input>` yerine 4-10 satır arası otomatik büyüyen `<textarea>`, sohbet balonları (kullanıcı sağda/yeşil, AI solda/beyaz), gönderim sırasında spinner+"Düşünüyor..." göstergesi, `placeholder="Sorunuzu yazın..."` (i18n anahtarı olarak, sabit kodlanmadı). **Gerçek bir bulgu:** `android:windowSoftInputMode` hiç yapılandırılmamıştı — "klavye açıldığında giriş alanı görünür kalsın" isteği için `adjustResize` eklendi. **AI mimarisi (Provider/Session/Hook/Tool/Context Engine) hiç değişmedi** — sadece bu ekranın render/etkileşim katmanı.

### 1.2 AI Davranış Analizi
Kod seviyesinde uçtan uca izleme yapıldı (ayrı rapor: `sprint-7.3-ai-behavior-verification-report.md`). **Dürüstçe belirtilen bir sınır:** gerçek Logcat/cihaz erişimi bu ortamda mümkün değil — analiz tamamen kod incelemesiyle yapıldı, kullanıcının gerçek cihazda ayrıca doğrulaması gereken 3 madde ayrıca listelendi.

### 1.3 Beta APK Hazırlığı
Versiyon önerileri (`sprint-7.3-version-proposal.md`) hazırlandı — **hiçbir dosya değiştirilmedi**, kullanıcının açık talimatına ("Hiçbirini benim onayım olmadan değiştirme") tam uyuldu.

### 1.4 Release Hazırlığı
ADR 0025 (Beta Release Strategy) hazırlandı. **Gerçek bir numaralandırma çakışması bulundu:** talimatta "ADR-0008" istenmişti, ama bu numara zaten "Yedekleme Stratejisi" için kullanılıyordu — ADR 0024'te izlenen aynı desenle doğru sıraya (0025) taşındı.

## 2. Değişen Dosyalar

**Kod:** `src/modules/ai/AiChatScreen.tsx` (yeniden tasarlandı, mimari değişmedi) + testi, `src/index.css` (sohbet balonu stilleri), `android/app/src/main/AndroidManifest.xml` (`windowSoftInputMode`), i18n anahtarları (`inputPlaceholder`, `thinkingLabel`).

**Belgeler (yeni):** `docs/sprint-7.3-ai-behavior-verification-report.md`, `docs/sprint-7.3-version-proposal.md`, `docs/adr/0025-beta-release-strategy.md`, bu rapor.

**Belgeler (güncellenen):** `docs/apk-beta-readiness-checklist.md`, `docs/adr/README.md`, `BUILD_INFO.md`.

**Dokunulmayan:** Tüm AI mimari katmanları (Provider/Session/Hook/Tool/Context Engine/Repository), tüm diğer ekranlar.

## 3. Test Özeti

| Metrik | Değer |
|---|---|
| Toplam test | **484/484** ✅ |
| Yeni test (bu sprint) | 5 (mobil UX — textarea, placeholder, bubble sınıfları, thinking göstergesi, sending durumunda disabled) |
| `tsc -b` | ✅ Temiz |
| Proaktif test-dosyası tip kontrolü | ✅ Temiz (2 gerçek tip hatası bulunup düzeltildi — `Promise<unknown>` çıkarımı) |
| `oxlint` | ✅ 0 uyarı/hata |
| Regresyon | ❌ Yok |

## 4. Performans Özeti

| Metrik | Sprint 7.2 Sonu | Sprint 7.3 Sonu | Değişim |
|---|---|---|---|
| Ana bundle | 395.68kB | 395.82kB | +0.14kB (CSS) |
| AI chunk (`bootstrapAi`) | 346.40kB | 346.40kB | Değişmedi |
| `AiChatScreen` chunk | 8.99kB | 9.52kB | +0.53kB (yeni UX kodu) |
| Native plugin sayısı | 9 | 9 | Değişmedi |

Sprint 7.1'in bundle optimizasyonu **korundu** — yeni UX kodu makul bir artışla sınırlı kaldı.

## 5. AI Doğrulama Raporu Özeti

Tam rapor: `docs/sprint-7.3-ai-behavior-verification-report.md`. Özet:

- ✅ Gemini API'ye gerçekten istek gidiyor (kod seviyesinde kanıtlandı)
- ✅ Model: `gemini-2.5-flash` (sabit kodlanmış)
- ✅ Hiçbir fallback/sahte cevap mekanizması yok
- 🟡 "Sadece Bahçem verileriyle çalışma" — yazma erişiminin olmaması **teknik olarak garantili**, konu kısıtlaması **sadece prompt seviyesinde** (nüans dürüstçe belirtildi)

## 6. Version Önerileri Özeti

Tam belge: `docs/sprint-7.3-version-proposal.md`. Özet öneri: `versionCode: 2`, `versionName/package.json: 0.1.0-beta.1`, Git Tag: `v0.1.0-beta.1`. **Hiçbir dosya değiştirilmedi**, kullanıcı kararı bekliyor.

## 7. Release Hazırlık Raporu Özeti

ADR 0025, üç aşamalı bir yayın modeli (Debug/Beta/Release) + keystore stratejisi (henüz oluşturulmadı, sadece süreç belgeli) + APK üretim/dağıtım süreci + Git Tag politikası tanımlıyor. **Hiçbir keystore oluşturulmadı, hiçbir `build.gradle` imzalama değişikliği yapılmadı.**

## 8. Kalan Teknik Borçlar

**Yeni teknik borç oluşturulmadı.** Taşınan açık konular:

1. İmzalama yapılandırması (keystore) — kullanıcı kararı bekliyor.
2. Versiyon numaraları — öneriler hazır, kullanıcı kararı bekliyor.
3. Gerçek Logcat/ağ isteği doğrulaması — kullanıcının kendisinin gerçek cihazda yapması gerekiyor (bu ortamda mümkün değil).
4. `sprint-6-apk-device-test-plan.md`'nin 60+ senaryolu tam test seti henüz **tam olarak** çalıştırılmadı (Sprint 7.2'de sadece bir alt küme doğrulandı).

## 9. Sonraki Sprint Önerisi (Sprint 7.4)

1. Kullanıcının versiyon/imzalama kararlarının uygulanması (kod değişikliği gerektirir).
2. Beta APK'nın gerçek imza ile üretilmesi.
3. `sprint-6-apk-device-test-plan.md`'nin **zorunlu** test setinin tam olarak çalıştırılması.
4. Git Tag'in gerçekten uygulanması (`v0.1.0-beta.1` veya kullanıcının seçtiği isim).
