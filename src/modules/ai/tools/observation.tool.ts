/**
 * observation.tool.ts — Salt-Okunur AI Aracı
 * ==============================================
 * bkz. ADR 0024. Token Optimizasyonu: son 5 gözlem + toplam sayı
 * (ham tam liste DEĞİL).
 */

import { observationRepository } from "../../observations/data/observation.repository";
import type { AiTool } from "./ToolDefinition.interface";

const RECENT_OBSERVATIONS_LIMIT = 5;

export const observationTool: AiTool = {
  definition: {
    name: "queryObservations",
    description:
      "Bir ağacın veya parselin son gözlemlerini getirir (en fazla son 5, toplam sayı ile birlikte).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        parcelId: { type: "string", description: "Parsel geneli gözlemler için parsel ID'si." },
        treeId: { type: "string", description: "Belirli bir ağacın gözlemleri için ağaç ID'si." },
      },
    },
  },
  async execute(args) {
    const parcelId = typeof args.parcelId === "string" ? args.parcelId : undefined;
    const treeId = typeof args.treeId === "string" ? args.treeId : undefined;

    if (!parcelId && !treeId) {
      return { error: "parcelId veya treeId gerekli." };
    }

    const observations = treeId
      ? await observationRepository.listByTree(treeId, { limit: RECENT_OBSERVATIONS_LIMIT })
      : await observationRepository.listByParcel(parcelId as string, { limit: RECENT_OBSERVATIONS_LIMIT });

    return {
      recentCount: observations.length,
      recentObservations: observations.map((o) => ({
        type: o.observationType,
        note: o.note,
        observedAt: o.observedAt,
      })),
    };
  },
};
