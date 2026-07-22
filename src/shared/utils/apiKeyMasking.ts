/**
 * apiKeyMasking.ts — Ortak API Key Maskeleme Yardımcısı
 * ==========================================================
 * bkz. Sprint 10.12, Kural 12 (kod tekrarından kaçın). ÖNCEDEN aynı
 * maskeleme mantığı `aiDiagnostics.ts` ve `useAiSettings.ts`'te AYRI
 * AYRI yazılmıştı (kod tekrarı) — buraya taşındı.
 *
 * GÜVENLİK: Hiçbir zaman anahtarın tam hali döndürülmez — sadece ilk
 * 4 + son 4 karakter, aradaki her şey "*" ile maskelenir.
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "*".repeat(apiKey.length);
  }
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
}
