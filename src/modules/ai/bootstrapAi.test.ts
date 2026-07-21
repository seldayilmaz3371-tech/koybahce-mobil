import { describe, expect, it } from "vitest";

describe("bootstrapAi", () => {
  it("Gemini provider'ı VE 6 salt-okunur aracı kaydeder (Sprint 10.6 — Hasat aracı eklendi)", async () => {
    const { bootstrapAi } = await import("./bootstrapAi");
    const { providerRegistry } = await import("./providers/ProviderRegistry");
    const { toolRegistry } = await import("./tools/ToolRegistry");

    bootstrapAi();

    expect(providerRegistry.get("gemini")).not.toBeNull();
    expect(toolRegistry.list().length).toBeGreaterThanOrEqual(6);
    expect(toolRegistry.find("queryHarvestSummary")).not.toBeNull();
  });

  it("art arda ÇAĞRILMASI hataya YOL AÇMAZ (idempotent)", async () => {
    const { bootstrapAi } = await import("./bootstrapAi");

    expect(() => {
      bootstrapAi();
      bootstrapAi();
      bootstrapAi();
    }).not.toThrow();
  });
});
