# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 9 — Fotoğraf Analizi (AI) |
| **Sprint** | 10.5 — Navigasyon Entegrasyonu |
| **Feature** | Route + Route Wrapper + UI Girişi (PhotoGalleryScreen → PhotoAnalysisScreen) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 646/646 başarılı (+11 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — code-splitting yapısı değişti (yeni chunk'lar), gerçekten test edildi |
| **Lint** | ✅ 0 uyarı/hata (224 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **TypeScript Build** | ✅ `tsc -b` temiz — **gerçekten çalıştırıldı** |
| **Production Build** | ✅ `npm run build` başarılı — **gerçekten çalıştırıldı** |
| **🔴 Android APK Oluşturma** | ❌ **YAPILAMADI** — gerçekten denendi (`./gradlew assembleDebug`), bu ortamın network erişim kısıtları nedeniyle Gradle wrapper (`services.gradle.org`) indirilemedi. Sahte bir başarı iddia edilmiyor. |
| **🔴 Gerçek Cihaz Doğrulaması** | ❌ **YAPILAMADI** — bu ortamda fiziksel bir Android cihaz veya emülatör yok. |
| **Şema Sürümü** | 12 (değişmedi — bu sprint hiçbir migration içermiyor) |
| **Tarih** | 2026-07-20 |
| **Git Commit** | `ef12114` |
| **ADR** | Yeni ADR yazılmadı — `useTreeForRoute` davranış deseninin (kod kopyalanmadan) tekrarı |

## Kullanıcı Prensiplerinin Uygulanması (Sprint 10.5)

| Prensip | Uygulama |
|---|---|
| `useTreeForRoute` referans, kopyalama değil | Davranış deseni taklit edildi, Photo modülü Tree modülüne hiç bağımlı değil |
| Scroll/liste state korunmalı | Manuel çözüm (modül-seviyesi `Map`) — `HashRouter`'da React Router'ın native scroll restoration'ı çalışmıyor |
| Eşzamanlı çağrı önleme (cache değil) | `isAnalyzingRef` — `PhotoGalleryScreen`'in kanıtlanmış deseni, testle doğrulandı (1 çağrı, 2 değil) |
| Repository/migration'a dokunma | Doğrulandı — hiçbir SQL/şema değişikliği yok |
| Hata senaryoları | `mapAiError`'ın `SYS_001` fallback'i tüm senaryoları zaten kapsıyor |
| i18n eksiksiz | `photo.analyzeButton` eklendi, hata/loading mesajları zaten mevcut |
| Test planına 2 senaryo | Her ikisi de eklendi ve gerçek testle kanıtlandı |

## Gerçek Bir Bulgu (Bu Sprintte Bulunup Düzeltildi)

`PhotoAnalysisScreen` hiç donanım geri tuşu desteklemiyordu (diğer tüm ekranların aksine) — "analiz devam ederken geri tuşu" senaryosu incelenirken ortaya çıktı, `useBackButtonFallback`'in kendi çakışma önleme tasarımıyla güvenli şekilde düzeltildi.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.4 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (navigasyon dahil) | 🟡 Bu teslimat |
| Modül 10 — Saha Operasyonları | ✅ Onaylandı |
