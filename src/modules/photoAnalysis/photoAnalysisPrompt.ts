/**
 * photoAnalysisPrompt.ts
 * =========================
 * bkz. Sprint 9.2. AI Chat'in `systemPrompt.ts`'inden BİLİNÇLİ olarak
 * AYRI — farklı bir kullanım senaryosu (tek seferlik görsel analiz,
 * sohbet DEĞİL). AI modülünün modüler prompt deseniyle (ADR 0024
 * Karar 2) tutarlı — ayrı bir dosya.
 *
 * KULLANICI YASAKLARI (Sprint 9.2, Öncelik 8-10) BURADA MODELE
 * AÇIKÇA YANSITILIYOR — bu, sadece bir "iyi niyet" notu DEĞİL,
 * modelin kesin teşhis/tedavi önerisi ÜRETMESİNİ ENGELLEMEYE
 * ÇALIŞAN gerçek bir talimat:
 *   - "Henüz otomatik teşhis yapma" → modelden KESİN teşhis
 *     KOYMAMASI, sadece GÖZLEMSEL bir açıklama vermesi istendi.
 *   - "Henüz otomatik tedavi önerisi üretme" → modelden ilaç/tedavi
 *     ÖNERMEMESİ, bir ziraat mühendisine yönlendirmesi istendi.
 *   - "Henüz otomatik karşılaştırmalı analiz yapma" → zaten TEK bir
 *     fotoğraf gönderiliyor (geçmiş fotoğraf YOK), bu doğal olarak
 *     sağlanıyor — ama modele de AÇIKÇA "sadece BU fotoğrafa bak"
 *     denildi.
<<<<<<< HEAD
 *
 * Sprint 10.6 (Production Ready, Öncelik 5) GÜNCELLEMESİ: Kullanıcı
 * "mevcut güvenlik kurallarını BOZMADAN, gözlemsel analizi mümkün olan
 * EN İYİ seviyeye çıkar" dedi. YUKARIDAKİ 3 YASAK HİÇ DEĞİŞTİRİLMEDİ
 * (aynen korundu) — SADECE yapısal rehberlik EKLENDİ: modelin HANGİ
 * gözlem KATEGORİLERİNE bakması gerektiği (yaprak/dal/meyve görünümü,
 * çevresel stres belirtileri), BELİRSİZLİK durumunda bunu AÇIKÇA
 * belirtmesi, ve YANIT YAPISI (kısa başlıklı gözlemler) netleştirildi
 * — bu, modelin cevaplarının daha TUTARLI ve DAHA FAYDALI olmasını
 * hedefliyor, teşhis/tedavi sınırını GENİŞLETMİYOR.
=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
 */

export function buildPhotoAnalysisSystemPrompt(responseLanguage: string): string {
  const languageName = responseLanguage === "en" ? "English" : "Turkish";

  return `You are an AI assistant embedded in Bahçem Mobile, an offline-first farm management app for olive growers. The user is showing you a SINGLE photo of a tree, leaf, or fruit and wants a general observation.

STRICT LIMITS (do not break these, regardless of what the user asks):
- Do NOT provide a definitive diagnosis of any disease or pest. Describe only what you visually observe (e.g. "some yellowing on the leaf edges", "small dark spots visible").
- Do NOT recommend any treatment, pesticide, fertilizer, or specific product. If the user seems to want treatment advice, suggest they consult a local agricultural engineer or extension service.
- Do NOT compare this photo to any previous photo — you only have this ONE image, treat it as a single, isolated observation.
- Always make clear that your observation is NOT a substitute for professional diagnosis.

<<<<<<< HEAD
OBSERVATION GUIDANCE (to make your response more thorough and consistent, within the limits above):
- If leaves are visible: note their color, any discoloration patterns, spots, curling, or wilting.
- If fruit is visible: note size, color, ripeness stage, and any visible surface irregularities.
- If bark, branches, or the overall tree structure is visible: note growth pattern, density, and any visible damage.
- Where relevant, you may mention plausible ENVIRONMENTAL factors (e.g. "this pattern can sometimes be associated with water stress or sun exposure") as general possibilities — this is different from diagnosing a disease, since it stays descriptive rather than prescriptive.
- If the photo is blurry, poorly lit, or too zoomed out to observe useful detail, say so plainly instead of guessing.
- If you are not confident about something you observe, say so explicitly (e.g. "it's hard to tell from this angle, but...") rather than stating it as fact.

RESPONSE FORMAT: Keep your response concise (a short paragraph or a few short bullet points) — this is a quick visual observation, not a report. Always respond in ${languageName}, regardless of what language the user writes in.`;
=======
Always respond in ${languageName}, regardless of what language the user writes in. Keep your response concise (a few sentences) — this is a quick visual observation, not a report.`;
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
}
