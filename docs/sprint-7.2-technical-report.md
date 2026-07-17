# Sprint 7.2 — Teknik Rapor

**Tarih:** 2026-07-17 · **Kapsam:** APK/Beta hazırlığı — UX/erişilebilirlik/dokümantasyon son kontrolleri

## 1. Yapılan İşler

Kullanıcının kesin talimatına sadık kalınarak (**"Sprint 7.2'nin temel hedefi yeni özellik eklemekten çok uygulamayı APK/Beta dağıtımına hazır hale getirmek"**), bu sprintte **hiçbir yeni özellik eklenmedi** — sadece gerçek kod/dosya incelemesiyle bulunan somut kalite iyileştirmeleri yapıldı:

1. **i18n EN/TR simetri denetimi** (`src/i18n/keySymmetry.test.ts`) — 30+ sprint boyunca sadece manuel disiplinle korunan bir tutarlılığı artık otomatik test güvence altına alıyor.
2. **`engineering-protocol.md` Bölüm 21 güncellemesi** (v1.12) — `useTreeForRoute`'un Sprint 7.1'de gerçekleştiğini yansıtıyor (önceden "gelecekte olabilir" diyordu).
3. **`AiChatScreen` otomatik kaydırma** — gerçek bir UX sorunu (uzun konuşmada yeni cevap görünmeyebilir) çözüldü.
4. **`AiChatScreen` `aria-live`** — gerçek bir erişilebilirlik boşluğu (ekran okuyucular yeni mesajları duyamıyordu) kapatıldı.
5. **`.status-screen` responsive `max-width`** — geniş ekranlı Android tabletlerde içeriğin aşırı yayılmasını önlüyor.
6. **`module-status.md` + APK test planı güncellemesi** — Sprint 7.1'in tamamlandığını doğru yansıtıyor.

## 2. Değişen Dosyalar

**Yeni:** `src/i18n/keySymmetry.test.ts`, `docs/apk-beta-readiness-checklist.md`.
**Değişen:** `src/modules/ai/AiChatScreen.tsx` (+test), `src/index.css`, `docs/engineering-protocol.md`, `docs/module-status.md`, `docs/sprint-6-apk-device-test-plan.md`, `BUILD_INFO.md`.
**Dokunulmayan:** Hiçbir repository/hook/domain katmanı, hiçbir mevcut ekranın davranışı.

## 3. Test Özeti

| Metrik | Değer |
|---|---|
| Toplam test | **479/479** ✅ |
| Yeni test (bu sprint) | 3 (i18n simetri) |
| `tsc -b` | ✅ Temiz |
| Proaktif test-dosyası tip kontrolü | ✅ Temiz |
| `oxlint` | ✅ 0 uyarı/hata |
| Regresyon | ❌ Yok |

**Gerçek bir test-ortamı bulgusu:** jsdom `Element.scrollIntoView`'i implement etmiyor (tarayıcının gerçek özelliği, ama jsdom'un bilinen sınırlaması) — `AiChatScreen.test.tsx`'e doğru bir mock eklendi.

## 4. Performans Özeti

| Metrik | Sprint 7.1 Sonu | Sprint 7.2 Sonu | Değişim |
|---|---|---|---|
| Ana bundle | 395.68kB | 395.68kB | Değişmedi |
| AI chunk (`bootstrapAi`) | 346.40kB | 346.40kB | Değişmedi |
| `AiSettingsScreen` chunk | 2.92kB | 2.92kB | Değişmedi |
| `AiChatScreen` chunk | 8.70kB | 8.99kB | +0.29kB (`aria-live`/otomatik kaydırma kodu) |
| Native plugin sayısı | 9 | 9 | Değişmedi |

Bu sprint **performans odaklı değildi** (kullanıcının kendi talimatı: "erken optimizasyon yapma") — sadece mevcut, ölçülmüş durumun **korunduğu** doğrulandı.

## 5. Erişilebilirlik Kontrolleri

- ✅ Checkbox'lar zaten doğru `<label>` sarmalamasıyla native erişilebilirdi (AiSettingsScreen) — değişiklik gerekmedi.
- ✅ Buton tabanlı liste öğeleri (SettingsScreen) native olarak erişilebilir — değişiklik gerekmedi.
- 🔧 **Düzeltildi:** AI Sohbet mesaj listesine `aria-live="polite"` + `aria-relevant="additions"` eklendi.
- ⚪ **Bu oturumun kapsamı dışında kalan:** Renk kontrastı (görsel araç gerektirir, otomatik doğrulanamadı), ekran okuyucu ile uçtan uca gerçek cihaz testi (bkz. `sprint-6-apk-device-test-plan.md`).

## 6. Dokümantasyon Güncellemeleri

- `docs/engineering-protocol.md` → v1.12
- `docs/module-status.md` → Modül 6 durumu (Sprint 7.1 tamamlandı olarak işaretlendi)
- `docs/sprint-6-apk-device-test-plan.md` → Süreç bölümü güncel duruma göre düzeltildi
- `BUILD_INFO.md` → Sprint 7.2 için güncellendi
- **Yeni:** `docs/apk-beta-readiness-checklist.md`

## 7. APK/Beta Hazır Olma Kontrol Listesi

Ayrı belgede tam detay (`docs/apk-beta-readiness-checklist.md`). Özet:

| Kategori | Durum |
|---|---|
| Kod/Mimari/Test/Dokümantasyon/Navigasyon/UX | ✅ Hazır |
| İmzalama yapılandırması | 🔴 **Eksik — kullanıcı kararı gerekiyor** |
| Versiyon numarası (`versionCode`/`versionName`/`package.json`) | 🟡 **Hiç güncellenmemiş — kullanıcı kararı gerekiyor** |
| Uygulama ikonu/splash screen | ⚪ Bu oturumda doğrulanmadı |

## 8. Kalan Teknik Borçlar

**Yeni teknik borç oluşturulmadı** (kullanıcının kesin talimatı korundu). Sprint 6-7.1'den taşınan, hâlâ açık olan bilinen konular:

1. `signingConfigs` eksikliği (release imzalama) — APK üretim sprintinde kullanıcı kararı gerektiriyor.
2. Versiyon numaraları hiç artırılmamış — aynı şekilde kullanıcı kararı.
3. Uygulama ikonu/splash screen doğrulaması yapılmadı.
4. Gerçek Android cihaz testleri (`sprint-6-apk-device-test-plan.md`'nin 60+ senaryosu) henüz **hiç** çalıştırılmadı — bu sprintlerin hiçbirinde gerçek cihaz erişimi kullanılmadı.

## 9. Sonraki Sprint Önerisi (Sprint 7.3)

1. İmzalama yapılandırması kararı (debug ile devam / gerçek keystore oluştur).
2. Versiyon numarası kararı.
3. APK üretimi (`docs/apk-beta-readiness-checklist.md`'deki adımlarla).
4. Gerçek Android cihaz doğrulaması (`docs/sprint-6-apk-device-test-plan.md`'nin zorunlu test seti).
5. Bulunan kritik hatalar varsa Sprint 7.4 (hata düzeltme, kullanıcının önceden onayladığı yapı).
