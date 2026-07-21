// @vitest-environment jsdom
/**
 * AiDiagnosticScreen Testleri
 * ==============================
 * bkz. Sprint 10.7 (AI Diagnostic Build). En kritik senaryo: bu
 * ekranın debugMode kapalıyken GERÇEKTEN hiçbir şey göstermediği —
 * "Release sürümünde bu bilgiler görünmesin" gereksiniminin GERÇEK
 * testle kanıtı.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../data/db/migrations/schema";
import { secureStorage } from "../../native/secureStorage";
import { aiSettingsRepository } from "./data/aiSettings.repository";
import { aiDiagnostics } from "./diagnostics/aiDiagnostics";
import { AiDiagnosticScreen } from "./AiDiagnosticScreen";

vi.mock("../../native/secureStorage", () => ({
  secureStorage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  SecureStorageKey: { GEMINI_API_KEY: "gemini_api_key" },
}));

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(async () => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
  vi.mocked(secureStorage.get).mockResolvedValue(null);
  aiDiagnostics.reset();
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
  vi.restoreAllMocks();
});

describe("AiDiagnosticScreen — Görünürlük Kuralı (Sprint 10.7, KULLANICININ AÇIK TALEBİ)", () => {
  it("debugMode KAPALIYSA (varsayılan), ekran GERÇEKTEN hiçbir şey göstermez (null render)", async () => {
    await aiSettingsRepository.getOrCreate(); // varsayılan debugMode: false

    const { container } = render(<AiDiagnosticScreen onBack={vi.fn()} />);

    // Bir süre bekleyip (useAiSettings'in kendi yüklenmesi tamamlansın), YİNE DE hiçbir içerik OLMAMALI.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(container.textContent).toBe("");
  });

  it("debugMode AÇIKSA, ekran GERÇEKTEN teşhis bilgilerini gösterir", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ debugMode: true });

    render(<AiDiagnosticScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("AI Diagnostic Info")).toBeTruthy());
    expect(screen.getByText("Provider:")).toBeTruthy();
    expect(screen.getByText("Error Code:")).toBeTruthy();
    expect(screen.getByText("Request Duration:")).toBeTruthy();
    expect(screen.getByText("Retry Count:")).toBeTruthy();
  });
});

describe("AiDiagnosticScreen — Gerçek Veri Gösterimi (Sprint 10.7)", () => {
  it("aiDiagnostics'e kaydedilen GERÇEK veriler, ekranda GERÇEKTEN görünür", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ debugMode: true });
    aiDiagnostics.recordProvider("gemini");
    aiDiagnostics.recordApiKeyStatus("configured");
    aiDiagnostics.recordMappedErrorCode("AI_006");
    aiDiagnostics.recordRetry();
    aiDiagnostics.recordRetry();

    render(<AiDiagnosticScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("gemini")).toBeTruthy());
    expect(screen.getByText("configured")).toBeTruthy();
    expect(screen.getByText("AI_006")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy(); // retryCount
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ debugMode: true });
    const onBack = vi.fn();

    render(<AiDiagnosticScreen onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    screen.getByText("Back").click();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
