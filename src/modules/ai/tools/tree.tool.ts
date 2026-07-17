/**
 * tree.tool.ts — Salt-Okunur AI Aracı
 * ======================================
 * bkz. ADR 0024.
 */

import { treeRepository } from "../../trees/data/tree.repository";
import type { AiTool } from "./ToolDefinition.interface";

export const treeTool: AiTool = {
  definition: {
    name: "queryTreeData",
    description:
      "Bir parseldeki ağaçları listeler veya belirli bir ağacın detaylarını getirir. Referans ağaçlar da dahildir.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        parcelId: { type: "string", description: "Ağaçları listelenecek parselin ID'si." },
        treeId: {
          type: "string",
          description: "Belirli bir ağacın ID'si (opsiyonel — verilirse SADECE o ağaç döner).",
        },
      },
      required: ["parcelId"],
    },
  },
  async execute(args) {
    const parcelId = typeof args.parcelId === "string" ? args.parcelId : undefined;
    const treeId = typeof args.treeId === "string" ? args.treeId : undefined;

    if (treeId) {
      const tree = await treeRepository.getById(treeId);
      if (!tree) {
        return { found: false };
      }
      return {
        found: true,
        treeNumber: tree.treeNumber,
        variety: tree.variety,
        plantingYear: tree.plantingYear,
        isReferenceTree: tree.isReferenceTree,
      };
    }

    if (!parcelId) {
      return { error: "parcelId veya treeId gerekli." };
    }

    const trees = await treeRepository.listByParcel(parcelId);
    return {
      totalCount: trees.length,
      trees: trees.map((t) => ({
        id: t.id,
        treeNumber: t.treeNumber,
        variety: t.variety,
        isReferenceTree: t.isReferenceTree,
      })),
    };
  },
};
