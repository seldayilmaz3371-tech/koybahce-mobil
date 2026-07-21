/**
 * Salt-Okunur Araçların Kaydı
 * ==============================
 * bkz. ADR 0024. `photo.tool.ts` BİLEREK burada YOK (Fotoğraf Analizi
 * Sprint 6 kapsamı dışında) — ama dosya yapısı (`tools/` klasörü) buna
 * hazır.
 */

import { toolRegistry } from "./ToolRegistry";
import { parcelTool } from "./parcel.tool";
import { treeTool } from "./tree.tool";
import { observationTool } from "./observation.tool";
import { maintenanceTool } from "./maintenance.tool";
import { financeTool } from "./finance.tool";
import { harvestTool } from "./harvest.tool";

export function registerReadOnlyTools(): void {
  toolRegistry.register(parcelTool);
  toolRegistry.register(treeTool);
  toolRegistry.register(observationTool);
  toolRegistry.register(maintenanceTool);
  toolRegistry.register(financeTool);
  toolRegistry.register(harvestTool);
}
