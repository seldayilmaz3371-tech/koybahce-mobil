# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 7.4 |
| **Feature** | Beta Versiyon Altyapısı (versionCode/versionName/package.json) |
| **App Version** | `0.1.0-beta.1` ("Bahçem Mobile Beta 1") — **YENİ, bu sprintte gerçekten yazıldı** |
| **versionCode** | `2` |
| **Test Sonucu** | ✅ 484/484 başarılı (kod değişikliği yok, sadece versiyon) |
| **Build** | ✅ Başarılı — bundle boyutu değişmedi (395.82kB ana + 346.40kB AI chunk) |
| **Lint** | ✅ 0 uyarı/hata — çıktı artık `bahcem-mobile@0.1.0-beta.1` gösteriyor (gerçek kanıt) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Tarih** | 2026-07-18 |
| **ADR** | [0025 — Beta Release Strategy](docs/adr/0025-beta-release-strategy.md) — **Karar 1 (Versioning) UYGULANDI, Karar 4 (Keystore) hâlâ bekliyor** |

## 🔴 Beta Release'e Giden Yolda Kalan TEK Kritik Engel

**İmzalama.** `signingConfigs` hâlâ yok, hiçbir keystore oluşturulmadı — bu sprintte **bilinçli olarak** yapılmadı (kullanıcı yasağı). Detay: `docs/sprint-7.4-release-readiness-report.md`.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6 — AI Altyapısı (kod) | ✅ Onaylandı |
| Sprint 7.1 — Navigasyon + Bundle Optimizasyonu | ✅ Onaylandı |
| Sprint 7.2 — UX/Kalite, Gerçek Cihazda Doğrulandı | ✅ Onaylandı |
| Sprint 7.3 — Mobil UX + AI Doğrulaması + Beta Hazırlığı | ✅ Onaylandı |
| Sprint 7.4 — Beta Versiyon Altyapısı | 🟡 Bu teslimat |

## Kısa Değişiklik Özeti

`android/app/build.gradle` (`versionCode`/`versionName`) ve `package.json` (`version`) **gerçekten güncellendi** — `sprint-7.3-version-proposal.md`'nin Seçenek A'sı kullanıcı tarafından onaylandı. **Hiçbir başka dosya değişmedi** — keystore/imzalama/Release APK bu sprintin kapsamı DIŞINDA bırakıldı (kullanıcının açık talimatı).
