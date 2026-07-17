/**
 * maintenance.tool.ts — Salt-Okunur AI Aracı
 * ==============================================
 * bkz. ADR 0024.
 */

import { maintenanceRepository } from "../../maintenance/data/maintenance.repository";
import type { AiTool } from "./ToolDefinition.interface";

const RECENT_MAINTENANCE_LIMIT = 5;

export const maintenanceTool: AiTool = {
  definition: {
    name: "queryMaintenanceData",
    description:
      "Bir parselin veya ağacın son bakım kayıtlarını (sulama, gübreleme, ilaçlama, budama vb.) getirir.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        parcelId: { type: "string", description: "Parsel geneli bakım kayıtları için parsel ID'si." },
        treeId: { type: "string", description: "Belirli bir ağacın bakım kayıtları için ağaç ID'si." },
      },
    },
  },
  async execute(args) {
    const parcelId = typeof args.parcelId === "string" ? args.parcelId : undefined;
    const treeId = typeof args.treeId === "string" ? args.treeId : undefined;

    if (!parcelId && !treeId) {
      return { error: "parcelId veya treeId gerekli." };
    }

    const records = treeId
      ? await maintenanceRepository.listByTree(treeId, { limit: RECENT_MAINTENANCE_LIMIT })
      : await maintenanceRepository.listByParcel(parcelId as string, { limit: RECENT_MAINTENANCE_LIMIT });

    return {
      recentCount: records.length,
      recentRecords: records.map((r) => ({
        type: r.maintenanceType,
        status: r.status,
        date: r.completedDate ?? r.scheduledDate,
      })),
    };
  },
};
