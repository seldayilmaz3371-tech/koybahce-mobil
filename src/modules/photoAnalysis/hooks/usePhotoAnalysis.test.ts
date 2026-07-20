// @vitest-environment jsdom
/**
 * usePhotoAnalysis Hook Testleri
 * =================================
 * bkz. Sprint 9.2. `native/filesystem.ts` ve `AIProvider` mock'landı
 * — gerçek dosya sistemi/API çağrısı YAPILMIYOR.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { aiSettingsRepository } from "../../ai/data/aiSettings.repository";
import { providerRegistry } from "../../ai/providers/ProviderRegistry";
import type { AIProvider } from "../../ai/providers/AIProvider.interface";
import { usePhotoAnalysis } from "./usePhotoAnalysis";

vi.mock("../../../native/filesystem", () => ({
  readFileAsBase64: vi.fn().mockResolvedValue("SAHTE_BASE64_VERISI"),
}));

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function enableAiWithInternet() {
  await aiSettingsRepository.getOrCreate();
  await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
}

describe("usePhotoAnalysis", () => {
  it("AI kapalıyken analyze() 'error' durumuna ve AI_001 errorCode'una yol açar", async () => {
    const { result } = renderHook(() => usePhotoAnalysis());

    await result.current.analyze("file:///fake/photo.jpg");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("AI_001");
  });

  it("AI etkinken analyze() GERÇEK dosyayı okur, GERÇEK mimeType'ı belirler, sonucu döner", async () => {
    await enableAiWithInternet();
    const analyzeImageMock = vi.fn().mockResolvedValue("Yapraklar sağlıklı görünüyor.");
    const fakeProvider: AIProvider = {
      providerName: "gemini",
      sendMessage: vi.fn(),
      analyzeImage: analyzeImageMock,
    };
    providerRegistry.register(fakeProvider);

    const { result } = renderHook(() => usePhotoAnalysis());
    await result.current.analyze("file:///fake/photo.png");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.resultText).toBe("Yapraklar sağlıklı görünüyor.");
    expect(analyzeImageMock).toHaveBeenCalledWith(
      "SAHTE_BASE64_VERISI",
      "image/png", // .png uzantısından DOĞRU belirlendi
      expect.any(String),
      expect.any(String)
    );
  });

  it("bilinmeyen bir uzantı için varsayılan olarak image/jpeg kullanılır", async () => {
    await enableAiWithInternet();
    const analyzeImageMock = vi.fn().mockResolvedValue("cevap");
    providerRegistry.register({ providerName: "gemini", sendMessage: vi.fn(), analyzeImage: analyzeImageMock });

    const { result } = renderHook(() => usePhotoAnalysis());
    await result.current.analyze("file:///fake/photo.heic");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(analyzeImageMock).toHaveBeenCalledWith(
      "SAHTE_BASE64_VERISI",
      "image/jpeg",
      expect.any(String),
      expect.any(String)
    );
  });

  it("provider hatası 'error' durumuna ve gerçek errorCode'a yol açar", async () => {
    await enableAiWithInternet();
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn(),
      analyzeImage: vi.fn().mockRejectedValue(new Error("AI_PHOTO_ANALYSIS_EMPTY_RESPONSE")),
    });

    const { result } = renderHook(() => usePhotoAnalysis());
    await result.current.analyze("file:///fake/photo.jpg");

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("AI_005");
  });

  it("reset() sonrası durum idle'a döner, sonuç TEMİZLENİR", async () => {
    await enableAiWithInternet();
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn(),
      analyzeImage: vi.fn().mockResolvedValue("cevap"),
    });

    const { result } = renderHook(() => usePhotoAnalysis());
    await result.current.analyze("file:///fake/photo.jpg");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    result.current.reset();

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.resultText).toBeNull();
  });
});

describe("usePhotoAnalysis — Eşzamanlı Çağrı Önleme (Sprint 10.5, Madde 3)", () => {
  it("aynı fotoğraf için art arda analyze() çağrılırsa, provider.analyzeImage SADECE BİR KEZ çağrılır", async () => {
    await enableAiWithInternet();
    const analyzeImageMock = vi.fn().mockResolvedValue("cevap");
    providerRegistry.register({ providerName: "gemini", sendMessage: vi.fn(), analyzeImage: analyzeImageMock });

    const { result } = renderHook(() => usePhotoAnalysis());
    // İKİ çağrıyı ART ARDA (await OLMADAN) tetikle — GERÇEK "aynı anda
    // birden fazla tıklama" senaryosunun simülasyonu.
    const firstCall = result.current.analyze("file:///fake/photo.jpg");
    const secondCall = result.current.analyze("file:///fake/photo.jpg");
    await Promise.all([firstCall, secondCall]);

    expect(analyzeImageMock).toHaveBeenCalledTimes(1);
  });

  it("bir analiz TAMAMLANDIKTAN SONRA, YENİDEN analyze() çağrılabilir (kilit KALICI değil)", async () => {
    await enableAiWithInternet();
    const analyzeImageMock = vi.fn().mockResolvedValue("cevap");
    providerRegistry.register({ providerName: "gemini", sendMessage: vi.fn(), analyzeImage: analyzeImageMock });

    const { result } = renderHook(() => usePhotoAnalysis());
    await result.current.analyze("file:///fake/photo.jpg");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.analyze("file:///fake/photo.jpg");

    expect(analyzeImageMock).toHaveBeenCalledTimes(2);
  });
});
