# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 9 — Fotoğraf Analizi (AI) |
| **Sprint** | 9.2 |
| **Feature** | Gemini Vision Entegrasyonu — İlk Çalışan Akış |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 557/557 başarılı (+19 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 413.73kB → 414.47kB (+0.74kB, makul) |
| **Lint** | ✅ 0 uyarı/hata (208 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (değişmedi — bu sprint hiçbir migration içermiyor) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `d10997f` |
| **ADR** | Yeni ADR yazılmadı — `analyzeImage()` ADR 0024'ün önceden öngördüğü genişleme; kalıcı saklama olmaması kararı Sprint 9.1'in tasarım belgesindeki necessity analizine dayanıyor |

## Bu Sprintte Yapılanlar (Gerçek, Kanıtlı)

`AIProvider.analyzeImage()` + `GeminiProvider` implementasyonu (gerçek `inlineData` API şekli doğrulanmış). `native/filesystem.ts`'e `readFileAsBase64()` eklendi (mevcut `persistPhotoFile`'a dokunulmadı). `usePhotoAnalysis` + `PhotoAnalysisScreen` — kalıcı saklama YOK (bilinçli necessity kararı). `getActiveAiProvider()` — kod tekrarından kaçınmak için `AiSessionService`'ten çıkarıldı (davranış aynı kaldı, 8/8 mevcut test hâlâ geçiyor).

## Mimari Sınırlar Korundu

- ❌ Photo Repository değiştirilmedi.
- ❌ Filesystem yapısı değiştirilmedi (sadece genişletildi).
- ❌ Yeni tablo/migration/repository oluşturulmadı.
- ❌ Teşhis/tedavi önerisi/karşılaştırmalı analiz yazılmadı.

## Sonraki Adım

PhotoGalleryScreen'den navigasyon entegrasyonu — ayrı bir sprint.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-9.1 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (ilk akış) | 🟡 Bu teslimat |
