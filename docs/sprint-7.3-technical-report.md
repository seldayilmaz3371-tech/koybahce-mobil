# Sprint 7.3 — Teknik Rapor

**Tarih:** 2026-07-17 · **Kapsam:** AI Asistan Mobil UX (Öncelik 1), AI Davranış Analizi, Beta/Release Hazırlığı

## 1. Yapılan İşler

Kullanıcının kesin talimatına sadık kalınarak ("mevcut mimari korunacak, yeni özellik eklenmeyecek"), 5 alanda çalışıldı:

### 1.1 AI Asistan Mobil UX İyileştirmesi (Öncelik 1)
İstek listesindeki **her madde** karşılandı — detaylar için `AiChatScreen.tsx`/`index.css` değişikliklerine bkz. Öne çıkanlar:
- Tek satırlı input → çok satırlı, otomatik büyüyen textarea (4-10 satır)
- Sohbet balonları (kullanıcı sağda/yeşil, AI solda/beyaz)
- Gönderim sırasında spinner + "Düşünüyor..." göstergesi
- **Gerçek bulgu:** `android:windowSoftInputMode` hiç yapılandırılmamıştı — `adjustResize` eklendi (klavye açıldığında giriş alanının görünür kalması için gerekli)
- **AI mimarisi (Provider/Session/Hook/Tool/Context Engine) hiç değişmedi** — sadece bu ekranın render katmanı yeniden tasarlandı

### 1.2 AI Davranış Analizi
Kod seviyesinde uçtan uca izleme yapıldı (bkz. `sprint-7.3-ai-behavior-verification-report.md`). **Dürüstçe belirtilen sınır:** Bu ortamda gerçek bir Android cihaza/Logcat'e erişim yok — analiz kod incelemesiyle yapıldı, kullanıcının gerçek cihazda doğrulaması gereken 3 madde ayrıca listelendi.

### 1.3 Beta APK Hazırlığı
`sprint-7.3-version-proposal.md` — versionCode/versionName/package.json/Git Tag/Beta adı için somut öneriler. **Hiçbir dosya değiştirilmedi.**

### 1.4 Release Hazırlığı
ADR 0025 (Beta Release Strategy) — talimatta "0008" istenmişti, gerçek bir numara çakışması bulunup 0025'e taşındı (0008 zaten "Yedekleme Stratejisi" için kullanılıyordu).

### 1.5 Kod Kalitesi
Yeni teknik borç oluşturulmadı — tek mimari dokunuş (`windowSoftInputMode`) gerekçeli ve dar kapsamlı.

## 2. Değişen Dosyalar

**Değişen (kod):** `src/modules/ai/AiChatScreen.tsx` (+test), `src/index.css`, `android/app/src/main/AndroidManifest.xml`.
**Yeni (belge):** `docs/sprint-7.3-ai-behavior-verification-report.md`, `docs/sprint-7.3-version-proposal.md`, `docs/adr/0025-beta-release-strategy.md`.
**Değişen (belge):** `docs/apk-beta-readiness-checklist.md`, `docs/adr/README.md`, `BUILD_INFO.md`.
**Dokunulmayan:** Hiçbir AI mimarisi dosyası (Provider/Session/Hook/Tool/Context Engine), hiçbir repository/domain katmanı.

## 3. Test Özeti

| Metrik | Değer |
|---|---|
| Toplam test | **484/484** ✅ |
| Yeni test (bu sprint) | 5 (mobil UX — textarea, placeholder, bubble sınıfları, thinking göstergesi, sending durumunda disabled) |
| `tsc -b` | ✅ Temiz |
| Proaktif test-dosyası tip kontrolü | ✅ Temiz (2 gerçek tip bulgusu düzeltildi — `Promise<unknown>` çıkarımı) |
| `oxlint` | ✅ 0 uyarı/hata |
| Regresyon | ❌ Yok |

## 4. Performans Özeti

| Metrik | Sprint 7.2 Sonu | Sprint 7.3 Sonu | Değişim |
|---|---|---|---|
| Ana bundle | 395.68kB | 395.82kB | +0.14kB (CSS) |
| AI chunk (`bootstrapAi`) | 346.40kB | 346.40kB | Değişmedi |
| `AiChatScreen` chunk | 8.99kB | 9.52kB | +0.53kB (yeni UX kodu) |
| Native plugin sayısı | 9 | 9 | Değişmedi |

Değişim ölçülebilir ve makul — hiçbir yeni bağımlılık eklenmedi.

## 5. AI Doğrulama Raporu Özeti

(Tam rapor: `sprint-7.3-ai-behavior-verification-report.md`)

- ✅ Gemini API'ye gerçekten istek gidiyor (kod seviyesinde kanıtlandı)
- ✅ Model: `gemini-2.5-flash` (sabit)
- ✅ Hiçbir fallback/sahte cevap mekanizması yok
- 🟡 "Sadece Bahçem verileriyle çalışma" — yazma erişimi **teknik olarak garantili**, konu kısıtlaması **sadece prompt seviyesinde** (nüans dürüstçe belirtildi)
- 🔴 Gerçek Logcat/ağ trafiği doğrulaması bu ortamda yapılamadı — kullanıcının gerçek cihazda tamamlaması gerekiyor

## 6. Version Önerileri Özeti

(Tam belge: `sprint-7.3-version-proposal.md`)

| Alan | Öneri |
|---|---|
| `versionCode` | `2` |
| `versionName`/`package.json` | `0.1.0-beta.1` (önerilen) veya `0.6.0` |
| Git Tag | Sürüm adıyla eşleşen `v...` |
| Beta Adı | "Bahçem Mobile Beta 1" / "Zeytin" / "İlk Saha Denemesi" |

**Hiçbiri uygulanmadı — kullanıcı kararı bekliyor.**

## 7. Release Hazırlık Raporu Özeti

ADR 0025, 7 karar içeriyor: Versioning politikası, 3 aşamalı release stratejisi (Debug/Beta/Release), Debug/Beta farkları, Keystore stratejisi (**oluşturulmadı**, sadece süreç belgelendi), APK üretim komutları, Beta dağıtım süreci, Git Tag politikası. Tam detay: `docs/adr/0025-beta-release-strategy.md`.

## 8. Kalan Teknik Borçlar

**Yeni teknik borç oluşturulmadı.** Taşınan açık konular (değişmedi):

1. İmzalama yapılandırması eksik — ADR 0025 stratejiyi belgeledi, uygulama kullanıcı onayı bekliyor.
2. Versiyon numaraları hâlâ güncellenmemiş — öneriler hazır, karar bekliyor.
3. Uygulama ikonu/splash screen bu oturumda da doğrulanmadı.
4. `sprint-6-apk-device-test-plan.md`'nin 60+ senaryosunun **çoğu** henüz test edilmedi (Sprint 7.2'de sadece bir alt küme gerçek cihazda doğrulandı — kullanıcının kendi listesi).

## 9. Sonraki Sprint Önerisi

1. Kullanıcının `sprint-7.3-version-proposal.md` üzerinden versiyon kararı vermesi.
2. Keystore oluşturma + `signingConfigs` uygulaması (ADR 0025 Karar 4).
3. Beta APK üretimi (imzalı).
4. `sprint-6-apk-device-test-plan.md`'nin **zorunlu** test setinin tamamının gerçek cihazda tamamlanması.
5. İlk Beta dağıtımı.
