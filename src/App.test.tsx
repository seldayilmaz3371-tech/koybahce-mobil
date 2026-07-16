// @vitest-environment jsdom
/**
 * App.tsx Testleri (Sprint 4.3.1)
 * ==================================
 * İlk kez yazılıyor — Modül 4 Bağımsız Denetimi'nde bulunan gerçek
 * P1 güvenlik bulgusunu (arka plandan dönünce yeniden kilitlenmeme)
 * kanıtlamak için. `LockScreen`/`AppRouter`/DB bağlantısı MOCK'lanıyor
 * — odak SADECE App.tsx'in kilit durumu orkestrasyonu.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "./i18n/locales/en/common.json";

const appStateChangeListeners: Array<(isActive: boolean) => void> = [];

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((event: string, callback: (state: { isActive: boolean }) => void) => {
      if (event === "appStateChange") {
        appStateChangeListeners.push((isActive) => callback({ isActive }));
      }
      return Promise.resolve({ remove: vi.fn() });
    }),
    exitApp: vi.fn(),
  },
}));

vi.mock("./modules/auth/LockScreen", () => ({
  LockScreen: ({ onUnlocked }: { onUnlocked: () => void }) => (
    <button type="button" onClick={onUnlocked}>
      MOCK_UNLOCK
    </button>
  ),
}));

vi.mock("./router/AppRouter", () => ({
  AppRouter: () => <div>MOCK_APP_ROUTER</div>,
}));

vi.mock("./data/db/connection", () => ({
  getDatabase: vi.fn().mockResolvedValue({}),
  getRuntimePlatform: vi.fn().mockReturnValue("web"),
}));

vi.mock("./data/repositories/appMetadata.repository", () => ({
  appMetadataRepository: {
    recordFirstLaunchIfNeeded: vi.fn().mockResolvedValue("2026-01-01T00:00:00.000Z"),
  },
}));

function triggerAppStateChange(isActive: boolean) {
  act(() => {
    appStateChangeListeners[appStateChangeListeners.length - 1](isActive);
  });
}

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  appStateChangeListeners.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("App — Arka Plan Yeniden Kilitleme (Sprint 4.3.1, P1 güvenlik düzeltmesi)", () => {
  it("cold start: uygulama LockScreen ile açılır (varsayılan güvenli durum)", async () => {
    const { default: App } = await import("./App");
    render(<App />);

    expect(screen.getByText("MOCK_UNLOCK")).toBeTruthy();
    expect(screen.queryByText("MOCK_APP_ROUTER")).toBeNull();
  });

  it("kilit açıldıktan sonra AppRouter gösterilir", async () => {
    const { default: App } = await import("./App");
    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByText("MOCK_UNLOCK"));
    });

    expect(await screen.findByText("MOCK_APP_ROUTER")).toBeTruthy();
  });

  it("KRİTİK — uygulama arka plana alınınca (isActive:false) yeniden LockScreen gösterilir", async () => {
    const { default: App } = await import("./App");
    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByText("MOCK_UNLOCK"));
    });
    expect(await screen.findByText("MOCK_APP_ROUTER")).toBeTruthy();

    // Uygulama arka plana alınıyor (Android Activity onStop).
    triggerAppStateChange(false);

    expect(screen.getByText("MOCK_UNLOCK")).toBeTruthy();
    expect(screen.queryByText("MOCK_APP_ROUTER")).toBeNull();
  });

  it("Öne dönünce (isActive:true) OTOMATİK olarak açılmaz — kullanıcı tekrar kilit açmalı", async () => {
    const { default: App } = await import("./App");
    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByText("MOCK_UNLOCK"));
    });
    triggerAppStateChange(false);
    expect(screen.getByText("MOCK_UNLOCK")).toBeTruthy();

    // Uygulama öne geliyor — ama HÂLÂ kilitli olmalı, otomatik açılmamalı.
    triggerAppStateChange(true);

    expect(screen.getByText("MOCK_UNLOCK")).toBeTruthy();
    expect(screen.queryByText("MOCK_APP_ROUTER")).toBeNull();
  });

  it("yeniden kilitlendikten sonra tekrar unlock edilebilir (tam döngü)", async () => {
    const { default: App } = await import("./App");
    render(<App />);

    await act(async () => {
      fireEvent.click(screen.getByText("MOCK_UNLOCK"));
    });
    triggerAppStateChange(false);
    expect(screen.getByText("MOCK_UNLOCK")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("MOCK_UNLOCK"));
    });

    expect(await screen.findByText("MOCK_APP_ROUTER")).toBeTruthy();
  });

  it("Zaten kilitliyken (LockScreen açıkken) arka plan olayı hata fırlatmaz", async () => {
    const { default: App } = await import("./App");
    render(<App />);

    // Henüz unlock edilmedi — dinleyici bile kayıtlı değil normalde,
    // ama savunmacı olarak: eğer bir olay gelirse patlamamalı.
    expect(() => {
      if (appStateChangeListeners.length > 0) {
        triggerAppStateChange(false);
      }
    }).not.toThrow();
    expect(screen.getByText("MOCK_UNLOCK")).toBeTruthy();
  });
});
