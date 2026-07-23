# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.15 — queryMaintenanceData Production Fix |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 804/804 başarılı (+14 yeni) — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (247 dosya) |
| **Cap Sync** | ✅ Başarılı (11 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi — migration gerekmedi) |
| **Tarih** | 2026-07-22 |
| **Git Commit** | `2080883` |

## Kesin Kanıtlanmış Kök Neden ve Düzeltme

`queryMaintenanceData`, `parcelId`/`treeId` olmadan çağrılamıyordu — kullanıcının 3 genel sorusu (hepsi parsel/ağaç belirtmeyen) bu tutarsızlıkla tam örtüşüyordu. Ek kanıt: `buildListClause` zaten `maintenanceType`/`fromDate`/`toDate` destekliyordu, sadece tool katmanına aktarılmamıştı.

## Değişen Dosyalar

- `maintenance.repository.ts`/`.interface.ts`: `listAll()`, `countAll()` eklendi — `buildListClause`'a **hiç dokunulmadı** (bilinçli tercih, sıfır risk).
- `maintenance.tool.ts`: genel sorgu desteği, tür/tarih filtresi, parsel kimliği, gerçek toplam sayı — mevcut `recentCount`/`recentRecords` korundu.

## Dokunulmayan Katmanlar (Bilinçli)

`AiSessionService`, `GeminiProvider`, `ToolRegistry`, `Conversation Memory`, `Diagnostics`, `systemPrompt` — hiçbiri değiştirilmedi. Çok-round tool-calling mimarisi eklenmedi (önceki mimari doğrulama raporlarıyla tutarlı).

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5, 7-10 | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
| Veri Yönetimi | 🟡 Gerçek cihaz doğrulaması bekliyor |
