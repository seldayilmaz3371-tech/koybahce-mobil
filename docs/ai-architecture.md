# AI Master Architecture Document — Bahçem Mobile

**Durum:** Onaylandı (Bölüm 17 — Çok Dilli AI Mimarisi — Globalization kararı sonrası eklendi)
**Tarih:** 2026-07-14
**Kapsam:** Bu belge, AI ile ilgili tüm modüllerin (AI Tavsiye Sistemi, Gelişim Analizi, Sesli Asistan, RAG/Faz 2) referans mimarisidir. Hiçbir AI modülü bu belgeyle çelişemez.

Bu belge, önceki ADR'lerde (bkz. `docs/adr/`) alınan kararlara (offline-first, tek kullanıcı, sunucu yok, minimum API çağrısı — Kural 16, minimum harici bağımlılık — Kural 17, Keystore güvenliği — ADR 0004/0006) sadıktır; hiçbirini geçersiz kılmaz.

---

## 1. AI'nın Sistem İçindeki Rolü

**AI ne yapacak:** Kullanıcının kendi verisi (parsel, ağaç, gözlem, finans, stok, hava durumu) üzerinden **karar destek** sağlayan bir danışman. Soru sorulduğunda analiz eder, yorumlar, öneri sunar. Kullanıcı istediğinde (Kural 16) sohbet eder, fotoğraf değerlendirir, sesli soru yanıtlar.

