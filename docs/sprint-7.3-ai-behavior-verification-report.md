# AI Davranış Doğrulama Raporu

**Tarih:** 2026-07-17 · **Kapsam:** Sprint 7.3, Madde 2 — "Kod değiştirmeden önce doğrula"
**Metodoloji:** Kod seviyesinde uçtan uca izleme (Provider → Session → Hook → Screen), varsayılmadan.

---

## 🔴 Dürüstçe Belirtilmesi Gereken Bir Sınır

Kullanıcının isteği "Bunu Logcat ve uygulama loglarıyla kanıtla" idi. **Ben (Claude) bu ortamda gerçek bir Android cihaza veya çalışan bir Logcat oturumuna erişemiyorum** — bu analiz **tamamen kod seviyesinde** yapıldı. Aşağıda hem kanıtladığım şeyleri hem de SENİN gerçek cihazda ayrıca doğrulaman gerekenleri ayrı ayrı işaretliyorum.

---

## 1. Gemini API'ye Gerçekten İstek Gidiyor mu?

**✅ EVET — kod seviyesinde kesin kanıtlandı.**

`src/modules/ai/providers/GeminiProvider.ts` (satır 126-136):

```ts
async sendMessage(messages, options = {}): Promise<AIProviderResponse> {
  const apiKey = await this.getApiKey();       // Secure Storage'dan GERÇEK anahtar okunur
  const client = new GoogleGenAI({ apiKey });   // Resmi @google/genai SDK'sı

  const response = await callGeminiWithRetry(() =>
    client.models.generateContent({             // GERÇEK ağ çağrısı
      model: GEMINI_MODEL,
      contents: buildContents(messages, options.pendingToolResults),
      config: { systemInstruction: options.systemInstruction, tools: buildTools(options.tools) },
    })
  );
  ...
}
```

Bu, `@google/genai@2.12.0` resmi SDK'sının `models.generateContent()` metodunu **doğrudan** çağırıyor — bu metot, Google'ın Gemini API sunucularına gerçek bir HTTPS isteği gönderir (SDK'nın kendi implementasyonu, bizim kodumuzun değil).

**Sağlayıcı sayısı doğrulaması:** `grep -rn "providerRegistry.register"` komutu, projede **SADECE BİR** kayıt noktası olduğunu gösterdi (`bootstrapAi.ts`, satır 27) — `geminiProvider`. Başka hiçbir sağlayıcı (mock/sahte/fallback) **hiçbir yerde kayıtlı değil**.

## 2. Hangi Model Kullanılıyor?

**`gemini-2.5-flash`** — `GeminiProvider.ts` satır 35'te sabit tanımlı:

```ts
const GEMINI_MODEL = "gemini-2.5-flash";
```

Model seçimi bugün kullanıcıya sunulmuyor (AI Master Architecture Bölüm 15'in kaydettiği bir gelecek özelliği — bugün sabit).

## 3. Gelen Cevap Gerçekten Gemini Cevabı mı, Yoksa Fallback mi?

**✅ HİÇBİR FALLBACK/SAHTE CEVAP MEKANİZMASI YOK — kod seviyesinde kanıtlandı.**

- `GeminiProvider.sendMessage()`'da, `response.text` **doğrudan** `client.models.generateContent()`'in döndürdüğü nesneden okunuyor (`response.text ?? null`) — hiçbir "eğer boşsa X yaz" gibi bir alternatif yol **yok**.
- API anahtarı **yoksa**, sistem **sahte bir cevap ÜRETMİYOR** — `AI_PROVIDER_API_KEY_NOT_CONFIGURED` hatası **fırlatılıyor** (`getApiKey()`, satır 109-114), bu hata `AiChatScreen`'de çevrilmiş bir hata mesajı olarak gösteriliyor.
- API çağrısı **başarısız olursa** (ağ hatası, kota hatası), `callGeminiWithRetry` (web projesinden uyarlanan retry mantığı) belirli koşullarda yeniden dener, **son çare olarak hatayı fırlatır** — asla "uydurma" bir cevap döndürmez.

**Grep ile doğrulama:** `grep -n "fallback\|mock\|sahte\|dummy" GeminiProvider.ts` **sıfır eşleşme** döndürdü.

## 4. "AI Yalnızca Bahçem Verileriyle Çalışacak Şekilde Tasarlandıysa" — Teknik Gerekçe

**Kısmen doğru — ama önemli bir nüans var, dürüstçe belirtiyorum:**

Sistem promptu (`src/modules/ai/prompt/systemPrompt.ts`) modele **açıkça** şunu söylüyor:

> *"You can ONLY read the user's own farm data through the tools provided to you... Base your answers strictly on the data returned by the tools. Never invent or guess numbers, dates, or facts that are not present in the tool results."*

**Bu bir PROMPT TALİMATI, bir TEKNİK KISITLAMA DEĞİL.** Gemini modelinin kendisi genel amaçlı bir LLM'dir — teorik olarak sistem promptunu görmezden gelip genel bir soruya (ör. "Fransa'nın başkenti nedir?") cevap **verebilir** (LLM'lerin doğası gereği, hiçbir prompt talimatı %100 garanti değildir). Bizim tasarımımızda buna karşı **ek bir teknik bariyer YOK** (ör. cevabı filtreleyen bir ikinci kontrol katmanı yok).

**Gerçek, güvence altına alınan teknik kısıtlama SADECE şu:** AI'nin **YAZMA YETKİSİ** yok (Tool Registry'de sadece 5 salt-okunur araç kayıtlı, hiçbir yazma aracı yok) — bu, prompt talimatına DEĞİL, **koda** dayanıyor, gerçek bir garanti. "AI sadece okuyabilir" iddiası **teknik olarak garantili**; "AI sadece Bahçem konularında konuşur" iddiası **sadece prompt seviyesinde bir yönlendirme**.

## 5. Senin Gerçek Cihazda Ayrıca Doğrulaman Gerekenler (Ben Yapamıyorum)

| Doğrulama | Nasıl |
|---|---|
| Gerçek bir ağ isteğinin GERÇEKTEN gittiği | `adb logcat` açıkken bir soru sor, `generativelanguage.googleapis.com` içeren bir HTTP isteği logcat'te veya Android Studio Network Profiler'da görünmeli |
| Kota/API anahtarı hatalarının gerçek cihazda doğru göründüğü | Geçersiz bir anahtarla dene, "AI_004" çevirisinin (ham JSON DEĞİL) göründüğünü doğrula |
| Yanıt süresinin gerçekçi (ağ gecikmesi içeren) olduğu | Bir soru sorup yanıt süresini ölç — sahte/yerel bir cevap olsaydı anlık gelirdi, gerçek bir API çağrısı **gözle görülür bir gecikme** taşır |

## Sonuç

Kod seviyesinde: **Gemini API'ye gerçekten istek gidiyor, `gemini-2.5-flash` modeli kullanılıyor, hiçbir fallback/sahte cevap mekanizması yok.** "Sadece Bahçem verileriyle çalışma" iddiası **teknik olarak kısmen doğru** (yazma erişimi gerçekten engellenmiş) ama **tam anlamıyla garanti edilmiyor** (konu kısıtlaması sadece prompt seviyesinde) — bu, dürüstçe kayıt altına alınması gereken bir nüans.
