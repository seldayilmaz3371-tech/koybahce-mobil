# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.10 — thought_signature Kesin Kök Neden Düzeltmesi |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 730/730 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (230 dosya) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-22 |
| **Git Commit** | `501598f` |

## Kesin Kanıtlanmış Kök Neden(ler)

1. **HTTP 400/AI_009**: `thoughtSignature`, resmi SDK tip tanımlarında `Part`'ın `functionCall` ile kardeş bir alanı. `response.functionCalls` getter'ı buna yapısal olarak erişemiyordu — 2. round-trip'te bu imza kayboluyordu, Gemini isteği reddediyordu.
2. **HTTP 429/AI_007**: `isRetryableGeminiError`, `mapAiError` ile aynı format uyumsuzluğunu taşıyordu — 400 hataları yanlışlıkla retry ediliyordu, her başarısız tool-calling denemesi 3 kata kadar kota tüketiyordu.

## Düzeltmeler

- `GeminiProvider.ts`: `response.candidates[0].content.parts`'tan `thoughtSignature` çıkarılıp 2. round-trip'e geri gönderiliyor; `isRetryableGeminiError` artık `error.status`'a bakıyor.
- `AIProvider.interface.ts`: `AIToolCallRequest.thoughtSignature` eklendi.
- Diagnostic ekranı: `apiKeyMasked` (Madde 5) ve `toolCallsRequested` (Madde 7-8) eklendi.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5, 7-10 | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
