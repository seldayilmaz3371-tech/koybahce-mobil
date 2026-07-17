/**
 * toolPromptSection.ts
 * =======================
 * bkz. ADR 0024. Modele, elindeki verileri TAHMİN ETMEK yerine
 * araçları ÇAĞIRMASINI teşvik eden kısa bir talimat.
 */

export function buildToolPromptSection(hasTools: boolean): string | null {
  if (!hasTools) {
    return null;
  }
  return `=== ARAÇ KULLANIMI ===\nSana sağlanan araçları, kullanıcının sorusunu doğru yanıtlamak için gerektiğinde çağır. Elindeki veriyi TAHMİN ETME — emin değilsen ilgili aracı çağırıp gerçek veriyi al.`;
}
