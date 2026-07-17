/**
 * parcel.tool.ts — Salt-Okunur AI Aracı
 * =========================================
 * bkz. ADR 0024. Kullanıcının kendi verisini sorgular (Bölüm 6, 1.
 * öncelik: "Kullanıcının kendi SQLite kayıtları").
 */

import { parcelRepository } from "../../parcels/data/parcel.repository";
import type { AiTool } from "./ToolDefinition.interface";

export const parcelTool: AiTool = {
  definition: {
    name: "queryParcelData",
    description:
      "Kullanıcının çiftliğindeki parselleri listeler veya belirli bir parselin detaylarını getirir. parcelId verilmezse tüm parseller özet olarak döner.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        parcelId: {
          type: "string",
          description: "Belirli bir parselin ID'si (opsiyonel — verilmezse tüm parseller listelenir).",
        },
      },
    },
  },
  async execute(args) {
    const parcelId = typeof args.parcelId === "string" ? args.parcelId : undefined;

    if (parcelId) {
      const parcel = await parcelRepository.getById(parcelId);
      if (!parcel) {
        return { found: false };
      }
      return {
        found: true,
        name: parcel.name,
        cropType: parcel.cropType,
        areaDekar: parcel.areaDekar,
      };
    }

    // Token Optimizasyonu (Bölüm 14): ham kayıt dökümü değil, özet.
    const parcels = await parcelRepository.list({ limit: 50 });
    return {
      totalCount: parcels.length,
      parcels: parcels.map((p) => ({ id: p.id, name: p.name, cropType: p.cropType, areaDekar: p.areaDekar })),
    };
  },
};
