// @vitest-environment jsdom
/**
 * AiSettingsScreen Testleri
 * ============================
 * bkz. ADR 0024.
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
import { secureStorage } from "../../native/secureStorage";
import { aiSettingsRepository } from "./data/aiSettings.repository";
import { AiSettingsScreen } from "./AiSettingsScreen";

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

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
  vi.mocked(secureStorage.set).mockReset().mockResolvedValue(undefined);
  vi.mocked(secureStorage.remove).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("AiSettingsScreen", () => {
  it("başlangıçta AI KAPALI, İnternet İzni KAPALI olarak gösterilir (güvenli varsayılan)", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText("Enable AI features")).toBeTruthy());
    expect((screen.getByLabelText("Enable AI features") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Allow AI to use the internet") as HTMLInputElement).checked).toBe(false);
  });

  it("'Enable AI features' checkbox'ına tıklamak GERÇEKTEN ayarı günceller", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Enable AI features")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Enable AI features"));
    });

    await waitFor(() =>
      expect((screen.getByLabelText("Enable AI features") as HTMLInputElement).checked).toBe(true)
    );
  });

  it("API anahtarı girilmemişken input+Save butonu gösterilir", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Gemini API Key")).toBeTruthy());
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("API anahtarı kaydedilince input KAYBOLUR, 'yapılandırıldı' mesajı ve Kaldır butonu gösterilir", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Gemini API Key")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Gemini API Key"), { target: { value: "gizli-anahtar" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText("API key is configured.")).toBeTruthy());
    expect(secureStorage.set).toHaveBeenCalledWith("gemini_api_key", "gizli-anahtar");
    expect(screen.queryByLabelText("Gemini API Key")).toBeNull();
  });

  it("boş anahtarla Save butonu DEVRE DIŞI kalır", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Gemini API Key")).toBeTruthy());

    expect((screen.getByText("Save") as HTMLButtonElement).disabled).toBe(true);
  });

  it("Kaldır butonuna basıp onaylayınca anahtar SİLİNİR", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Gemini API Key")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Gemini API Key"), { target: { value: "anahtar" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    await waitFor(() => expect(screen.getByText("Remove Key")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Remove Key"));
    });

    expect(secureStorage.remove).toHaveBeenCalledWith("gemini_api_key");
    await waitFor(() => expect(screen.getByLabelText("Gemini API Key")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();
    render(<AiSettingsScreen onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    fireEvent.click(screen.getByText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("AiSettingsScreen — Teşhis Modu Toggle (Sprint 10.7, AI Diagnostic Build)", () => {
  it("debugMode toggle'ı GERÇEKTEN görünür ve VARSAYILAN olarak kapalı (mevcut kullanıcılar etkilenmez)", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Diagnostic Mode/)).toBeTruthy());

    const checkbox = screen.getByLabelText(/Diagnostic Mode/) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("toggle'a tıklamak, GERÇEKTEN aiSettingsRepository.update({debugMode: true}) çağırır", async () => {
    render(<AiSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Diagnostic Mode/)).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByLabelText(/Diagnostic Mode/));
    });

    const settings = await aiSettingsRepository.getOrCreate();
    expect(settings.debugMode).toBe(true);
  });
});
