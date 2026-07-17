import { describe, expect, it } from "vitest";
import type { AiTool } from "./ToolDefinition.interface";

function fakeTool(name: string, executeResult: unknown): AiTool {
  return {
    definition: { name, description: `${name} açıklaması`, parametersJsonSchema: { type: "object" } },
    async execute() {
      return executeResult;
    },
  };
}

describe("ToolRegistry", () => {
  it("register() sonrası find() ile AYNI aracı döner", async () => {
    const { toolRegistry } = await import("./ToolRegistry");
    const tool = fakeTool("testTool1", { ok: true });

    toolRegistry.register(tool);

    expect(toolRegistry.find("testTool1")).toBe(tool);
  });

  it("kayıtlı olmayan bir araç için find() null döner", async () => {
    const { toolRegistry } = await import("./ToolRegistry");
    expect(toolRegistry.find("hic-kayitli-olmayan-arac")).toBeNull();
  });

  it("invoke() aracın execute()'unu GERÇEKTEN çalıştırır ve sonucu döner", async () => {
    const { toolRegistry } = await import("./ToolRegistry");
    toolRegistry.register(fakeTool("testTool2", { count: 5 }));

    const result = await toolRegistry.invoke("testTool2", {});

    expect(result).toEqual({ count: 5 });
  });

  it("invoke() kayıtlı olmayan bir araç için AÇIK bir hata fırlatır", async () => {
    const { toolRegistry } = await import("./ToolRegistry");
    await expect(toolRegistry.invoke("hic-kayitli-olmayan", {})).rejects.toThrow("AI_TOOL_NOT_FOUND");
  });

  it("list() kayıtlı araçların TANIMLARINI (execute() DEĞİL) döner", async () => {
    const { toolRegistry } = await import("./ToolRegistry");
    toolRegistry.register(fakeTool("testTool3", {}));

    const list = toolRegistry.list();

    const found = list.find((d) => d.name === "testTool3");
    expect(found).toMatchObject({ name: "testTool3", description: "testTool3 açıklaması" });
  });
});
