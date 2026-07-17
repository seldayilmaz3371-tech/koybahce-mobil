import { describe, expect, it } from "vitest";

describe("registerReadOnlyTools", () => {
  it("5 salt-okunur aracın TAMAMINI ToolRegistry'ye kaydeder", async () => {
    const { registerReadOnlyTools } = await import("./registerReadOnlyTools");
    const { toolRegistry } = await import("./ToolRegistry");

    registerReadOnlyTools();

    const names = toolRegistry.list().map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "queryParcelData",
        "queryTreeData",
        "queryObservations",
        "queryMaintenanceData",
        "queryFinanceSummary",
      ])
    );
  });
});
