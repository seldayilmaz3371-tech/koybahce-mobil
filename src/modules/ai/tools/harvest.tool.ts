/**
 * harvest.tool.ts — Salt-Okunur AI Aracı
 * ==========================================
 * bkz. Sprint 10.6 (Production Ready — Öncelik 4). GERÇEK BULGU (AI
 * X-Ray denetiminde bulundu): 5 kayıtlı araçtan (Parcel/Tree/
 * Observation/Maintenance/Finance) hiçbiri Hasat modülünü
 * kapsamıyordu — kullanıcı "hasat verimim nasıl" gibi bir soru
 * sorarsa AI bu veriye hiç erişemiyordu. `finance.tool.ts`'in AYNI
 * deseni (Kural: kod tekrarından kaçın) — Token Optimizasyonu
 * (Bölüm 14): ham hasat kaydı DÖKÜMÜ DEĞİL, TOPLAM kg özeti.
 */

import { harvestRepository } from "../../harvest/data/harvest.repository";
import type { AiTool } from "./ToolDefinition.interface";

export const harvestTool: AiTool = {
  definition: {
    name: "queryHarvestSummary",
    description: "Bir parselin toplam hasat miktarını (kg) ve kayıt sayısını getirir — ham kayıt listesi DEĞİL.",
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

    // `activeOnly` varsayılan zaten true — pasife alınmış kayıtlar toplama dahil edilmiyor.
    const records = await harvestRepository.listByParcel(parcelId, { limit: 1000 });

    let totalQuantityKg = 0;
    for (const record of records) {
      totalQuantityKg += record.quantityKg;
    }

    return {
      recordCount: records.length,
      totalQuantityKg,
    };
  },
};
