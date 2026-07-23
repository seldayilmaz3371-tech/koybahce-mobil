# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Ayarlar Hub — Dil (Language) |
| **Sprint** | 10.18 |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 819/819 başarılı (+11 yeni) — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (249 dosya) |
| **Cap Sync** | ✅ Başarılı (11 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-23 |
| **Git Commit** | `931d4b3` |

## Kapsam Kararı

AI modülü, kullanıcı kararıyla Feature Freeze (bakım modu) — Sprint 10.17 sonrası 19 senaryo gerçek cihazda başarılı. Roadmap yeniden değerlendirmesi sonrası, İmzalama (kullanıcının kendi ortamı) ve Hasat-Finans revizyonu (ayrı plan/ADR gerektiriyor) şu an başlatılamaz olduğundan, en düşük riskli hazır iş olarak **Dil** seçildi.

## Gerçek Bulgu

Dil değiştirme backend altyapısı (`languagePreference.ts`, `supportedLanguages.ts`) ADR 0015/0020/0021 ile Sprint 6 civarında zaten tamamlanmıştı — sadece UI eksikti. Bu sprint hiçbir yeni mimari karar gerektirmedi.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-10, Veri Yönetimi, Dil | ✅ Onaylandı |
| Modül 6 — AI | 🟢 Feature Freeze (bakım modu) — kullanıcı kararı, Sprint 10.17 sonrası kapsamlı doğrulandı |