**AI ne yapmayacak:**
- **Hiçbir veriyi kullanıcı onayı olmadan değiştirmeyecek.** AI salt okunur (read-only) çalışır; bir hatırlatıcı oluşturmak, bir kaydı güncellemek gibi "yazma" eylemleri her zaman açık kullanıcı onayı gerektirir (bkz. Bölüm 7).
- **Otomatik/arka planda tetiklenmeyecek.** Kullanıcı sormadan proaktif konuşma başlatmaz, arka planda periyodik analiz yapmaz.
- **Kesin/bağlayıcı karar vermeyecek.** Özellikle ilaç/gübre önerilerinde, öneri niteliğinde sunulacak; ruhsatlı bayi/ziraat mühendisine danışılması gerektiği açıkça belirtilecek (bölge bazlı ruhsatlandırma farklılıkları nedeniyle bu teknik bir zorunluluk).
- **Fiziksel bir eyleyici (aktüatör) değil.** Sulama vanası açmak, ilaç püskürtmek gibi donanım kontrolü bu uygulamanın kapsamında yok (Bölüm 16'da "gelecek" olarak işaretli).

**Sorumluluk sınırı:** Son karar her zaman kullanıcıdadır. AI'nin ürettiği her öneri, kaynağını (hangi kayıtlara dayandığını) gösterebilmelidir.

---

## 2. AI Katman Mimarisi

```
┌─────────────────────────────────────────────────┐
│ 1. Presentation Layer                            │  Sohbet ekranı, öneri kartları, sesli asistan UI
├─────────────────────────────────────────────────┤
│ 2. Conversation Orchestrator                     │  Akışı yönetir: context topla → prompt kur →
│                                                    │  sağlayıcıyı çağır → tool call'ları işle → yanıtı UI'a ver
├─────────────────────────────────────────────────┤
│ 3. Context Engine                                 │  Bu soru için hangi veri gerekli, karar verir
├─────────────────────────────────────────────────┤
│ 4. Prompt Builder                                 │  Sistem promptu + context + mesaj + geçmişi birleştirir
├─────────────────────────────────────────────────┤
│ 5. AI Provider Adapter                            │  Gemini/OpenAI/Claude/yerel LLM — ortak arayüz
├─────────────────────────────────────────────────┤
│ 6. Tool Calling Layer                             │  AI'nin çağırabileceği salt-okunur fonksiyonlar
├─────────────────────────────────────────────────┤
│ 7. Knowledge Layer                                │  Yerel veri sorguları + (Faz 2) RAG + (opsiyonel) internet
├─────────────────────────────────────────────────┤
│ 8. Memory Layer                                   │  Konuşma geçmişi, kısa/uzun hafıza yönetimi
├─────────────────────────────────────────────────┤
│ 9. Storage Layer                                  │  SQLite (veri) + Secure Storage (sadece API anahtarı)
└─────────────────────────────────────────────────┘
```

**Neden "Reasoning Layer" ayrı bir katman değil?** Akıl yürütme (reasoning), sağlayıcı modelin kendi işidir; bunun üzerine ayrı bir soyutlama gereksiz olurdu (Kural 4). "Cloud Services" de tek başına bir katman değil — Provider Adapter'ın arkasında bir detay.

---

## 3. AI Hafıza Mimarisi

| Veri Türü | Nerede Tutulur | Kalıcılık |
|---|---|---|
| Konuşma mesajları (kullanıcı + AI) | SQLite (`ai_conversations`, `ai_messages`) | Kullanıcı silene kadar kalıcı |
| Kısa süreli hafıza (son ~10 mesaj) | SQLite'tan her promptta okunur, ham olarak gönderilir | Otomatik "unutma" yok |
| Uzun süreli özet | SQLite (`ai_conversation_summaries`) | Kullanıcı **açıkça** "özetle" derse oluşur — otomatik arka planda ÜRETİLMEZ |
| Kullanıcı onaylı "hatırlanacak gerçekler" | SQLite (`ai_facts`) | AI önerir, kullanıcı onaylarsa yazılır — AI kendiliğinden yazamaz |
| API anahtarı | Secure Storage (Keystore) | ADR 0004/0006 ile aynı mekanizma |

**Neden konuşmalar Secure Storage'da değil, SQLite'ta?** Secure Storage anahtar/değer deposu — sorgulanamaz, listelenemez, filtrelenemez. Konuşma geçmişini aramak SQL gerektirir.

---

## 4. Context Engine

Her soruda tüm veriyi context'e koymak, hem token maliyetini artırır (Kural 16 ihlali) hem model performansını düşürür.

**İki kademeli, AI çağrısı gerektirmeyen filtreleme:**
1. **Ekran bağlamı (ücretsiz, otomatik):** UI state'inde zaten var olan bilgi.
2. **Anahtar kelime tabanlı yönlendirme (ücretsiz, yerel, deterministik):** "sulama" → hava durumu+parsel; "maliyet/kâr" → finans; "stok" → envanter. Ayrı bir niyet sınıflandırma AI çağrısı yapılmaz.

**Token tasarrufu:** Context'e ham kayıt dökümü değil, SQL ile önceden özetlenmiş istatistikler gönderilir.

**Açık sınır:** Bu kural tabanlı yaklaşım, birden fazla veri kaynağını aynı anda gerektiren karmaşık sorularda yetersiz kalabilir (bkz. Bölüm "Teknik Borç").

---

## 5. Prompt Engine

```
[SABİT SİSTEM PROMPTU] — rol, sınırlar (Bölüm 1), yanıt formatı, "öneridir" çerçevesi
[DİNAMİK CONTEXT] — Context Engine çıktısı, özetlenmiş
[KULLANICI GEÇMİŞİ] — Son ~10 mesaj (+ varsa özet)
[KULLANICI MESAJI] — Delimiter içinde (prompt-safety.util.ts deseninin devamı)
[ARAÇ ÇIKTILARI] — varsa, önceki tool call sonuçları
```

---

## 6. Knowledge Engine

**Öncelik sırası:**
1. **Kullanıcının kendi SQLite kayıtları** — en spesifik, en güvenilir, ücretsiz, offline.
2. **Yerel yüklenmiş dokümanlar / RAG** — Faz 2 kapsamı (ADR 0009).
3. **İnternet** — SADECE kullanıcı açıkça izin vermişse (Bölüm 15) VE gerekliyse. AI'nin kendi başına serbest web taraması yapması tasarlanmıyor.

---

## 7. Tool Calling

**Temel ilke: Varsayılan salt-okunur, yazma her zaman açık onay gerektirir.**

| Araç | Tür | Onay Gerekir mi? |
|---|---|---|
| `queryParcelData`, `queryTreeData`, `queryObservations`, `queryFinanceSummary`, `queryInventory` | Okuma | Hayır |
| `getWeatherForecast` (önbelleğe alınmış/son bilinen veri) | Okuma | Hayır |
| `analyzePhoto` | AI hesaplama | Örtük onay (kullanıcı zaten "analiz et" dedi) |
| `createReminder`, `updateObservationNote`, `addAiFact` | **Yazma** | **Evet — açık onay** |

Kamera/GPS/Dosya sistemi gibi native API'lere AI doğrudan erişemez — bunlar kullanıcı tarafından tetiklenen ayrı UI akışlarıdır.

---

## 8. Offline-First AI

| Özellik | İnternet Yokken |
|---|---|
| Doğal dil sohbeti (bulut model) | ❌ Çalışmaz |
| Fotoğraf AI analizi (bulut model) | ❌ Çalışmaz |
| Sesli asistan (STT/TTS) | ✅ Kısmen (Android yerleşik API'ler cihaz üzerinde çalışabilir), ama cevap üretimi internet gerektirir |
| Geçmiş konuşmaları görüntüleme | ✅ Tam çalışır |
| Yerel veri özetleri (AI'siz, düz SQL) | ✅ Tam çalışır |
| Son bilinen hava durumu (önbelleğe alınmış) | ✅ Çalışır, "güncel değil" uyarısıyla |

**Kullanıcı nasıl anlar:** Sohbet ekranında bağlantı durumu göstergesi (`@capacitor/network` — AI modülüyle birlikte eklenecek).

---

## 9-10. Cloud AI ve Provider Adapter Mimarisi

```
Uygulama Kodu
     │
     ▼
AIProvider arayüzü (ortak, sabit)
  - sendMessage(prompt, tools?) → AIResponse
  - streamMessage(prompt, tools?) → AsyncIterable<AIResponseChunk>
  - analyzeImage(image, prompt) → AIResponse
     │
     ├── GeminiProviderAdapter
     ├── OpenAIProviderAdapter      (ileride)
     ├── ClaudeProviderAdapter      (ileride)
     └── LocalLLMProviderAdapter    (ileride, Bölüm 16)
```

Uygulama kodu hiçbir zaman doğrudan bir sağlayıcının SDK'sını çağırmaz — her zaman `AIProvider` arayüzü üzerinden (native eklenti deseniyle tutarlı, Kural 12).

**Bilinen zorluk:** Her sağlayıcının tool calling formatı farklıdır; adapter, ortak `ToolDefinition` şemasını her sağlayıcının formatına çevirmekle yükümlü — implementasyonun en karmaşık kısmı.

---

## 11. Fotoğraf Analizi

1. Fotoğraf çekilir (Modül 3, Kamera) → dosya sisteminde saklanır, veritabanına sadece yol yazılır.
2. EXIF metadata (tarih, varsa GPS) çıkarılır, kayıtla ilişkilendirilir.
3. Kullanıcı "AI ile analiz et" derse: fotoğraf + ağaç context'i (tür, dikim yılı, geçmiş analizler) birlikte gönderilir.
4. Sonuç (büyüme evresi, sağlık skoru, hastalık işareti — web projesinin `PhotoAiAnalysis` modeli referans) SQLite'a kaydedilir.

**Referans ağaç mantığı:** `is_reference_tree = 1` işaretli ağaçlar için düzenli takip önerilir — bu bir kolaylıktır, kısıtlama değil.

---

## 12. Sesli Asistan — Tam Akış

```
🎤 Mikrofon → Ses kaydı (@capgo/capacitor-audio-recorder, ADR 0007)
     → Konuşmadan Metne (Android yerleşik SpeechRecognizer, ücretsiz)
     → Normal sohbet akışı (Context → Prompt → Provider)
     → AI metin cevabı
     → Metinden Sese (Android yerleşik TextToSpeech, ücretsiz)
     → 🔊 Kullanıcıya sesli okunur
```

Bulut STT/TTS servisi eklenmiyor (Kural 17).

**Açık araştırma konusu:** Android yerleşik STT'nin Türkçe/tarım terminolojisi doğruluğu doğrulanmamış — ilgili modülde gerçek cihazda test edilecek.

---

## 13. AI Güvenliği

- API anahtarı: ADR 0004/0006'daki Keystore mekanizması miras alınır.
- Ham GPS koordinatları sadece gerçekten gerektiğinde (hava durumu sorgusu) kullanılır.
- Merkezi sunucu olmadığı için (ADR 0001) konuşma geçmişi hiçbir "bizim" sunucumuza gitmez.
- Prompt injection: Bölüm 5'teki delimiter deseni + hiçbir eylemin otomatik yürütülmemesi (Bölüm 7) çift katmanlı savunma sağlar.

---

## 14. Token Optimizasyonu

| Teknik | Nasıl |
|---|---|
| Kısa hafıza | Son ~10 mesaj, ham |
| Uzun hafıza | SQL ile önceden özetlenmiş istatistikler (AI çağrısı gerektirmez) |
| Konuşma özetleme | Sadece kullanıcı açıkça isterse |
| RAG (Faz 2) | Sadece gerçekten ilgili doküman parçaları |
| Context Engine filtrelemesi | Bölüm 4'teki kural tabanlı seçim |

---

## 15. AI Ayarları

| Ayar | Varsayılan |
|---|---|
| İnternet kullanımına izin | Kapalı → ilk kullanımda onay istenir |
| Fotoğraf analizi | Açık (her fotoğrafta ayrı onay) |
| Ses özelliği | Kapalı, kullanıcı açar |
| **Otomatik/proaktif öneriler** | **Varsayılan KAPALI** |
| Yanıt uzunluğu | Orta (kısa/orta/detaylı seçenek) |
| AI sağlayıcı/model seçimi | Gemini (varsayılan) |
| "Yaratıcılık" (temperature) | Düşük, sabit, kullanıcıya sunulmuyor |

---

## 16. Gelecek Planı

| Gelecek Özellik | Mimarinin Hazırlığı |
|---|---|
| IoT sensörleri | Yeni SQLite tablosu + Context Engine'e yeni veri kaynağı |
| Otomatik sulama | Tool Calling Layer'a yazma aracı — onay ilkesi zaten kapsıyor |
| Drone / Uydu görüntüleri | Fotoğraf Analizi akışı genişletilir, farklı görüntü kaynağı |
| Zararlı tespiti | Ayrı analiz tool'u / adapter yeteneği |
| Verim tahmini | Mevcut Knowledge Engine + yeni prompt şablonu yeterli |
| Çoklu çiftlik yönetimi | **En büyük değişiklik** — her tabloya `farm_id` (migration ile), Context Engine'in "hangi çiftlik" bilmesi gerekir. Bugün eklenmiyor (YAGNI) ama şema buna kapalı değil |

---

## 17. Çok Dilli AI Mimarisi — *(Globalization kararı sonrası eklendi, 2026-07-14)*

Bu bölüm, Engineering Protocol Bölüm 18 (Globalization Policy) ve ADR 0011 (i18n Mimarisi) sonrası AI katmanının dil davranışını netleştirir.

| Soru | Karar | Gerekçe |
|---|---|---|
| **AI hangi dilde yanıt üretmeli?** | Her zaman kullanıcının aktif arayüz dili (i18next `language`) | Bölüm 15'teki (AI Ayarları) kullanıcı deneyimi ilkesiyle tutarlı — bildirimler, hata mesajları, AI cevapları hep aynı dilde |
| **Bu, sistem promptuna nasıl yansır?** | Sistem promptunun kendisi **tek, sabit bir iç dilde** (İngilizce) yazılır; sona "Kullanıcının dili: {dil_kodu}. Yanıtını bu dilde ver." talimatı eklenir | N farklı dilde N farklı sistem promptu bakımı (Kural 8: kod tekrarından kaçınma) yerine tek kaynak — yeni dil eklemek sistem promptunu değiştirmez |
| **Hafızada (SQLite `ai_messages`) hangi dil saklanır?** | Mesaj **orijinal yazıldığı dilde** saklanır — çeviri yapılıp saklanmaz | Çeviri hem ekstra AI çağrısı (Kural 16 ihlali) hem bilgi kaybı riski taşır. Kullanıcı dil değiştirirse geçmiş konuşmalar eski dilde kalır — bu normal ve beklenen bir davranıştır |
| **AI hangi dili "hafızasında" tutmalı?** | Ayrı bir "AI hafızası" dili yok — Bölüm 3'teki `ai_facts` tablosu da orijinal üretildiği dilde saklanır | Ayrı bir çeviri katmanı, gereksiz karmaşıklık (Kural 4) |
| **Kullanıcıya hangi dil gösterilir?** | UI, i18next; AI yanıtları, AI'nin ürettiği dil (yukarıdaki kuralla aynı) — ikisi her zaman senkron | — |
| **SQLite şeması dil için ayrı bir sütun gerektirir mi?** | Hayır, bugün gerekmez (YAGNI) — gerekirse ileride analitik amaçlı opsiyonel bir `detected_language` sütunu eklenebilir, bugün eklenmiyor | — |
| **Embedding (Faz 2, RAG) hangi dilde çalışacak?** | **Açık araştırma konusu — şimdi çözülmüyor.** Çok dilli embedding modelleri mevcut, hangisinin seçileceği Faz 2 kapsamında ayrıca araştırılacak | Varsayımla kapatılmıyor (Kural 30) |

---

## Bu AI Mimarisinde Gelecekte Teknik Borç Oluşturabilecek Noktalar

1. **Context Engine'in kural tabanlı yaklaşımı, çok modüllü sorularda kırılgan.** Alternatif (AI'ye önce "hangi veriye ihtiyacın var" sordurmak) maliyeti ikiye katlar — Kural 16 ile gerilim. Basit kural tabanlı ile başlanıp gerçek kullanım verisiyle iyileştirilecek.
2. **Provider Adapter soyutlaması, sağlayıcıya özgü güçlü yönleri köreltebilir** — provider-bağımsızlığın bilinen bedeli.
3. **Sesli asistanın Türkçe/yerel terminoloji doğruluğu doğrulanmamış** — açık risk, varsayımla kapatılmadı.
4. **"Kullanıcı onaylı ai_facts" mekanizması, sürekli onay yorgunluğu riski taşıyabilir** — güvenlik/kullanılabilirlik gerilimi.
5. **Offline/online geçiş senaryoları (özellikle "zayıf ama var" internet) detaylı tasarlanmadı** — ayrı bir tasarım gerektirecek.
6. **RAG (Faz 2) entegrasyonu, bugünkü Context/Knowledge Engine'in genişletilmesini gerektirecek** — gerçek karmaşıklık şu an tam öngörülemez.
