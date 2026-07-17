/**
 * ToolRegistry
 * ===============
 * bkz. ADR 0024 Karar 2. Kullanıcının istediği "gerçek registry
 * mantığı" — düz bir liste değil, `register()`/`find()`/`invoke()`/
 * `list()`.
 *
 * `invoke()` MERKEZİ bir nokta: ileride (Sprint 6.1+) yazma araçları
 * eklendiğinde, onay akışının TEK BİR YERDEN geçmesini garanti eder
 * (bugün sadece salt-okunur araçlar kayıtlı, onay mantığı YOK — YAGNI).
 */

import type { AIToolDefinition } from "../providers/AIProvider.interface";
import type { AiTool } from "./ToolDefinition.interface";

class ToolRegistry {
  private readonly tools = new Map<string, AiTool>();

  register(tool: AiTool): void {
    this.tools.set(tool.definition.name, tool);
  }

  find(name: string): AiTool | null {
    return this.tools.get(name) ?? null;
  }

  async invoke(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.find(name);
    if (!tool) {
      throw new Error(`AI_TOOL_NOT_FOUND: ${name}`);
    }
    return tool.execute(args);
  }

  list(): AIToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => tool.definition);
  }
}

export const toolRegistry = new ToolRegistry();
