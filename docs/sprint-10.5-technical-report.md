# Sprint 10.5 — Teknik Rapor

**Tarih:** 2026-07-20 · **Kapsam:** Fotoğraf Analizi Navigasyon Entegrasyonu

## Bağlam

Bu sprint, iki önceki analiz belgesinin (`docs/modul9-fotograf-analizi-sprint10.5-analiz-raporu.md`, `docs/sprint10.5-son-mimari-dogrulama-raporu.md`) sonucunda, kullanıcının verdiği 8 teknik prensiple başladı. Her prensip, gerçek kod değişikliğiyle karşılandı.

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

### Route + Route Wrapper
- `routes.ts`'e `photoAnalysis: "/photos/:photoId/analysis"` + `buildPath.photoAnalysis()`.
- `AppRouter.tsx`'e `PhotoAnalysisScreenRoute` — `useTreeForRoute`'un **kodu kopyalanmadan**, davranış deseni (loading/null/hazır, `cancelled` flag'iyle race condition koruması, `useBackButtonFallback`) taklit edildi. Photo modülü Tree modülüne hiçbir import bağımlılığı taşımıyor.

### UI Girişi
- `PhotoGalleryScreen`'e `onAnalyze?: (photo: Photo) => void` prop'u, `PhotoListItem`'a "Analyze with AI" butonu ("Sil"den önce, ikon yok, onay diyaloğu yok — önceki UX analizinin kararlarıyla tutarlı).

### Scroll/Liste State Koruması (Madde 2)
- **Gerçek bulgu:** `HashRouter`'da React Router'ın `<ScrollRestoration>` özelliği çalışmıyor (sadece `RouterProvider` ile çalışır).
- Modül seviyesinde `Map<observationId, scrollY>` ile manuel çözüm — `sessionStorage`/veritabanı kullanılmadı (bilinçli: bu geçici bir UI durumu, kalıcı veri değil).
- **Gerçek testle kanıtlandı:** component unmount/remount simülasyonunda `window.scrollTo(0, 350)` çağrısı doğrulandı.

### Eşzamanlı Çağrı Önleme (Madde 3 — Cache Değil)
- `usePhotoAnalysis`'e `isAnalyzingRef` eklendi — `PhotoGalleryScreen`'in kanıtlanmış `isSavingRef` deseninin tekrarı (React state'in asenkron/batch'li güncellenmesinden kaynaklanan yarış durumunu senkron `useRef` ile önleme).
- **Gerçek testle kanıtlandı:** iki ard arda `analyze()` çağrısı, `provider.analyzeImage()`'ı sadece **1 kez** tetikliyor.

### Testler ve Doğrulama
- **11 yeni test** — 2 `usePhotoAnalysis` (eşzamanlı çağrı), 2 `PhotoAnalysisScreen` (Madde 7'nin 2 senaryosu), 4 `PhotoGalleryScreen` (buton + scroll koruma), 3 `AppRouter` (gerçek uçtan uca navigasyon).
- `npx tsc -b`, `npm run test` (646/646), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Kullanıcının 8 Prensibinin Karşılanması

| # | Prensip | Karşılanma Durumu |
|---|---|---|
| 1 | `useTreeForRoute` referans, kopyalama değil | ✅ Davranış deseni taklit edildi, Photo→Tree bağımlılığı yok |
| 2 | Scroll/liste state korunmalı | ✅ Manuel çözüm, gerçek testle kanıtlandı |
| 3 | Eşzamanlı çağrı önleme (cache değil) | ✅ `isAnalyzingRef`, gerçek testle kanıtlandı |
| 4 | Repository/migration'a dokunma | ✅ Doğrulandı — hiçbir SQL/şema değişikliği yok |
| 5 | Hata senaryoları doğrulanmalı | ✅ `mapAiError`'ın `SYS_001` fallback'i tüm senaryoları (internet/timeout/API key/Gemini hatası) kapsıyor, hiçbir çökme riski yok |
| 6 | i18n eksiksiz (buton+loading+hata+yönlendirme) | ✅ `photo.analyzeButton` eklendi, geri kalanı zaten mevcut altyapıyla kapsanıyor |
| 7 | Test planına 2 senaryo | ✅ Her ikisi de eklendi, gerçek testle kanıtlandı |
| 8 | Tam teslim disiplini | 🟡 Kısmen — aşağıya bakınız |

## 🔴 Madde 8 — Dürüstlük Notu (Yapılamayan Kısım)

**Gerçekten denendi, dürüstçe raporlanıyor:**
- ✅ TypeScript build (`tsc -b`) — gerçekten çalıştırıldı, temiz.
- ✅ Lint — gerçekten çalıştırıldı, 0 uyarı.
- ✅ Test — gerçekten çalıştırıldı, 646/646.
- ✅ Production build (`npm run build`) — gerçekten çalıştırıldı, başarılı.
- ✅ Capacitor sync (`npx cap sync android`) — gerçekten çalıştırıldı, başarılı.
- ❌ **Android APK oluşturma** — `./gradlew assembleDebug` **gerçekten çalıştırıldı**, ama bu ortamın network erişim kısıtları (izin verilen domain listesi) nedeniyle Gradle wrapper'ın kendisi (`services.gradle.org`'dan indirilen `gradle-8.14.3-all.zip`) **indirilemedi** — `HTTP 403` hatası. Bu, sahte bir başarı olarak raporlanmadı.
- ❌ **Gerçek cihaz doğrulaması** — bu ortamda fiziksel bir Android cihaz veya emülatör bulunmuyor, yapılamadı.

**Bu iki madde, kullanıcının kendi ortamında tamamlanmalı** — kod değişiklikleri hazır, `cap sync` başarılı, sadece gerçek APK derlemesi ve cihaz testi bekliyor.

## Gerçek Bir Bulgu (Bu Sprintte Bulunup Düzeltildi)

`PhotoAnalysisScreen`, diğer TÜM ekranların (Hasat/Bakım/Toplu İşlemler) aksine, **hiç donanım geri tuşu desteklemiyordu**. Bu, kullanıcının "analiz devam ederken geri tuşuna basılması" test senaryosu (Madde 7) üzerinde düşünülürken ortaya çıktı. `useBackButtonFallback`'in kendi çakışma önleme tasarımıyla (route wrapper'ın fallback dinleyicisi + ekranın kendi dinleyicisi arasında çift-tetiklenme riski olmadığı, hook'un kendi belgesinde kanıtlı) güvenli bir şekilde düzeltildi.

## Diğer Küçük Bir Hata (Bulunup Düzeltildi)

İ18n anahtarı eklerken bir noktada yanlışlıkla Türkçe metni EN dosyasına yazdım — hemen fark edilip düzeltildi (`keySymmetry.test.ts` bunu yakalayabilirdi, ama commit öncesi manuel kontrolle bulundu).

## VARSAYIM

Hiçbiri — her mimari karar (route wrapper tasarımı, scroll koruma, eşzamanlı çağrı önleme) gerçek kod incelemesi ve testle doğrulandı.

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Mevcut mimari bozulmadı | ✅ — Sadece ekleme, mevcut hiçbir davranış değişmedi |
| Photo modülü Tree modülüne bağımlı olmadı | ✅ |
| Repository/migration'a dokunulmadı | ✅ |
| Cache eklenmedi (sadece eşzamanlı çağrı önleme) | ✅ |
| Scope creep önlendi | ✅ — Önceki analiz belgesindeki 9 maddelik "yapılmayacaklar" listesine sadık kalındı |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: `useTreeForRoute`'un davranış deseninin tekrarı, yeni bir mimari karar değil.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (646/646, +11) ve commit hash (`ef12114`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok. APK/cihaz doğrulamasının "yapılamadı" durumu her iki belgede de tutarlı.

## Sonuç

Fotoğraf Analizi artık uçtan uca gerçek navigasyona bağlı — kod, test, lint, build seviyesinde tam doğrulandı. APK derlemesi ve gerçek cihaz testi, bu ortamın teknik kısıtları nedeniyle kullanıcının kendi ortamında tamamlanmalı.
