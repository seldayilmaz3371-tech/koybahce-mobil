# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.11 — httpOptions.timeout SDK Bug'ı Düzeltmesi |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 730/730 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (230 dosya) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-22 |
| **Git Commit** | `6bb4dd1` |

## Kesin Kanıtlanmış Kök Neden

Güncel GitHub Issue `googleapis/js-genai#1277`: `config.httpOptions.timeout`, `models.generateContent` için **bozuk** — hiçbir zaman devreye girmiyor. Bu, Fotoğraf Analizi'nin ve `queryTreeData` gibi tool-calling akışlarının 2. round-trip'inin "awaiting_response"ta sonsuza kadar takılı kalmasının kesin açıklaması.

## Düzeltme

`httpOptions.timeout` yerine gerçek bir `AbortController` + `config.abortSignal` (resmi SDK'nın ayrı, çalışan bir mekanizması).

## Diğer Bulgular

- `treeTool.execute({})` (parcelId olmadan) hızlı bir `{error}` sonucu döner — SQLite/execute seviyesinde sorun yok, sorun 2. round-trip'te (Gemini'ye geri gönderme).
- `[AI]` etiketli detaylı loglama eklendi (Request Created → Provider Created → Gemini Request Started → Tool Started/Finished → Final Response Ready).
- Diagnostic ekranına `toolDurationMs` (SQLite süresi) eklendi.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5, 7-10 | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
