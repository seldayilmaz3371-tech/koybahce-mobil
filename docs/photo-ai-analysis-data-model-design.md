# AI Fotoğraf Analizi — Gelecekteki Veri Modeli Tasarımı

**Tarih:** 2026-07-18 · **Kapsam:** Sprint 9.1, Öncelik 7. **Bu belge SADECE mimari tasarımdır — hiçbir kod yazılmadı, hiçbir migration/repository oluşturulmadı.** Roadmap'in AI Fotoğraf Analizi'nin kendisi (Sprint 9.2+) **bu sprintin kapsamı dışında**.

## Gerçek Zemin

Mevcut `Photo` şeması (Şema Sürüm 3) **hiçbir AI analiz sonucu alanı içermiyor** — sadece `id`/`observationId`/`filePath`/`takenAt`/`isActive`. Bu, GERÇEK ve doğru bir tasarım kararıydı (Modül 3'te AI henüz yoktu, spekülatif alan eklenmedi — YAGNI'nin doğru uygulanması).

## Üç Mimari Seçenek

### Seçenek A — `photos` Tablosuna Nullable Sütunlar Eklemek

`ai_risk_score`, `ai_summary`, `ai_analyzed_at` gibi **nullable** sütunlar, additive bir migration ile (ADR 0005 deseni) `photos` tablosuna eklenir.

| Artı | Eksi |
|---|---|
| Basit — tek tablo, tek sorgu ile fotoğraf + analiz birlikte gelir | `photos` tablosu, "fotoğraf metadata"sı ile "AI analiz sonucu" gibi **iki farklı sorumluluğu** karıştırır |
| Additive migration, düşük risk (mevcut veri etkilenmez) | Bir fotoğraf birden fazla kez analiz edilmek istenirse (ör. yeniden analiz), "üzerine yazma" sorunu — geçmiş analiz kaybolur |

### Seçenek B — Ayrı `photo_analyses` Tablosu (1-N İlişki)

Yeni bir tablo: `photo_analyses (id, photo_id FK, risk_score, summary, analyzed_at, model_name, ...)`. Bir fotoğrafın **birden fazla** analiz kaydı olabilir (yeniden analiz, farklı model sürümleri).

| Artı | Eksi |
|---|---|
| Analiz geçmişi korunur — "bu fotoğraf ilk analizde risk X, ikinci analizde risk Y çıktı" izlenebilir | Yeni bir tablo + repository (Sprint 9.1'in kendi yasağı — bu sprintte YAPILMADI, gelecekte gerekecek) |
| `photos` tablosunun sorumluluğu (fotoğraf metadata) temiz kalır | Fotoğraf Analizi ekranının kendi sorgusu, iki tabloyu JOIN etmeli |
| AI Master Architecture'ın genel deseniyle tutarlı (`ai_conversations`/`ai_messages` de AYRI tablolardı, Sprint 6) | |

### Seçenek C — Hiç Veritabanı Değişikliği Yapmama, Sadece Runtime'da Gösterme

AI Fotoğraf Analizi çalıştığında sonucu **hiç kalıcı olarak saklamadan**, sadece o oturumda gösterir (her seferinde yeniden analiz edilir).

| Artı | Eksi |
|---|---|
| Sıfır migration/repository | Her görüntülemede **yeniden bir Gemini API çağrısı** gerekir — hem maliyetli hem "Karşılaştırmalı Fotoğraf"/"Zaman Çizelgesi" (roadmap Bölüm 2.4) gibi özellikler için pratik değil (geçmiş analiz sonucu kalıcı olmadan karşılaştırma yapılamaz) |

## Öneri

**Seçenek B** öneriliyor — AI Master Architecture'ın Sprint 6'da zaten kurduğu deseniyle (ayrı, ilişkili tablolar) tutarlı, analiz geçmişini kaybetmiyor, `photos` tablosunun sorumluluğunu bulandırmıyor. **Ancak bu sprintte UYGULANMADI** — Fotoğraf Analizi'nin kendisi (Sprint 9.2+) geliştirilmeye başlandığında, gerçek bir ADR ile birlikte hayata geçirilmelidir.

## Bu Sprintte Yapılmayanlar (Kullanıcının Açık Yasağı + Gerçek Bulgu Gereği)

❌ Yeni migration yazılmadı. ❌ Yeni repository üretilmedi. ❌ AI analizi yazılmadı. ❌ Gemini entegrasyonu yapılmadı. ❌ Görüntü işleme yapılmadı. ❌ Yeni ADR yazılmadı (henüz kesin bir karar yok, sadece seçenekler sunuldu — Fotoğraf Analizi'nin kendisi başladığında gerçek bir ADR yazılabilir).
