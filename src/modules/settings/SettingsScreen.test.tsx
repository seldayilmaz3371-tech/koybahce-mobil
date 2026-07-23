// @vitest-environment jsdom
/**
 * SettingsScreen Testleri
 * ==========================
 * bkz. Sprint 7.1.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { SettingsScreen } from "./SettingsScreen";

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
});

describe("SettingsScreen", () => {
  it("AI bölümünü listeler", () => {
    render(<SettingsScreen onViewAiSettings={vi.fn()} onViewDataManagement={vi.fn()} onViewLanguageSettings={vi.fn()} />);
    expect(screen.getByText("AI")).toBeTruthy();
  });

  it("AI bölümüne tıklamak onViewAiSettings'i çağırır", () => {
    const onViewAiSettings = vi.fn();
    render(
      <SettingsScreen onViewAiSettings={onViewAiSettings} onViewDataManagement={vi.fn()} onViewLanguageSettings={vi.fn()} />
    );

    fireEvent.click(screen.getByText("AI"));

    expect(onViewAiSettings).toHaveBeenCalledTimes(1);
  });

  it("🔴 Sprint 10.13: 'Data Management' bölümünü GERÇEKTEN listeler", () => {
    render(<SettingsScreen onViewAiSettings={vi.fn()} onViewDataManagement={vi.fn()} onViewLanguageSettings={vi.fn()} />);

    expect(screen.getByText("Data Management")).toBeTruthy();
  });

  it("🔴 Sprint 10.13: 'Data Management' bölümüne tıklamak, GERÇEKTEN onViewDataManagement'i çağırır", () => {
    const onViewDataManagement = vi.fn();
    render(
      <SettingsScreen onViewAiSettings={vi.fn()} onViewDataManagement={onViewDataManagement} onViewLanguageSettings={vi.fn()} />
    );

    fireEvent.click(screen.getByText("Data Management"));

    expect(onViewDataManagement).toHaveBeenCalledTimes(1);
  });

  it("🔴 Sprint 10.18: 'Language' bölümünü GERÇEKTEN listeler", () => {
    render(<SettingsScreen onViewAiSettings={vi.fn()} onViewDataManagement={vi.fn()} onViewLanguageSettings={vi.fn()} />);

    expect(screen.getByText("Language")).toBeTruthy();
  });

  it("🔴 Sprint 10.18: 'Language' bölümüne tıklamak, GERÇEKTEN onViewLanguageSettings'i çağırır", () => {
    const onViewLanguageSettings = vi.fn();
    render(
      <SettingsScreen onViewAiSettings={vi.fn()} onViewDataManagement={vi.fn()} onViewLanguageSettings={onViewLanguageSettings} />
    );

    fireEvent.click(screen.getByText("Language"));

    expect(onViewLanguageSettings).toHaveBeenCalledTimes(1);
  });
});
