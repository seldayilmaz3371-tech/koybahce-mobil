import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MaintenancePlan } from "../modules/maintenance/domain/maintenance.types";

const requestPermissionsMock = vi.fn();
const checkPermissionsMock = vi.fn();
const getPendingMock = vi.fn();
const cancelMock = vi.fn();
const scheduleMock = vi.fn();

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: (...args: unknown[]) => requestPermissionsMock(...args),
    checkPermissions: (...args: unknown[]) => checkPermissionsMock(...args),
    getPending: (...args: unknown[]) => getPendingMock(...args),
    cancel: (...args: unknown[]) => cancelMock(...args),
    schedule: (...args: unknown[]) => scheduleMock(...args),
  },
}));

function makePlan(overrides: Partial<MaintenancePlan> = {}): MaintenancePlan {
  return {
    id: "plan-1",
    parcelId: "parcel-1",
    treeId: null,
    maintenanceType: "irrigation",
    intervalDays: 7,
    nextDueDate: "2026-08-01T00:00:00.000Z",
    isActive: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  requestPermissionsMock.mockReset().mockResolvedValue({ display: "granted" });
  checkPermissionsMock.mockReset().mockResolvedValue({ display: "granted" });
  getPendingMock.mockReset().mockResolvedValue({ notifications: [] });
  cancelMock.mockReset().mockResolvedValue(undefined);
  scheduleMock.mockReset().mockResolvedValue({ notifications: [] });
});

describe("hashPlanIdToNotificationId", () => {
  it("🔴 AYNI plan id'si, HER ZAMAN AYNI sayısal id'yi üretir (deterministik)", async () => {
    const { hashPlanIdToNotificationId } = await import("./notifications");

    const first = hashPlanIdToNotificationId("11111111-1111-1111-1111-111111111111");
    const second = hashPlanIdToNotificationId("11111111-1111-1111-1111-111111111111");

    expect(first).toBe(second);
  });

  it("FARKLI plan id'leri, GERÇEKTEN farklı sayısal id'ler üretir (pratik çakışma yok)", async () => {
    const { hashPlanIdToNotificationId } = await import("./notifications");

    const a = hashPlanIdToNotificationId("11111111-1111-1111-1111-111111111111");
    const b = hashPlanIdToNotificationId("22222222-2222-2222-2222-222222222222");

    expect(a).not.toBe(b);
  });

  it("🔴 üretilen id, GERÇEKTEN 32-bit İMZALI aralıkta kalır (LocalNotificationSchema.id'nin GEREKTİRDİĞİ)", async () => {
    const { hashPlanIdToNotificationId } = await import("./notifications");

    for (const id of ["a", "çok-uzun-bir-uuid-degeri-1234567890", "🌿emoji-icerebilir-mi"]) {
      const result = hashPlanIdToNotificationId(id);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(2147483647);
    }
  });
});

describe("requestNotificationPermission / checkNotificationPermission", () => {
  it("izin GRANTED ise true döner", async () => {
    const { requestNotificationPermission } = await import("./notifications");

    expect(await requestNotificationPermission()).toBe(true);
  });

  it("izin DENIED ise false döner", async () => {
    requestPermissionsMock.mockResolvedValue({ display: "denied" });
    const { requestNotificationPermission } = await import("./notifications");

    expect(await requestNotificationPermission()).toBe(false);
  });
});

describe("cancelAllMaintenanceReminders", () => {
  it("🔴 bekleyen bildirimler VARSA, GERÇEKTEN hepsini iptal eder", async () => {
    getPendingMock.mockResolvedValue({ notifications: [{ id: 1 }, { id: 2 }] });
    const { cancelAllMaintenanceReminders } = await import("./notifications");

    await cancelAllMaintenanceReminders();

    expect(cancelMock).toHaveBeenCalledWith({ notifications: [{ id: 1 }, { id: 2 }] });
  });

  it("bekleyen bildirim YOKSA, cancel() HİÇ ÇAĞRILMAZ (gereksiz native çağrı önlenir)", async () => {
    getPendingMock.mockResolvedValue({ notifications: [] });
    const { cancelAllMaintenanceReminders } = await import("./notifications");

    await cancelAllMaintenanceReminders();

    expect(cancelMock).not.toHaveBeenCalled();
  });
});

describe("scheduleMaintenanceReminders", () => {
  it("🔴 GELECEKTEKİ bir nextDueDate için GERÇEKTEN bir bildirim zamanlar", async () => {
    const { scheduleMaintenanceReminders } = await import("./notifications");
    const plan = makePlan({ nextDueDate: "2026-08-15T09:00:00.000Z" });

    await scheduleMaintenanceReminders([plan], new Date("2026-08-01T00:00:00.000Z"));

    expect(scheduleMock).toHaveBeenCalledTimes(1);
    const sent = scheduleMock.mock.calls[0][0].notifications[0];
    expect(sent.schedule.at).toEqual(new Date("2026-08-15T09:00:00.000Z"));
    expect(sent.body).toContain("Sulama");
  });

  it("🔴 GEÇMİŞTE kalan (zaten gecikmiş) bir plan İÇİN bildirim ZAMANLANMAZ", async () => {
    const { scheduleMaintenanceReminders } = await import("./notifications");
    const overduePlan = makePlan({ nextDueDate: "2026-07-01T00:00:00.000Z" });

    await scheduleMaintenanceReminders([overduePlan], new Date("2026-08-01T00:00:00.000Z"));

    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it("hiç plan YOKSA, schedule() HİÇ ÇAĞRILMAZ", async () => {
    const { scheduleMaintenanceReminders } = await import("./notifications");

    await scheduleMaintenanceReminders([], new Date());

    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it("🔴 AYNI plan id'si, HER ZAMAN AYNI bildirim id'sini kullanır (iptal/yeniden zamanlama tutarlılığı)", async () => {
    const { scheduleMaintenanceReminders, hashPlanIdToNotificationId } = await import("./notifications");
    const plan = makePlan({ id: "plan-abc", nextDueDate: "2026-08-15T00:00:00.000Z" });

    await scheduleMaintenanceReminders([plan], new Date("2026-08-01T00:00:00.000Z"));

    const sent = scheduleMock.mock.calls[0][0].notifications[0];
    expect(sent.id).toBe(hashPlanIdToNotificationId("plan-abc"));
  });
});
