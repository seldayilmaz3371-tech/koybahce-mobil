# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı + Modül 9 — Fotoğraf Analizi |
| **Sprint** | 10.6 — AI Production Ready |
| **Feature** | Tool-Calling Kök Neden Düzeltmesi + Hata Görünürlüğü + Hasat Aracı + Prompt Kalitesi |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 681/681 başarılı (+22 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ **BUILD SUCCESSFUL** — gerçekten çalıştırıldı |
| **Lint** | ✅ 0 uyarı/hata (226 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **TypeScript Build** | ✅ `tsc -b` temiz |
| **🔴 Gerçek Cihaz Doğrulaması** | ❌ **YAPILAMADI** — bu ortamda Android SDK/fiziksel cihaz yok (kalıcı ortam kısıtı, önceki sprintlerde de kayıtlı). Tool-calling düzeltmesi kod seviyesinde kesin kanıtlı, gerçek cihaz onayı kullanıcının kendi ortamında yapılmalı. |
| **Şema Sürümü** | 12 (değişmedi — bu sprint hiçbir migration içermiyor) |
| **Tarih** | 2026-07-21 |
| **Git Commit** | `d4ad39f` |
| **ADR** | Yeni ADR yazılmadı — mevcut provider-agnostik mimarinin (ADR 0024) doğru uygulanması |

## En Kritik Düzeltme

**Kesin kanıtlı kök neden bulundu ve düzeltildi:** `AiSessionService`'in tool-calling akışı, Gemini API'nin resmi sözleşmesini ihlal ediyordu (modelin function-call yanıtı history'ye hiç eklenmiyordu) — resmi Google dokümantasyonu + güncel bağımsız bir hata raporuyla (LiteLLM GitHub Issue #26755) kanıtlandı. Provider-agnostik bir çözümle düzeltildi, gerçek testle kanıtlandı.

## Yapılan Geliştirmeler (Özet)

1. Tool-calling kök neden düzeltmesi (kesin kanıtlı)
2. 7 yeni ayırt edici hata kodu (AI_006-AI_012) + debug loglama
3. Hasat AI aracı eklendi (`queryHarvestSummary`)
4. Fotoğraf Analizi prompt kalitesi iyileştirildi (güvenlik sınırları korunarak)
5. 2 alt yapının zaten hazır olduğu bulundu (Çoklu Provider, RAG hook noktası) — hiç kod gerekmedi

## Değişen/Eklenen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/modules/ai/providers/AIProvider.interface.ts` | `AIMessage.toolCalls` eklendi |
| `src/modules/ai/providers/GeminiProvider.ts` | `buildContents()` düzeltildi |
| `src/modules/ai/session/AiSessionService.ts` | 2. round-trip'e model'in tool-call yanıtı ekleniyor |
| `src/core/errors/errorCodes.ts` | 7 yeni AI hata kodu |
| `src/core/errors/mapAiError.ts` | Gerçek Gemini hata türlerini ayırt ediyor, debug loglama |
| `src/modules/ai/tools/harvest.tool.ts` | **Yeni dosya** — Hasat AI aracı |
| `src/modules/ai/tools/registerReadOnlyTools.ts` | Hasat aracı kaydı |
| `src/modules/photoAnalysis/photoAnalysisPrompt.ts` | Gözlem rehberliği eklendi |
| `src/modules/photoAnalysis/photoAnalysisPrompt.test.ts` | **Yeni dosya** — önceden hiç yoktu |
| i18n dosyaları (EN/TR) | 13 yeni çeviri |

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.5 | ✅ Onaylandı |
| Modül 6 — AI Altyapısı (Production Ready geliştirmeleri) | 🟡 Bu teslimat |
| Modül 7 — Hasat | ✅ Onaylandı (AI aracı eklendi, Hasat modülünün kendisi değişmedi) |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (prompt kalitesi iyileştirildi) | 🟡 Bu teslimat |
| Modül 10 — Saha Operasyonları | ✅ Onaylandı |
