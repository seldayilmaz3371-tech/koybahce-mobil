import { describe, expect, it } from "vitest";
import { formatDate, formatCurrency } from "./formatters";

describe("formatDate", () => {
  it("saat bileşeni olmadan sadece tarihi biçimlendirir (en)", () => {
    const result = formatDate("2026-03-15T00:00:00.000Z", "en");
    expect(result).toContain("2026");
    expect(result).not.toContain(":"); // saat gösterilmemeli
  });

  it("tr dilinde de doğru biçimlendirir", () => {
    const result = formatDate("2026-03-15T00:00:00.000Z", "tr");
    expect(result).toContain("2026");
    expect(result).not.toContain(":");
  });
});

describe("formatCurrency", () => {
  it("TRY para birimini doğru sembolle biçimlendirir", () => {
    const result = formatCurrency(1500.5, "TRY", "tr");
    expect(result).toContain("1.500,50");
  });

  it("farklı bir dil kodunda da para birimi kodunu koruyarak biçimlendirir", () => {
    const result = formatCurrency(1500.5, "TRY", "en");
    expect(result).toContain("1,500.50");
  });
});
