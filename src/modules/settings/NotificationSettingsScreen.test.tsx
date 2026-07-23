// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { NotificationSettingsScreen } from "./NotificationSettingsScreen";

const getPreferenceMock = vi.fn();
const setPreferenceMock = vi.fn();
const requestPermissionMock = vi.fn();
const checkPermissionMock = vi.fn();
const scheduleMock = vi.fn();
const cancelAllMock = vi.fn();
const listAllActiveMock = vi.fn();

vi.mock("../../native/preferences", () => ({
  localPreferences: {
    get: (...args: unknown[]) => getPreferenceMock(...args),
    set: (...args: unknown[]) => setPreferenceMock(...args),
  },
  LocalPreferenceKey: { NOTIFICATIONS_ENABLED: "notifications_enabled_v1" },
}));

vi.mock("../../native/notifications", () => ({
  requestNotificationPermission: (...args: unknown[]) => requestPermissionMock(...args),
  checkNotificationPermission: (...args: unknown[]) => checkPermissionMock(...args),
  scheduleMaintenanceReminders: (...args: unknown[]) => scheduleMock(...args),
  cancelAllMaintenanceReminders: (...args: unknown[]) => cancelAllMock(...args),
}));

vi.mock("../maintenance/data/maintenancePlan.repository", () => ({
  maintenancePlanRepository: { listAllActive: (...args: unknown[]) => listAllActiveMock(...args) },
}));

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  getPreferenceMock.mockReset().mockResolvedValue(null);
  setPreferenceMock.mockReset().mockResolvedValue(undefined);
  requestPermissionMock.mockReset().mockResolvedValue(true);
  checkPermissionMock.mockReset().mockResolvedValue(false);
  scheduleMock.mockReset().mockResolvedValue(undefined);
  cancelAllMock.mockReset().mockResolvedValue(undefined);
  listAllActiveMock.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

describe("NotificationSettingsScreen", () => {
  it("VARSAYILAN olarak KAPALI gösterir (güvenli varsayılan)", async () => {
    render(<NotificationSettingsScreen onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText(/Maintenance reminders/)).toBeTruthy());
    const checkbox = screen.getByLabelText(/Maintenance reminders/) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("🔴 toggle'ı AÇMAK, izin GRANTED ise GERÇEKTEN aktif hale getirir", async () => {
    render(<NotificationSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText(/Maintenance reminders/)).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByLabelText(/Maintenance reminders/));
    });

    expect(setPreferenceMock).toHaveBeenCalledWith("notifications_enabled_v1", "true");
    const checkbox = screen.getByLabelText(/Maintenance reminders/) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("🔴 izin REDDEDİLİRSE, GERÇEK uyarı mesajı gösterilir", async () => {
    requestPermissionMock.mockResolvedValue(false);
    render(<NotificationSettingsScreen onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText(/Maintenance reminders/)).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByLabelText(/Maintenance reminders/));
    });

    await waitFor(() => expect(screen.getByText(/Notification permission was denied/)).toBeTruthy());
  });

  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();
    render(<NotificationSettingsScreen onBack={onBack} />);
    await waitFor(() => expect(screen.getByText("Back")).toBeTruthy());

    fireEvent.click(screen.getByText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
