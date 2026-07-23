// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationSettings } from "./useNotificationSettings";

const getPreferenceMock = vi.fn();
const setPreferenceMock = vi.fn();
const requestPermissionMock = vi.fn();
const checkPermissionMock = vi.fn();
const scheduleMock = vi.fn();
const cancelAllMock = vi.fn();
const listAllActiveMock = vi.fn();

vi.mock("../../../native/preferences", () => ({
  localPreferences: {
    get: (...args: unknown[]) => getPreferenceMock(...args),
    set: (...args: unknown[]) => setPreferenceMock(...args),
  },
  LocalPreferenceKey: { NOTIFICATIONS_ENABLED: "notifications_enabled_v1" },
}));

vi.mock("../../../native/notifications", () => ({
  requestNotificationPermission: (...args: unknown[]) => requestPermissionMock(...args),
  checkNotificationPermission: (...args: unknown[]) => checkPermissionMock(...args),
  scheduleMaintenanceReminders: (...args: unknown[]) => scheduleMock(...args),
  cancelAllMaintenanceReminders: (...args: unknown[]) => cancelAllMock(...args),
}));

vi.mock("../../maintenance/data/maintenancePlan.repository", () => ({
  maintenancePlanRepository: { listAllActive: (...args: unknown[]) => listAllActiveMock(...args) },
}));

beforeEach(() => {
  getPreferenceMock.mockReset().mockResolvedValue(null);
  setPreferenceMock.mockReset().mockResolvedValue(undefined);
  requestPermissionMock.mockReset().mockResolvedValue(true);
  checkPermissionMock.mockReset().mockResolvedValue(false);
  scheduleMock.mockReset().mockResolvedValue(undefined);
  cancelAllMock.mockReset().mockResolvedValue(undefined);
  listAllActiveMock.mockReset().mockResolvedValue([{ id: "plan-1" }]);
});

describe("useNotificationSettings", () => {
  it("başlangıçta 'loading' durumundadır, SONRA kayıtlı tercihi yansıtır", async () => {
    getPreferenceMock.mockResolvedValue("true");

    const { result } = renderHook(() => useNotificationSettings());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.isEnabled).toBe(true);
  });

  it("HİÇ kayıtlı tercih YOKSA (null), VARSAYILAN olarak KAPALI'dır (güvenli varsayılan)", async () => {
    getPreferenceMock.mockResolvedValue(null);

    const { result } = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.isEnabled).toBe(false);
  });

  it("🔴 AÇMA: izin GRANTED ise, GERÇEKTEN tercih KAYDEDİLİR + TÜM aktif planlar İÇİN bildirim ZAMANLANIR", async () => {
    requestPermissionMock.mockResolvedValue(true);
    const { result } = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setEnabled(true);
    });

    expect(setPreferenceMock).toHaveBeenCalledWith("notifications_enabled_v1", "true");
    expect(listAllActiveMock).toHaveBeenCalledTimes(1);
    expect(scheduleMock).toHaveBeenCalledWith([{ id: "plan-1" }]);
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.permissionDenied).toBe(false);
  });

  it("🔴 AÇMA: izin REDDEDİLİRSE, tercih HİÇ KAYDEDİLMEZ, bildirim de HİÇ ZAMANLANMAZ", async () => {
    requestPermissionMock.mockResolvedValue(false);
    const { result } = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setEnabled(true);
    });

    expect(setPreferenceMock).not.toHaveBeenCalled();
    expect(scheduleMock).not.toHaveBeenCalled();
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.permissionDenied).toBe(true);
  });

  it("izin ZATEN GRANTED ise, requestNotificationPermission GEREKSİZ yere ÇAĞRILMAZ", async () => {
    checkPermissionMock.mockResolvedValue(true);
    const { result } = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setEnabled(true);
    });

    expect(requestPermissionMock).not.toHaveBeenCalled();
    expect(result.current.isEnabled).toBe(true);
  });

  it("🔴 KAPATMA: tercih GERÇEKTEN kaydedilir + TÜM bekleyen bildirimler İPTAL edilir", async () => {
    getPreferenceMock.mockResolvedValue("true");
    const { result } = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(result.current.isEnabled).toBe(true));

    await act(async () => {
      await result.current.setEnabled(false);
    });

    expect(setPreferenceMock).toHaveBeenCalledWith("notifications_enabled_v1", "false");
    expect(cancelAllMock).toHaveBeenCalledTimes(1);
    expect(result.current.isEnabled).toBe(false);
  });
});
