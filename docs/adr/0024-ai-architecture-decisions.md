# ADR 0024 — AI Architecture Decisions (Sprint 6)

**Durum:** Kabul edildi
**Tarih:** 2026-07-17
**Kapsam:** Sprint 6 — AI altyapısının ilk, dar kapsamlı dilimi (Ayarlar, Provider, Konuşma Depolama, Salt-Okunur Sohbet, Context Engine, Salt-Okunur Tool Calling)

## Bağlam

Modül 5 kapanışının kendi talimatı: "Bu modül AI değildir. AI daha sonra geliştirilecektir." Sprint 6, bu "sonra"nın başlangıcı. `docs/ai-architecture.md` (256 satır, önceden onaylanmış) genel mimariyi tanımlıyor; bu ADR, Sprint 6'nın **somut** teknik kararlarını ve gerekçelerini kayıt altına alıyor.

## Karar 1 — Provider Registry (Tek Sağlayıcı Adaptörü Değil)

**Karar:** `AIProvider` arayüzü + `ProviderRegistry` (`register()`/`get()`/`list()`) + bugün sadece `GeminiProvider` implementasyonu.

**Neden:** AI Master Architecture Bölüm 9-10 zaten çoklu-sağlayıcı hedefliyordu (Gemini/OpenAI/Claude/yerel LLM). Tek bir `GeminiProviderAdapter` sınıfı yazıp ileride "refactor" etmek yerine, **bugünden** registry deseniyle başlamak — yeni bir sağlayıcı eklemek ileride sadece `register()` çağrısı gerektirecek, mevcut kodun hiçbiri değişmeyecek.

**Web projesinden farkı:** Web projesi (`gemini-client.ts`) tek bir tembel-başlatılan singleton — registry deseni **yok**. Bu, web'de emsali olmayan bilinçli bir genişletme (kullanıcı onayı, Ek Revizyon 1).

## Karar 2 — Gerçek Tool Registry (Düz Liste Değil)

**Karar:** `ToolRegistry` sınıfı — `register(tool)`, `find(name)`, `invoke(name, args)`, `list()`. 5 salt-okunur araç (`parcel.tool.ts`, `tree.tool.ts`, `observation.tool.ts`, `maintenance.tool.ts`, `finance.tool.ts`), her biri kendi dosyasında.

**Neden:** Web projesinde **gerçek bir function-calling örneği yok** (Deliverable — Sprint 6 Karşılaştırma Analizi'nde kanıtlandı: `parcel-recommendation.service.ts` context'i elle topluyor, Gemini'nin `functionDeclarations` API'sini hiç kullanmıyor). Bu, **web'den taşınamayan, AI Master Architecture Bölüm 7'den gelen yeni bir tasarım**. `invoke()` merkezi noktası, ileride (Sprint 6.1+) yazma araçları eklendiğinde onay akışının **tek bir yerden** geçmesini garanti eder.

**Gerçek API doğrulaması (varsayılmadı):** `@google/genai@2.12.0`'ın gerçek tip tanımlarından (`FunctionDeclaration.parametersJsonSchema?: unknown`, `response.functionCalls: FunctionCall[]`) doğrulandı — resmi `googleapis/js-genai` dokümantasyonuyla çapraz kontrol edildi.

## Karar 3 — `AiSessionService` Merkezi Oturum Katmanı

