# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.12 — AbortError Retry Düzeltmesi + Developer Mode API Key Yönetimi |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 738/738 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (231 dosya) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-22 |
| **Git Commit** | `f13b6fb` |

## Kesin Kanıtlanmış İkinci Kök Neden (429/RESOURCE_EXHAUSTED)

`isRetryableGeminiError`, `AbortController.abort()`'un fırlattığı `AbortError`'ı (status alanı olmadığı için) yanlışlıkla "retry edilebilir" sayıyordu — her 45sn'lik timeout 3 kez deneniyordu, tool-calling akışlarında gerçek API çağrı sayısını katlıyordu.

## Yeni Özellik: Developer Mode API Key Yönetimi

`AiSettingsScreen`'e, sadece `debugMode` açıkken görünen "API Key Management (Developer)" bölümü eklendi. Mevcut anahtar maskeli gösteriliyor, "Change Key" ile önce kaldırmaya gerek kalmadan yeni anahtar anında aktif oluyor (`GeminiProvider` zaten cache'lemiyordu — Sprint 6'nın mevcut davranışı).

## Dürüstlük Notu

"Kullanılan Project" ve "First Byte Received" Diagnostic ekranına eklenmedi — bunlar istemci-taraflı kod seviyesinde kanıtlanabilir şekilde elde edilemiyor (API key string'i proje bilgisini kodlamıyor; mevcut SDK'nın non-streaming API'si first-byte granülerliği sağlamıyor).

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5, 7-10 | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme + Developer Mode) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
