// @vitest-environment jsdom
/**
 * AiChatScreen Testleri
 * ========================
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
import { aiSettingsRepository } from "./data/aiSettings.repository";
import { providerRegistry } from "./providers/ProviderRegistry";
import { AiChatScreen } from "./AiChatScreen";

let networkConnected = true;
vi.mock("../../native/network", () => ({
  isOnline: () => Promise.resolve(networkConnected),
  addNetworkStatusListener: () => () => {},
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
  networkConnected = true;
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("AiChatScreen", () => {
  it("çevrimiçiyken mesaj gönderme etkin", async () => {
    render(<AiChatScreen />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    expect((screen.getByLabelText("Ask a question about your farm data") as HTMLInputElement).disabled).toBe(
      false
    );
  });

  it("çevrimdışıyken offline bildirimi gösterilir, giriş DEVRE DIŞI kalır", async () => {
    networkConnected = false;
    render(<AiChatScreen />);

    await waitFor(() => expect(screen.getByText(/You're offline/)).toBeTruthy());
    expect((screen.getByLabelText("Ask a question about your farm data") as HTMLInputElement).disabled).toBe(
      true
    );
  });

  it("geçerli bir soru gönderip GERÇEK bir cevap alınca ikisi de (soru+cevap) listede görünür", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn().mockResolvedValue({ text: "3 sulama yaptınız.", toolCalls: [] }),
    });

    render(<AiChatScreen />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Ask a question about your farm data"), {
      target: { value: "Kaç sulama yaptım?" },
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => expect(screen.getByText("3 sulama yaptınız.")).toBeTruthy());
    expect(screen.getByText("Kaç sulama yaptım?")).toBeTruthy();
  });

  it("AI kapalıyken gönderim, çevrilmiş hata mesajını gösterir (ham AI_NOT_ENABLED metni DEĞİL)", async () => {
    render(<AiChatScreen />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Ask a question about your farm data"), {
      target: { value: "soru" },
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => expect(screen.getByText("AI is turned off. You can enable it in AI Settings.")).toBeTruthy());
    expect(screen.queryByText(/AI_NOT_ENABLED/)).toBeNull();
  });

  it("gönderim sonrası giriş kutusu TEMİZLENİR", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn().mockResolvedValue({ text: "cevap", toolCalls: [] }),
    });

    render(<AiChatScreen />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    const input = screen.getByLabelText("Ask a question about your farm data") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "soru" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => expect(input.value).toBe(""));
  });
});
