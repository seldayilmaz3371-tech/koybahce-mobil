# Sprint 9.2 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** AI Fotoğraf Analizi — İlk Çalışan Akış (Gemini Vision Entegrasyonu)

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

- **API doğrulaması** (varsayılmadı): `Part.inlineData: { data: string (base64), mimeType: string }` — `@google/genai`'nin resmi tip tanımlarından (`Blob_2`) doğrulandı. `Filesystem.readFile({path})` — `encoding` verilmezse "data is read as binary and returned as base64 encoded" (resmi Capacitor dokümantasyonu, birebir).
- `src/modules/ai/providers/AIProvider.interface.ts` + `GeminiProvider.ts`: `analyzeImage()` eklendi.
- `src/native/filesystem.ts`: `readFileAsBase64()` eklendi — **mevcut `persistPhotoFile()`'a hiç dokunulmadı**.
- `src/modules/ai/session/getActiveAiProvider.ts`: `AiSessionService`'in izin kontrolü + provider alma mantığından çıkarıldı (kod tekrarından kaçınma) — **davranış birebir aynı kaldı**, mevcut 8 test hâlâ geçiyor (güvenli refactor kanıtı).
- `src/modules/photoAnalysis/`: `photoAnalysisPrompt.ts`, `hooks/usePhotoAnalysis.ts`, `PhotoAnalysisScreen.tsx`.
- `src/core/errors/errorCodes.ts` + `mapAiError.ts`: `AI_005` (boş AI yanıtı) eklendi.
- `src/index.css`: genel `.spinner` sınıfı eklendi (`.ai-chat__spinner`'a dokunulmadı — Sprint 7.3'ün kodu/testleri etkilenmesin diye).
- **19 yeni test** — 16 `GeminiProvider.analyzeImage`, 1 `mapAiError`, 4 `getActiveAiProvider`, 5 `usePhotoAnalysis`, 4 `PhotoAnalysisScreen`.
- `npx tsc -b`, `npm run test` (557/557), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Veri Modeli Kararı — Necessity Analizi (Öncelik Sırası Gereği)

Sprint 9.1'in tasarım belgesindeki 3 seçenekten **Seçenek C (kalıcı saklama YOK)** uygulandı. **Gerekçe:** kalıcı saklamanın tek gerçek tüketicisi ("Karşılaştırmalı Fotoğraf"/"Zaman Çizelgesi") **bu sprintin açıkça kapsamı dışında** (kullanıcının Öncelik 10'u: "Henüz otomatik karşılaştırmalı analiz yapma"). Bu, kalıcı saklamanın **bugün gerekli olmadığının kanıtıdır** — **hiçbir yeni tablo/migration/repository oluşturulmadı.**

## Mimari Sınırlar (Kullanıcının Zorunlu Kuralları)

| Kural | Durum |
|---|---|
| Photo Repository değiştirilmedi | ✅ — Hiçbir CRUD metodu eklenmedi/değiştirilmedi |
| Filesystem yapısı değiştirilmedi | ✅ — `persistPhotoFile()`'a dokunulmadı, sadece `readFileAsBase64()` eklendi |
| Repository Pattern korundu | ✅ |
| Offline First korundu | ✅ — AI özelliği zaten internet gerektiriyordu (Bölüm 15), bu değişmedi |
| Kod tekrarından kaçınıldı | ✅ — `getActiveAiProvider()` çıkarması |
| Ortak bileşenler yeniden kullanıldı | ✅ — `status-card`, `lock-screen__button`, Error Code Standard |
| Gereksiz repository/abstraction/migration oluşturulmadı | ✅ — Necessity analizi ile kanıtlandı |
| Teşhis/tedavi/karşılaştırma yazılmadı | ✅ — Sistem promptunda modele açıkça yansıtıldı |

## ÖNERİ

- PhotoGalleryScreen'den `PhotoAnalysisScreen`'e navigasyon entegrasyonu — ayrı bir sprint (Hasat/Dashboard'ın aşamalı yaklaşımıyla tutarlı).
- Fotoğraf Analizi gerçek kullanım görürse, Seçenek B (`photo_analyses` tablosu) gerçek bir ADR ile değerlendirilmeli.

## VARSAYIM

Hiçbiri — API şekli ve Filesystem davranışı resmi kaynaklardan doğrulandı.

## Gerçek Bir Bulgu (Test Yazarken)

`analyzeImage()` arayüze eklenince, 4 mevcut test dosyasında (`AiChatScreen`, `useAiChat`, `AiSessionService`, `ProviderRegistry`) eksik `analyzeImage` mock'u bulundu — proaktif test-dosyası tip kontrolüyle tespit edilip tek tek düzeltildi.

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: (1) `analyzeImage()`, ADR 0024'ün kendi metninde "İleride gerektiğinde bu arayüze eklenecek" diye önceden öngörülmüştü — yeni bir karar değil, var olan bir kararın uygulanması. (2) Kalıcı saklama olmaması kararı, Sprint 9.1'in tasarım belgesindeki necessity analizine dayanıyor — o belge zaten "gerçek bir ADR, Fotoğraf Analizi geliştirilmeye başlandığında yazılmalı" demişti; bu sprint henüz o eşiği geçmedi (sadece "ilk çalışan akış").

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (557/557, +19), bundle boyutu (+0.74kB) ve commit hash (`d10997f`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

AI Fotoğraf Analizi'nin ilk çalışan akışı tamamlandı — kullanıcının 4 açık yasağına (teşhis/tedavi/karşılaştırma/otomatik) tam uyuldu, mevcut mimariye (Repository/Filesystem/Provider Registry) hiçbir bozucu değişiklik yapılmadan entegre edildi.
