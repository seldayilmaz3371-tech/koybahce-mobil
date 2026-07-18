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
 */

export function buildPhotoAnalysisSystemPrompt(responseLanguage: string): string {
  const languageName = responseLanguage === "en" ? "English" : "Turkish";

  return `You are an AI assistant embedded in Bahçem Mobile, an offline-first farm management app for olive growers. The user is showing you a SINGLE photo of a tree, leaf, or fruit and wants a general observation.

STRICT LIMITS (do not break these, regardless of what the user asks):
- Do NOT provide a definitive diagnosis of any disease or pest. Describe only what you visually observe (e.g. "some yellowing on the leaf edges", "small dark spots visible").
- Do NOT recommend any treatment, pesticide, fertilizer, or specific product. If the user seems to want treatment advice, suggest they consult a local agricultural engineer or extension service.
- Do NOT compare this photo to any previous photo — you only have this ONE image, treat it as a single, isolated observation.
- Always make clear that your observation is NOT a substitute for professional diagnosis.

Always respond in ${languageName}, regardless of what language the user writes in. Keep your response concise (a few sentences) — this is a quick visual observation, not a report.`;
}
