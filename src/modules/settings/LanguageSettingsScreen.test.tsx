// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18nForTest from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { LanguageSettingsScreen } from "./LanguageSettingsScreen";

const setLanguagePreferenceMock = vi.fn();
const changeLanguageMock = vi.fn();
const applyDocumentDirectionMock = vi.fn();

vi.mock("../../i18n/languagePreference", () => ({
  setLanguagePreference: (...args: unknown[]) => setLanguagePreferenceMock(...args),
}));

vi.mock("../../i18n/supportedLanguages", () => ({
  SUPPORTED_LANGUAGES: [
    { code: "en", nativeName: "English", isRtl: false },
    { code: "tr", nativeName: "Türkçe", isRtl: false },
  ],
  applyDocumentDirection: (...args: unknown[]) => applyDocumentDirectionMock(...args),
}));

vi.mock("../../i18n/i18n", () => ({
  default: {
    get language() {
      return "en";
    },
    changeLanguage: (...args: unknown[]) => {
      changeLanguageMock(...args);
      return Promise.resolve();
    },
  },
}));

beforeAll(async () => {
  await i18nForTest.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  setLanguagePreferenceMock.mockReset().mockResolvedValue(undefined);
  changeLanguageMock.mockReset();
  applyDocumentDirectionMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("LanguageSettingsScreen", () => {
  it("desteklenen TÜM dilleri GERÇEKTEN listeler", () => {
    render(<LanguageSettingsScreen onBack={vi.fn()} />);

    expect(screen.getByText("English", { exact: false })).toBeTruthy();
    expect(screen.getByText("Türkçe", { exact: false })).toBeTruthy();
  });

  it("🔴 aktif dilin YANINDA GERÇEKTEN bir işaret (✓) gösterir", () => {
    render(<LanguageSettingsScreen onBack={vi.fn()} />);

    // Mock: i18n.language === "en" — İngilizce aktif olmalı.
    expect(screen.getByText("English ✓")).toBeTruthy();
    expect(screen.queryByText("Türkçe ✓")).toBeNull();
  });

  it("🔴 farklı bir dile tıklamak, GERÇEKTEN setLanguagePreference + i18n.changeLanguage + applyDocumentDirection'ı SIRAYLA çağırır", async () => {
    render(<LanguageSettingsScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Türkçe", { exact: false }));
    });

    await waitFor(() => expect(setLanguagePreferenceMock).toHaveBeenCalledWith("tr"));
    expect(changeLanguageMock).toHaveBeenCalledWith("tr");
    expect(applyDocumentDirectionMock).toHaveBeenCalledWith("tr");
  });

  it("zaten AKTİF olan dile tıklamak, HİÇBİR ŞEY yapmaz (gereksiz çağrı önlenir)", async () => {
    render(<LanguageSettingsScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("English", { exact: false }));
    });

    expect(setLanguagePreferenceMock).not.toHaveBeenCalled();
    expect(changeLanguageMock).not.toHaveBeenCalled();
  });

  it("'Back' butonuna basmak onBack'i çağırır", () => {
    const onBack = vi.fn();
    render(<LanguageSettingsScreen onBack={onBack} />);

    fireEvent.click(screen.getByText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
