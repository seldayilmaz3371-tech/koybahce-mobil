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
    render(<SettingsScreen onViewAiSettings={vi.fn()} />);
    expect(screen.getByText("AI")).toBeTruthy();
  });

  it("AI bölümüne tıklamak onViewAiSettings'i çağırır", () => {
    const onViewAiSettings = vi.fn();
    render(<SettingsScreen onViewAiSettings={onViewAiSettings} />);

    fireEvent.click(screen.getByText("AI"));

    expect(onViewAiSettings).toHaveBeenCalledTimes(1);
  });
});
