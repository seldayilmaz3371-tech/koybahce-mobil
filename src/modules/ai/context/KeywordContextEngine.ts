/**
 * KeywordContextEngine
 * =======================
 * bkz. ADR 0024 Karar 5, AI Master Architecture Bölüm 4. Anahtar
 * kelime → domain eşlemesi — SIFIR AI çağrısı (ücretsiz, yerel,
 * deterministik).
 *
 * BİLİNEN SINIR (Bölüm 4'ün kendi kayıtlı teknik borcu, ADR 0024'te
 * tekrarlandı): bu kural tabanlı yaklaşım, birden fazla veri kaynağını
 * aynı anda gerektiren karmaşık sorularda yetersiz kalabilir. Basit
 * kural tabanlı ile başlanıp gerçek kullanım verisiyle iyileştirilecek.
 */

import type { ContextResult, IContextEngine, ScreenContext } from "./IContextEngine.interface";

/** Anahtar kelime → ilgili araç isimleri eşlemesi. Türkçe, küçük harfe normalize edilmiş kelimeler. */
const KEYWORD_TOOL_MAP: Record<string, string[]> = {
  sulama: ["queryMaintenanceData"],
  gübre: ["queryMaintenanceData"],
  gübreleme: ["queryMaintenanceData"],
  ilaç: ["queryMaintenanceData"],
  ilaçlama: ["queryMaintenanceData"],
  budama: ["queryMaintenanceData"],
  bakım: ["queryMaintenanceData"],
  maliyet: ["queryFinanceSummary"],
  gider: ["queryFinanceSummary"],
  kâr: ["queryFinanceSummary"],
  kar: ["queryFinanceSummary"],
  satış: ["queryFinanceSummary"],
  gelir: ["queryFinanceSummary"],
  gözlem: ["queryObservations"],
  ağaç: ["queryTreeData"],
  parsel: ["queryParcelData"],
};

class KeywordContextEngine implements IContextEngine {
  async buildContext(userQuery: string, screenContext: ScreenContext): Promise<ContextResult> {
    const normalized = userQuery.toLowerCase();
    const matchedTools = new Set<string>();

    for (const [keyword, tools] of Object.entries(KEYWORD_TOOL_MAP)) {
      if (normalized.includes(keyword)) {
        for (const tool of tools) {
          matchedTools.add(tool);
        }
      }
    }

    // Ekran bağlamı (Bölüm 4 — "ekran bağlamı, ücretsiz, otomatik").
    const contextLines: string[] = [];
    if (screenContext.parcelId) {
      contextLines.push(`Kullanıcının şu an görüntülediği parsel ID'si: ${screenContext.parcelId}`);
    }
    if (screenContext.treeId) {
      contextLines.push(`Kullanıcının şu an görüntülediği ağaç ID'si: ${screenContext.treeId}`);
    }

    return {
      suggestedToolNames: Array.from(matchedTools),
      contextText: contextLines.join("\n"),
    };
  }
}

export const keywordContextEngine: IContextEngine = new KeywordContextEngine();
