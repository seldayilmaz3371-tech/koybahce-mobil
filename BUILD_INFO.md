# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.16 — Çok-Round Tool-Calling Desteği (Gerçek Kök Neden Düzeltmesi) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 806/806 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (247 dosya) |
| **Cap Sync** | ✅ Başarılı (11 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-23 |
| **Git Commit** | `c6d0f1b` |

## Kesin Kanıtlanmış Kök Neden

`AiSessionService`, tek-round-trip mimarisi taşıyordu — model, ilk tool sonucunu aldıktan sonra ikinci bir tool çağırmak istediğinde (ör. filtresiz denemeden sonra filtreli tekrar deneme), bu talep hiç işlenmiyordu. `response.text` boş kalıyordu, hiçbir exception fırlatılmadığı için hiçbir hata kodu da oluşmuyordu — kullanıcının gerçek cihazda gözlemlediği "cevap balonu oluşuyor ama metin boş" belirtisiyle tam örtüşüyordu.

## Düzeltme

Tek seferlik `if` bloğu, üst sınırlı (`MAX_TOOL_ROUNDS=3`) bir döngüye çevrildi. Diğer hiçbir katmana dokunulmadı — önceki mimari doğrulama raporlarının önerdiği en küçük, en güvenli düzeltme.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5, 7-10, Veri Yönetimi | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
