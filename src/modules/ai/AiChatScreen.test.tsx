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
  // GERÇEK bulgu: jsdom `Element.scrollIntoView`'i İMPLEMENT ETMİYOR
  // (tarayıcının gerçek bir özelliği, ama jsdom bunu desteklemiyor —
  // bilinen bir sınırlama). AiChatScreen'in Sprint 7.2'de eklenen
  // otomatik kaydırma davranışı bunu çağırıyor — testte no-op olarak
  // sağlanıyor.
  Element.prototype.scrollIntoView = vi.fn();
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
    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    expect((screen.getByLabelText("Ask a question about your farm data") as HTMLInputElement).disabled).toBe(
      false
    );
  });

  it("çevrimdışıyken offline bildirimi gösterilir, giriş DEVRE DIŞI kalır", async () => {
    networkConnected = false;
    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);

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
      analyzeImage: vi.fn().mockResolvedValue("test analiz"),
    });

    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
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
    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
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
      analyzeImage: vi.fn().mockResolvedValue("test analiz"),
    });

    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    const input = screen.getByLabelText("Ask a question about your farm data") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "soru" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => expect(input.value).toBe(""));
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();
    render(<AiChatScreen onBack={onBack} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    fireEvent.click(screen.getByText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("'AI Settings' bağlantısına basmak onViewSettings'i çağırır", async () => {
    const onViewSettings = vi.fn();
    render(<AiChatScreen onBack={vi.fn()} onViewSettings={onViewSettings} />);
    await waitFor(() => expect(screen.getByText("AI Settings")).toBeTruthy());

    fireEvent.click(screen.getByText("AI Settings"));

    expect(onViewSettings).toHaveBeenCalledTimes(1);
  });
});

describe("AiChatScreen — Mobil UX (Sprint 7.3)", () => {
  it("giriş alanı TEK SATIRLIK input DEĞİL, çok satırlı textarea", async () => {
    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    const field = screen.getByLabelText("Ask a question about your farm data");
    expect(field.tagName).toBe("TEXTAREA");
    expect(field.getAttribute("rows")).toBe("4");
  });

  it("placeholder metni doğru gösterilir", async () => {
    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByPlaceholderText("Type your question...")).toBeTruthy());
  });

  it("kullanıcı mesajı 'ai-chat__bubble--user' sınıfıyla, AI mesajı 'ai-chat__bubble--model' sınıfıyla render edilir", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn().mockResolvedValue({ text: "cevap metni", toolCalls: [] }),
      analyzeImage: vi.fn().mockResolvedValue("test analiz"),
    });

    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Ask a question about your farm data"), {
      target: { value: "soru metni" },
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => expect(screen.getByText("cevap metni")).toBeTruthy());
    const userBubble = screen.getByText("soru metni").closest(".ai-chat__bubble");
    const modelBubble = screen.getByText("cevap metni").closest(".ai-chat__bubble");
    expect(userBubble?.className).toContain("ai-chat__bubble--user");
    expect(modelBubble?.className).toContain("ai-chat__bubble--model");
  });

  it("AI cevap üretirken 'Thinking...' göstergesi GEÇİCİ olarak görünür", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    let resolveResponse!: (value: { text: string; toolCalls: never[] }) => void;
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn(
        () =>
          new Promise<{ text: string; toolCalls: never[] }>((resolve) => {
            resolveResponse = resolve;
          })
      ),
      analyzeImage: vi.fn().mockResolvedValue("test analiz"),
    });

    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Ask a question about your farm data"), {
      target: { value: "soru" },
    });
    act(() => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() => expect(screen.getByText("Thinking...")).toBeTruthy());

    await act(async () => {
      resolveResponse({ text: "sonunda gelen cevap", toolCalls: [] });
    });

    await waitFor(() => expect(screen.getByText("sonunda gelen cevap")).toBeTruthy());
    expect(screen.queryByText("Thinking...")).toBeNull(); // gösterge KAYBOLDU
  });

  it("gönderim sırasında (sending) textarea VE gönder butonu devre dışı kalır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    providerRegistry.register({
      providerName: "gemini",
      sendMessage: vi.fn(() => new Promise<never>(() => {})), // asla resolve olmaz — "sending" durumunu SABİTLE
      analyzeImage: vi.fn().mockResolvedValue("test analiz"),
    });

    render(<AiChatScreen onBack={vi.fn()} onViewSettings={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText("Ask a question about your farm data")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Ask a question about your farm data"), {
      target: { value: "soru" },
    });
    act(() => {
      fireEvent.click(screen.getByText("Send"));
    });

    await waitFor(() =>
      expect((screen.getByLabelText("Ask a question about your farm data") as HTMLTextAreaElement).disabled).toBe(
        true
      )
    );
    expect((screen.getByText("Send") as HTMLButtonElement).disabled).toBe(true);
  });
});