**Karar:** Tek bir "ConversationService" değil, `AiSessionService` — Conversation + Context + Screen Context + Usage + History yönetimini kapsayan merkezi katman. Bugün sadece Conversation+History+Usage gerçekten uygulanıyor; Memory (Bölüm 3'teki uzun-süreli özet/`ai_facts`) **arayüzde yer ayrılmış ama bugün yazılmamış** (YAGNI — Sprint 6.1+ konusu).

**Neden:** Fotoğraf Analizi/Sesli Asistan (gelecekteki sprintler) **aynı oturum kavramını** paylaşacak — "hangi ekrandayım" (Screen Context) ve "kaç token kullandım" (Usage) bilgisi, sohbete özel değil, TÜM AI özelliklerine ortak. Bunu şimdiden merkezi bir katmanda toplamak, ileride her yeni AI özelliğinin kendi oturum mantığını icat etmesini önler.

## Karar 4 — Provider-Bağımsız Ayarlar Veri Modeli

**Karar:** `ai_settings` tablosunda `provider_name: TEXT` (bugün her zaman `'gemini'`), `api_key_configured: INTEGER` (anahtarın KENDİSİ Secure Storage'da, DB'de sadece "var mı" bayrağı) — **hiçbir yerde `"gemini"` string'i kod içine sabit gömülmüyor**, hep bu sütundan okunuyor.

**Neden:** Provider Registry (Karar 1) ile tutarlı — ayarlar şeması sağlayıcı adını SABİT KODLARSA, Registry'nin kendisi anlamsız kalır.

## Karar 5 — `IContextEngine` Arayüzü + `KeywordContextEngine`

**Karar:** Bölüm 4'ün "iki kademeli, AI çağrısı gerektirmeyen filtreleme" ilkesi `IContextEngine.buildContext()` arayüzü ARDINDA. İlk (ve Sprint 6'daki TEK) implementasyon: `KeywordContextEngine` — anahtar kelime → domain eşlemesi, sıfır AI çağrısı.

**Neden:** AI Master Architecture Bölüm 4'ün kendi kayıtlı teknik borcu ("kural tabanlı yaklaşım çok modüllü sorularda kırılgan") — gelecekte `SemanticContextEngine` (embedding/RAG) EKLENDİĞİNDE, arayüz sayesinde `AiSessionService`'in hiçbir satırı değişmeyecek.

## Web Projesinden Doğrudan Uyarlanan Bileşenler

| Bileşen | Uyarlama |
|---|---|
| `capUserQueryLength`, `buildSafeUserQuerySection` | **Birebir taşındı** (`src/modules/ai/prompt/userPromptSection.ts`) — saf fonksiyonlar, hiçbir bağımlılık yok |
| Gemini lazy-init deseni | Mantık taşındı; API anahtarı kaynağı `process.env` → Android Secure Storage (mobil zorunluluğu) |
| Retry stratejisi (`RESOURCE_EXHAUSTED`/4xx retry YAPMA, 5xx/ağ hatası retry YAP) | **Birebir mantık taşındı** |
| Modüler prompt dosyası deseni ("prompt'lar service içine gömülmez") | Desen doğrulandı, Sprint 6'nın 4 parçalı (system/user/context/tool) yapısına genişletildi |
| Kullanım takibi kavramı | Kavram taşındı; depolama `ai-usage.json` (dosya) → SQLite (tek gerçek kaynağımız) |

## Mobil Gereksinimler Nedeniyle Yeniden Tasarlanan Bileşenler

| Bileşen | Neden Web'den Taşınamadı |
|---|---|
| Konuşma Geçmişi (`ai_conversations`/`ai_messages`) | Web projesinde **hiç yok** — web stateless (tek seferlik istek-cevap), bizim "kalıcı sohbet" kavramımız sıfırdan tasarlandı |
| Tool Calling (function declarations) | Web'de gerçek bir örnek yok (yukarıda kanıtlandı) — AI Master Architecture Bölüm 7'den, sıfırdan |
| API Anahtarı UX'i | Web'de sunucu-taraflı "Secrets" — bizde cihaz-içi Secure Storage, temelden farklı akış |
| Chat/RAG | Web'in "chat"i doküman-RAG'a bağımlı — Sprint 6'nın "kendi verini sorgula" senaryosuyla **farklı problem**, taşınmadı |

## Sonuç

Bu ADR'deki 5 karar, Sprint 6'nın "dar kapsamlı ama sağlam temel" hedefini karşılıyor — hiçbiri bugün kullanılmayan bir özelliği ÖNCEDEN inşa etmiyor (YAGNI korundu), ama hepsi **arayüz seviyesinde** gelecekteki genişlemeye (çoklu sağlayıcı, yazma araçları, RAG) açık.
