// @vitest-environment jsdom
/**
 * PhotoAnalysisScreen Bileşen Testleri
 * =======================================
 * bkz. Sprint 9.2.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import { aiSettingsRepository } from "../ai/data/aiSettings.repository";
import { providerRegistry } from "../ai/providers/ProviderRegistry";
import { PhotoAnalysisScreen } from "./PhotoAnalysisScreen";
import type { Photo } from "../photos/domain/photo.types";

vi.mock("../../native/filesystem", () => ({
  readFileAsBase64: vi.fn().mockResolvedValue("SAHTE_BASE64"),
}));

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

const fakePhoto: Photo = {
  id: "photo-1",
  observationId: "obs-1",
  filePath: "file:///fake/photo.jpg",
  takenAt: "2026-07-18T00:00:00.000Z",
  isActive: true,
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("PhotoAnalysisScreen", () => {
  it("sorumluluk reddi (disclaimer) metni HER ZAMAN görünür", async () => {
    render(<PhotoAnalysisScreen photo={fakePhoto} onBack={vi.fn()} />);

    await waitFor(() =>
      expect(
        screen.getByText(/This is a general AI observation, not a professional diagnosis/)
      ).toBeTruthy()
    );
  });

  it("'Analyze with AI' butonuna basınca, GERÇEK analiz akışı çalışır ve sonuç gösterilir", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn(),
      analyzeImage: vi.fn().mockResolvedValue("Yapraklar sağlıklı görünüyor."),
    });

    render(<PhotoAnalysisScreen photo={fakePhoto} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Analyze with AI")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Analyze with AI"));
    });

    await waitFor(() => expect(screen.getByText("Yapraklar sağlıklı görünüyor.")).toBeTruthy());
  });

  it("AI kapalıyken analiz denemesi, çevrilmiş bir hata mesajı gösterir (ham hata DEĞİL)", async () => {
    render(<PhotoAnalysisScreen photo={fakePhoto} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Analyze with AI")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Analyze with AI"));
    });

    await waitFor(() => expect(screen.getByText("AI is turned off. You can enable it in AI Settings.")).toBeTruthy());
    expect(screen.queryByText(/AI_NOT_ENABLED/)).toBeNull();
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();
    render(<PhotoAnalysisScreen photo={fakePhoto} onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    fireEvent.click(screen.getByText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
