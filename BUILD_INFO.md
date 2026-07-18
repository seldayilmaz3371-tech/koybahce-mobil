# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 7.5 |
| **Feature** | Release Signing Mimarisi Belgeleri (SAF DOKÜMANTASYON — kod değişikliği yok) |
| **App Version** | `0.1.0-beta.1` (Sprint 7.4'te uygulandı, bu sprintte DEĞİŞMEDİ) |
| **Test/Build/Lint/Cap Sync Durumu** | **Bu sprintte kod DEĞİŞMEDİĞİ için `npm run test`/`npm run build`/`npm run lint`/`cap sync` YENİDEN ÇALIŞTIRILMADI** — Sprint 7.4'ün sonucu (484/484 test, temiz build/lint, 9 plugin) hâlâ geçerlidir. Her belge değişikliğinden sonra `tsc -b` ÇALIŞTIRILDI (kod dokunulmadığının kanıtı) — bu GERÇEKTEN yapıldı. |
| **Tarih** | 2026-07-18 |
| **ADR** | [0025 — Beta Release Strategy](docs/adr/0025-beta-release-strategy.md), [0026 — Release Signing Architecture (YENİ)](docs/adr/0026-release-signing-architecture.md) |

## 🔴 Bu Sprintte Kod Hiç Değişmedi — Sadece Belgeler

Sprint 7.5, kullanıcının kendi talimatıyla **saf bir dokümantasyon sprinti**. Hiçbir keystore oluşturulmadı, hiçbir `signingConfigs` eklenmedi, hiçbir gerçek/sahte Release APK üretilmedi.

## Yeni Belgeler (Bu Sprint)

- `docs/sprint-7.5-signing-architecture-analysis.md` — Gerçek dosya incelemesi (build.gradle, .gitignore, vb.)
- `docs/release-signing-guide.md` — Adım adım Release Signing Rehberi (kullanıcının kendi ortamı için)
- `docs/adr/0026-release-signing-architecture.md` — Mimari karar
- `docs/sprint-7.5-device-test-gap-analysis.md` — Eksik gerçek cihaz testlerinin önceliklendirilmesi
- `docs/beta-distribution-strategy.md` — Play Store/APK dağıtım seçenekleri karşılaştırması
- `docs/beta-release-checklist.md` — Tüm Beta hazırlık adımlarının birleşik kontrol listesi

## 🔴 Gerçek Bulgular

1. `android/.gitignore`'da `*.jks`/`*.keystore` satırları **aktif değil** (yorum satırı) — güvenlik riski, öneri sunuldu, henüz uygulanmadı.
2. ADR 0025'in `minifyEnabled` varsayımı **yanlıştı** (`false`, `true` değil) — ADR 0026 ile düzeltildi.
3. Sprint 7.2'nin onayı, zorunlu test listesinin **küçük bir alt kümesiydi** — Güvenlik/Veri Bütünlüğü/AI Hata Senaryolarının çoğu hâlâ test edilmedi.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-7.4 | ✅ Onaylandı |
| Sprint 7.5 — Release Signing Belgeleri | 🟡 Bu teslimat |
