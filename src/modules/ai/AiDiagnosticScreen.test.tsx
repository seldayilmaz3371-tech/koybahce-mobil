// @vitest-environment jsdom
/**
 * AiDiagnosticScreen Testleri
 * ==============================
 * bkz. Sprint 10.7/10.8/10.9 (AI Diagnostic Build). En kritik
 * senaryo: bu ekranın debugMode kapalıyken GERÇEKTEN hiçbir şey
 * göstermediği — "Release sürümünde bu bilgiler görünmesin"
 * gereksiniminin GERÇEK testle kanıtı.
 *
 * Sprint 10.9 GÜNCELLEMESİ: Ekran yeniden tasarlandı (gruplandırılmış
 * satırlar, "etiket: değer" yerine ayrı elemanlar) — testler yeni
 * DOM yapısına göre güncellendi. Ayrıca her "boş" alanın artık
 * ANLAMLI bir ifade taşıdığı (düz "—" DEĞİL) gerçek testle kanıtlandı.
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
    expect(screen.getByText("Provider")).toBeTruthy();
    expect(screen.getByText("Error Code")).toBeTruthy();
    expect(screen.getByText("Duration")).toBeTruthy();
    expect(screen.getByText("Retry Count")).toBeTruthy();
    expect(screen.getByText("Request Id")).toBeTruthy();
    expect(screen.getByText("Request Started")).toBeTruthy();
    expect(screen.getByText("Request Finished")).toBeTruthy();
    expect(screen.getByText("Model")).toBeTruthy();
  });
});

describe("AiDiagnosticScreen — Anlamlı Boş Durum İfadeleri (Sprint 10.9, KULLANICININ AÇIK TALEBİ)", () => {
  it("hiçbir istek başlamamışken, TÜM alanlar 'Gönderilmedi'/'Henüz oluşmadı' GİBİ ANLAMLI ifadeler gösterir — DÜZ '—' DEĞİL", async () => {
    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("Henüz oluşturulmadı")).toBeTruthy()); // Provider
    expect(screen.getByText("Henüz seçilmedi")).toBeTruthy(); // Model
    expect(screen.getByText("Henüz kontrol edilmedi")).toBeTruthy(); // API Key
    expect(screen.getByText("İstek henüz gönderilmedi")).toBeTruthy(); // HTTP
    expect(screen.getByText("Hata yok")).toBeTruthy(); // Error Code
    expect(screen.getByText("Henüz tamamlanmadı")).toBeTruthy(); // Duration
  });

  it("GERÇEK veri VARKEN, anlamlı boş ifadeler yerine GERÇEK değerler gösterilir", async () => {
    aiDiagnostics.startNewRequest();
    aiDiagnostics.recordProvider("gemini");
    aiDiagnostics.recordModel("gemini-flash-latest");
    aiDiagnostics.recordApiKeyStatus("configured");

    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("gemini")).toBeTruthy());
    expect(screen.getByText("gemini-flash-latest")).toBeTruthy();
    expect(screen.getByText("Girilmiş (geçerliliği doğrulanmadı)")).toBeTruthy();
    expect(screen.queryByText("Henüz oluşturulmadı")).toBeNull();
  });

  it("🔴 Sprint 10.10, Madde 5: apiKeyMasked KAYITLIYSA, GENEL 'Girilmiş' ifadesi YERİNE maskeli anahtar gösterilir", async () => {
    aiDiagnostics.recordApiKeyStatus("configured");
    aiDiagnostics.recordApiKeyMasked("AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234");

    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("AIza****1234")).toBeTruthy());
    expect(screen.queryByText("Girilmiş (geçerliliği doğrulanmadı)")).toBeNull();
  });

  it("🔴 Sprint 10.10, Madde 7-8: toolCallsRequested KAYITLIYSA, HANGİ aracın çağrıldığı VE thought_signature durumu GERÇEKTEN gösterilir", async () => {
    aiDiagnostics.recordToolCallsRequested([
      { name: "queryParcelData", hasThoughtSignature: false },
      { name: "queryTreeData", hasThoughtSignature: true },
    ]);

    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("queryParcelData")).toBeTruthy());
    expect(screen.getByText("queryTreeData")).toBeTruthy();
    expect(screen.getByText("thought_signature YOK")).toBeTruthy();
    expect(screen.getByText("thought_signature VAR")).toBeTruthy();
  });

  it("hiçbir tool çağrılmamışsa, Tool Calling bölümü HİÇ görünmez (gereksiz boş kart olmaz)", async () => {
    render(<AiDiagnosticScreen onBack={vi.fn()} debugMode={true} />);

    await waitFor(() => expect(screen.getByText("Provider")).toBeTruthy());
    expect(screen.queryByText("Tool Calling")).toBeNull();
  });
});

describe("AiDiagnosticScreen — 'Back' Butonu", () => {
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
    expect(screen.getByText("Provider")).toBeTruthy();
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

    await waitFor(() => expect(screen.getByText(/Stack/)).toBeTruthy());
    expect(screen.queryByText(/ilk 6 satır/)).toBeNull();
  });
});
