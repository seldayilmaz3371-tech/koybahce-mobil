# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 7.3 |
| **Feature** | AI Asistan Mobil UX + AI Davranış Doğrulaması + Beta/Release Hazırlığı |
| **Test Sonucu** | ✅ 484/484 başarılı (+5 yeni — mobil UX testleri) |
| **Build** | ✅ Başarılı — ana bundle 395.82kB, AI chunk 346.40kB (değişmedi) |
| **Lint** | ✅ 0 uyarı / 0 hata (183 dosya, 103 kural) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Tarih** | 2026-07-17 |
| **Git Commit** | `98edca6` |
| **ADR** | [0024 — AI Architecture Decisions](docs/adr/0024-ai-architecture-decisions.md), [0025 — Beta Release Strategy (taslak)](docs/adr/0025-beta-release-strategy.md) |

## Gerçek Cihaz Doğrulaması (Sprint 7.2'de Kullanıcı Tarafından Onaylandı)

APK üretildi, Android cihaza kuruldu, çöküş gözlenmedi. Parsel listesi/SQLite/AI Ayarları/Secure Storage/AI ekranı/Galeri fotoğraf seçimi doğrulandı.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1 — Altyapı | ✅ FROZEN |
| Modül 2 — Parseller + Ağaçlar | ✅ FROZEN |
| Modül 3 — Gözlemler + Fotoğraflar | ✅ FROZEN |
| Modül 4 — Router + Finans | ✅ FROZEN |
| Modül 5 — Bakım Yönetimi | ✅ FROZEN |
| Sprint 6 — AI Altyapısı (kod) | ✅ Onaylandı |
| Sprint 7.1 — Navigasyon + Bundle Optimizasyonu | ✅ Onaylandı |
| Sprint 7.2 — UX/Kalite Son Kontrolleri | ✅ Onaylandı, **gerçek cihazda doğrulandı** |
| Sprint 7.3 — Mobil UX + AI Doğrulaması + Beta Hazırlığı | 🟡 Bu teslimat |

## Kısa Değişiklik Özeti

**AI Asistan mobil UX'i tamamen yenilendi:** çok satırlı otomatik büyüyen textarea (4-10 satır), sohbet balonları (kullanıcı sağda/AI solda), gönderim sırasında spinner+"Düşünüyor..." göstergesi, `android:windowSoftInputMode="adjustResize"` (gerçek bulgu — hiç yapılandırılmamıştı). **AI mimarisi hiç değişmedi.**

**AI davranışı kod seviyesinde doğrulandı:** Gemini API'ye gerçekten istek gittiği, `gemini-2.5-flash` modelinin kullanıldığı, hiçbir fallback/sahte cevap mekanizması olmadığı kanıtlandı. Dürüstçe belirtilen sınır: gerçek Logcat/cihaz erişimi bu ortamda mümkün değil, analiz kod seviyesinde yapıldı.

**Beta/Release hazırlığı:** Versiyon önerileri (`sprint-7.3-version-proposal.md`) ve ADR 0025 (Beta Release Strategy) hazırlandı — **hiçbir dosya değiştirilmedi**, hepsi kullanıcı onayı bekliyor.
