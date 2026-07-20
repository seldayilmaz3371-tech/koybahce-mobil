// @vitest-environment jsdom
/**
 * PhotoAnalysisScreen Bileşen Testleri
 * =======================================
 * bkz. Sprint 9.2/10.5.
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

// bkz. Sprint 10.5 — `AppRouter.test.tsx`'in KANITLANMIŞ mock deseni
// (her test dosyası KENDİ backButtonListeners dizisini kurar).
const backButtonListeners: Array<() => void> = [];
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (_event: string, cb: () => void) => {
      backButtonListeners.push(cb);
      return Promise.resolve({ remove: () => {} });
    },
  },
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
  backButtonListeners.length = 0;
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

describe("PhotoAnalysisScreen — Sprint 10.5, Madde 7 (Kullanıcı Talep Ettiği Test Senaryoları)", () => {
  it("aynı fotoğraf için art arda analiz BAŞLATMAYA ÇALIŞMA — buton analiz başlar başlamaz KAYBOLUR, TEKRAR tıklanamaz", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    const analyzeImageMock = vi.fn().mockResolvedValue("cevap");
    providerRegistry.register({ providerName: "gemini", sendMessage: vi.fn(), analyzeImage: analyzeImageMock });

    render(<PhotoAnalysisScreen photo={fakePhoto} onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Analyze with AI")).toBeTruthy());

    fireEvent.click(screen.getByText("Analyze with AI"));
    // Analiz BAŞLAR BAŞLAMAZ (senkron olarak), buton ARTIK DOM'da YOK —
    // GERÇEK bir "tekrar tıklama" GİRİŞİMİ bile mümkün DEĞİL (görsel kilit).
    expect(screen.queryByText("Analyze with AI")).toBeNull();

    await waitFor(() => expect(screen.getByText("cevap")).toBeTruthy());
    // Analiz SONRASI, GERÇEK provider çağrısı SADECE BİR KEZ yapıldı
    // (usePhotoAnalysis.test.ts'in senkron çağrı testinin BİLEŞEN
    // SEVİYESİNDEKİ tamamlayıcısı).
    expect(analyzeImageMock).toHaveBeenCalledTimes(1);
  });

  it("analiz DEVAM EDERKEN donanım geri tuşuna basılması UYGULAMAYI ÇÖKERTMEZ — onBack GERÇEKTEN çağrılır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    // Analiz HİÇ TAMAMLANMASIN (bilinçli olarak resolve edilmeyen bir
    // Promise) — "analiz DEVAM EDERKEN" durumunu SABİTLEMEK için.
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn(),
      analyzeImage: vi.fn(() => new Promise<string>(() => {})),
    });
    const onBack = vi.fn();

    render(<PhotoAnalysisScreen photo={fakePhoto} onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("Analyze with AI")).toBeTruthy());
    fireEvent.click(screen.getByText("Analyze with AI"));
    await waitFor(() => expect(screen.getByText("Analyzing...")).toBeTruthy());

    // GERÇEK donanım geri tuşu tetiklemesi (mock edilmiş @capacitor/app üzerinden).
    expect(() => {
      act(() => backButtonListeners[backButtonListeners.length - 1]());
    }).not.toThrow();

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
