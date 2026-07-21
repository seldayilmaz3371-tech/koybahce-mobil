// @vitest-environment jsdom
/**
 * AiDiagnosticScreen Testleri
 * ==============================
 * bkz. Sprint 10.7/10.8 (AI Diagnostic Build). En kritik senaryo: bu
 * ekranın debugMode kapalıyken GERÇEKTEN hiçbir şey göstermediği —
 * "Release sürümünde bu bilgiler görünmesin" gereksiniminin GERÇEK
 * testle kanıtı.
 *
 * Sprint 10.8 GÜNCELLEMESİ: `debugMode` artık bir PROP (route
 * wrapper'dan geliyor) — ekran KENDİ ayrı bir `useAiSettings()` çağrısı
 * YAPMIYOR (gereksiz çift yükleme/flicker riski GİDERİLDİ).
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { aiDiagnostics } from "./diagnostics/aiDiagnostics";
import { AiDiagnosticScreen } from "./AiDiagnosticScreen";

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

afterEach(() => {
  cleanup();
  aiDiagnostics.reset();
  vi.restoreAllMocks();
});

describe("AiDiagnosticScreen — Görünürlük Kuralı (Sprint 10.7, KULLANICININ AÇIK TALEBİ)", () => {
  it("debugMode=false İSE, ekran GERÇEKTEN hiçbir şey göstermez (null render)", () => {
    const { container } = render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={false} />);

    expect(container.textContent).toBe("");
  });

  it("debugMode=true İSE, ekran GERÇEKTEN teşhis bilgilerini gösterir", async () => {
    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("AI Diagnostic Info")).toBeTruthy());
    expect(screen.getByText("Provider:")).toBeTruthy();
    expect(screen.getByText("Error Code:")).toBeTruthy();
    expect(screen.getByText("Request Duration:")).toBeTruthy();
    expect(screen.getByText("Retry Count:")).toBeTruthy();
  });
});

describe("AiDiagnosticScreen — Gerçek Veri Gösterimi (Sprint 10.7/10.8)", () => {
  it("aiDiagnostics'e kaydedilen GERÇEK veriler, ekranda GERÇEKTEN görünür", async () => {
    aiDiagnostics.recordProvider("gemini");
    aiDiagnostics.recordApiKeyStatus("configured");
    aiDiagnostics.recordMappedErrorCode("AI_006");
    aiDiagnostics.recordRetry();
    aiDiagnostics.recordRetry();

    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("gemini")).toBeTruthy());
    expect(screen.getByText("configured")).toBeTruthy();
    expect(screen.getByText("AI_006")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy(); // retryCount
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();

    render(<AiDiagnosticScreen onBack={onBack} debugMode={true} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    screen.getByText("Back").click();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("AiDiagnosticScreen — Stack Trace Taşma Koruması (Sprint 10.8, GERÇEK BULGU DÜZELTMESİ)", () => {
  it("çok uzun (6 satırdan fazla) bir stack trace GERÇEKTEN kısaltılır, ekranın geri kalanını EZMEZ", async () => {
    class FakeApiError extends Error {
      status: number;
      constructor() {
        super("test hatası");
        this.name = "ApiError";
        this.status = 500;
        this.stack = Array.from({ length: 20 }, (_, i) => `satır ${i}`).join("\n");
      }
    }
    aiDiagnostics.recordRawError(new FakeApiError());

    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText(/ilk 6 satır/)).toBeTruthy());
    expect(screen.getByText("satır 0", { exact: false })).toBeTruthy();
    expect(screen.queryByText("satır 19", { exact: false })).toBeNull();
    // Stack ne kadar uzun olursa olsun, ASIL önemli alanlar HER ZAMAN görünür kalmalı.
    expect(screen.getByText("Provider:")).toBeTruthy();
    expect(screen.getByText("Back")).toBeTruthy();
  });

  it("6 satır VEYA daha kısa bir stack trace, HİÇ kısaltma notu OLMADAN tam gösterilir", async () => {
    class FakeApiError extends Error {
      status: number;
      constructor() {
        super("test hatası");
        this.name = "ApiError";
        this.status = 500;
        this.stack = "satır 1\nsatır 2\nsatır 3";
      }
    }
    aiDiagnostics.recordRawError(new FakeApiError());

    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("Stack:")).toBeTruthy());
    expect(screen.queryByText(/ilk 6 satır/)).toBeNull();
  });
});
