# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.7 — AI Diagnostic Build |
| **Feature** | Kesin teknik teşhis altyapısı (yeni AI özelliği DEĞİL) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 713/713 başarılı (+32 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ **BUILD SUCCESSFUL** — `AiDiagnosticScreen` ayrı lazy chunk (4.17kB) |
| **Lint** | ✅ 0 uyarı/hata (230 dosya, 103 kural) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Şema Sürümü** | 12 (değişmedi — `debugMode` alanı Sprint 6'dan beri şemada vardı) |
| **Tarih** | 2026-07-21 |
| **Git Commit** | `66eeecb` |
| **ADR** | Yeni ADR yazılmadı — gözlemlenebilirlik katmanı, yeni mimari kategori değil |

## Artık Gerçek Cihazda Görülebilecek Bilgiler

Provider, API Key durumu (empty/configured), İstek Aşaması (10 durum: idle→...→ui_updated/error/timeout), HTTP Status Code, Ham `ApiError` alanları (message/status/name/stack), `mapAiError()`'ın seçtiği kod, İstek Süresi (ms), Retry Sayısı, Timeout Durumu, Fotoğraf/Base64 Boyutu.

## Gerçek Bulgular (Bulunup Düzeltildi)

1. Diagnostic modülünün kendi `startNewRequest()` çağrısı unutulmuştu — testle yakalanıp düzeltildi.
2. `GeminiProvider`'da hiç timeout yoktu — SDK'nın resmi `httpOptions.timeout` (45sn) eklendi.

## Görünürlük Garantisi

`debugMode` varsayılan **kapalı**. İki katmanlı koruma: (1) `AiDiagnosticScreen` kendi içinde `null` render eder, (2) route seviyesinde `debugMode` kontrolü var. Release kullanıcıları hiçbir teknik bilgi görmez.

## Kapsam Dışı (Bilinçli)

`mapAiError()`'ın kendi sınıflandırma mantığı **değiştirilmedi** — kullanıcının "rastgele düzeltme yapma" talimatı gereği, gerçek cihaz verisi görülene kadar ertelendi.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.6 | ✅ Onaylandı |
| Modül 7-10 | ✅ Onaylandı |
| Modül 6 — AI (Diagnostic Build) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
