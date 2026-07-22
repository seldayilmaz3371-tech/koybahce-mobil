# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.9 — Kesin Kanıtla Doğrulanmış Kök Neden Düzeltmesi |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 720/720 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (230 dosya) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-22 |
| **Git Commit** | `b43889d` |

## Kesin Kanıtlanmış Kök Neden

`getActiveAiProvider.ts:34` — `internetPermission=false` iken `AI_INTERNET_PERMISSION_DENIED` fırlatılıyor. Şema varsayılanı (`schema.ts:309`, `DEFAULT 0`) kanıtladı: her yeni kullanıcı kapalı internet izniyle başlıyor. Bu ayarı açması gereken `AiSettingsScreen`'de gerçek bir CSS bug vardı (`<label className="status-card">` — `.status-card`'ın `display` kuralı yok, `<label>`'ın varsayılan `inline` davranışıyla çakışıyor, kartlar üst üste biniyordu).

## 3 Gerçek Bug

1. `aiDiagnostics` hiçbir zaman "idle"dan çıkamıyordu — `getActiveAiProvider()` izin kontrolü başarısız olduğunda `GeminiProvider`'a hiç ulaşılmıyordu, `startNewRequest()` hiç çağrılmıyordu. **8 testle kanıtlandı.**
2. `AiSettingsScreen`'deki 3 checkbox `.status-card` bloğu, established `.form-field--checkbox` deseniyle değiştirildi.
3. Diagnostic ekranı 13 ayrı karttan 4 gruba indirildi, tüm boş alanlar anlamlı ifadeler taşıyor.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5, 7-10 | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
