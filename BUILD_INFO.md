# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.8 — Diagnostic Ekranı Düzeltmesi + Model Dayanıklılığı |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 715/715 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (230 dosya) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403, services.gradle.org) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-21 |
| **Git Commit** | `bd405ce` |

## Değişiklikler

1. `AiDiagnosticScreen.tsx` — gereksiz çift `useAiSettings()` çağrısı kaldırıldı (`debugMode` artık prop), stack trace 6 satırla sınırlandı, güçlü overflow koruması eklendi.
2. `AppRouter.tsx` — `AiDiagnosticScreenRoute`, `debugMode`'u prop olarak geçiriyor.
3. `AiDiagnosticScreen.test.tsx` — yeni mimariye göre yeniden yazıldı, stack taşma koruması için 2 yeni test.
4. `GeminiProvider.ts` — model adı `gemini-flash-latest`'e geçirildi (Google'ın resmi "latest" alias tavsiyesi — kesin kök neden düzeltmesi olarak sunulmuyor, dayanıklılık iyileştirmesi).

## Dürüstlük Notu

Kesin kök nedeni bu ortamdan kanıtlayamadım — gerçek bir Gemini API çağrısı yapamıyorum, gerçek cihaz yok. Kapsamlı kod incelemesi (Provider/Retry/ErrorMapping/PromptBuilder/ToolSchemas/AndroidManifest/Gradle/Capacitor) hiçbir ek istemci-kodu hatası bulamadı. Diagnostic ekranı artık düzgün çalışıyor ve gerçek verileri gösterebilir — bir sonraki adım, senin cihazında bu ekranı kullanıp gerçek `Error Code`/`stage`/`httpStatusCode` verisini toplaman.
