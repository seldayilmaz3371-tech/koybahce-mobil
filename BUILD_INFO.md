# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı (henüz resmi modül numarası atanmadı — bkz. Not) |
| **Sprint** | 6 |
| **Feature** | AI Settings, Provider Registry (Gemini), Tool Registry (5 salt-okunur araç), Context Engine, Conversation Storage, Read-Only Chat |
| **Test Sonucu** | ✅ 459/459 başarılı (112 yeni) |
| **Build** | ✅ Başarılı — 🔴 **GERÇEK BULGU:** bundle +350kB (389→739.81kB), Vite kod-bölme uyarısı verdi |
| **Lint** | ✅ 0 uyarı / 0 hata (178 dosya, 103 kural) |
| **Cap Sync** | ✅ Başarılı (9 native plugin — `@capacitor/network` yeni eklendi) |
| **Tarih** | 2026-07-17 |
| **Git Commit** | `87351df` |
| **ADR** | [0024 — AI Architecture Decisions](docs/adr/0024-ai-architecture-decisions.md) (talimatta "0007" istenmişti, gerçek çakışma bulunup doğru sıraya taşındı) |

## Not — Modül Numarası

`docs/module-status.md`, Modül 5'i (Bakım Yönetimi) resmen kapatmıştı. Bu sprint kullanıcı tarafından "Sprint 6" olarak adlandırıldı, ama "Modül 6" olarak resmi bir kayıt henüz açılmadı — bu belge bunu varsaymadan "Modül 6" olarak etiketliyor, kullanıcı onayı/düzeltmesi beklenmektedir.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1 — Altyapı | ✅ FROZEN |
| Modül 2 — Parseller + Ağaçlar | ✅ FROZEN |
| Modül 3 — Gözlemler + Fotoğraflar | ✅ FROZEN |
| Modül 4 — Router + Finans | ✅ FROZEN |
| Modül 5 — Bakım Yönetimi (Sprint 5.1-5.5) | ✅ FROZEN |
| Sprint 6 — AI Altyapısı | 🟡 Bu teslimat — kullanıcı onayı bekliyor |

## Kısa Değişiklik Özeti

`@google/genai@2.12.0` ve `@capacitor/network@8.0.1` kuruldu. Şema Sürüm 10 (`ai_settings`/`ai_conversations`/`ai_messages`). Provider-bağımsız `ProviderRegistry` + `GeminiProvider` (web projesinden retry/lazy-init mantığı uyarlandı). Gerçek `functionDeclarations`/`functionCalls`/`functionResponse` API'siyle Tool Calling — 5 salt-okunur araç (`ToolRegistry` üzerinden). `IContextEngine` arayüzü + `KeywordContextEngine` (sıfır AI çağrısı). `AiSessionService` — tam tool-calling round-trip orkestrasyon. `AiSettingsScreen`/`AiChatScreen` oluşturuldu, henüz route'a bağlanmadı. `prompt-safety.util.ts` web projesinden birebir taşındı.

**Bilinen, çözülmemiş konu:** `@google/genai`'nin bundle'a eklediği +350kB — gelecekteki bir navigasyon sprintinde kod-bölme (lazy-loading) ile ele alınması önerilir.
