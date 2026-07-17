/**
 * finance.tool.ts — Salt-Okunur AI Aracı
 * ==========================================
 * bkz. ADR 0024. AI Master Architecture Bölüm 7'de tanımlanan
 * `queryFinanceSummary` ismine sadık kalındı. Token Optimizasyonu
 * (Bölüm 14): ham finans kaydı DÖKÜMÜ DEĞİL, TOPLAM maliyet/satış
 * özeti — bu, en açık "SQL ile önceden özetlenmiş istatistik" örneği.
 */

import { financeRepository } from "../../finance/data/finance.repository";
import { toMajorUnits } from "../../finance/domain/money";
import type { AiTool } from "./ToolDefinition.interface";

export const financeTool: AiTool = {
  definition: {
    name: "queryFinanceSummary",
    description: "Bir parselin toplam maliyet ve satış özetini (TL) getirir — ham kayıt listesi DEĞİL.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        parcelId: { type: "string", description: "Özeti istenen parselin ID'si." },
      },
      required: ["parcelId"],
    },
  },
  async execute(args) {
    const parcelId = typeof args.parcelId === "string" ? args.parcelId : undefined;
    if (!parcelId) {
      return { error: "parcelId gerekli." };
    }

    // `activeOnly` varsayılan zaten true — pasife alınmış kayıtlar
    // toplama dahil edilmiyor.
    const records = await financeRepository.listByParcel(parcelId, { limit: 1000 });

    let totalCostMinor = 0;
    let totalSaleMinor = 0;
    for (const record of records) {
      if (record.recordType === "cost") {
        totalCostMinor += record.amountMinor;
      } else {
        totalSaleMinor += record.amountMinor;
      }
    }

    return {
      recordCount: records.length,
      totalCostTL: toMajorUnits(totalCostMinor),
      totalSaleTL: toMajorUnits(totalSaleMinor),
      netTL: toMajorUnits(totalSaleMinor - totalCostMinor),
      currency: "TRY",
    };
  },
};
