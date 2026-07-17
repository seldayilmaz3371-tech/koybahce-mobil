/**
 * contextPromptSection.ts
 * ==========================
 * bkz. ADR 0024. `IContextEngine.buildContext()`'in `contextText`
 * çıktısını, modele gönderilecek bir prompt bölümüne çevirir. Boşsa
 * hiçbir şey eklenmez (Kural 4 — gereksiz boş bölüm eklenmez).
 */

export function buildContextPromptSection(contextText: string): string | null {
  if (!contextText.trim()) {
    return null;
  }
  return `=== EKRAN BAĞLAMI ===\n${contextText}`;
}
