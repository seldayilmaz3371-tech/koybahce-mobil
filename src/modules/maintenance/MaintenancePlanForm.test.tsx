// @vitest-environment jsdom
/**
 * MaintenancePlanForm Bileşen Testleri
 * ========================================
 * bkz. MaintenanceRecordForm.test.tsx (Sprint 5.2) — aynı desen. Ek
 * olarak: `intervalDays`/`nextDueDate` gerçek doğrulaması (Kayıt'ın
 * aksine, Plan'da bu alanlar ZORUNLU).
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { MaintenancePlanForm } from "./MaintenancePlanForm";
import type { MaintenancePlan } from "./domain/maintenance.types";

const PARCEL_ID = "parcel-123";

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

describe("MaintenancePlanForm", () => {
  it("maintenanceType varsayılan olarak 'Irrigation' seçili gelir", () => {
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("irrigation");
  });

  it("nextDueDate varsayılan olarak BUGÜN gelir, ama düzenlenebilir", () => {
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = screen.getByLabelText("Next Due Date") as HTMLInputElement;
    expect(dateInput.value).toBe(today);
    expect(dateInput.disabled).toBe(false);
  });

  it("intervalDays boşken doğrulama hatası gösterir, onSubmit ÇAĞRILMAZ", async () => {
    const onSubmit = vi.fn();
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Interval must be a positive whole number of days.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("intervalDays 0 veya negatifken doğrulama hatası gösterir", async () => {
    const onSubmit = vi.fn();
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Interval (Days)"), { target: { value: "0" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Interval must be a positive whole number of days.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("intervalDays ondalık (tam sayı olmayan) bir değerken doğrulama hatası gösterir", async () => {
    const onSubmit = vi.fn();
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Interval (Days)"), { target: { value: "7.5" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Interval must be a positive whole number of days.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("geçerli veriyle gönderim: tür/aralık/tarih doğru dönüştürülür", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "fertilization" } });
    fireEvent.change(screen.getByLabelText("Interval (Days)"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Next Due Date"), { target: { value: "2026-05-01" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.maintenanceType).toBe("fertilization");
    expect(submitted.intervalDays).toBe(30);
    expect(submitted.nextDueDate).toBe("2026-05-01T00:00:00.000Z");
  });

  it("Çift-Kayıt Koruması (useRef) — art arda Kaydet'e basmak sadece BİR kez onSubmit çağırır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText("Interval (Days)"), { target: { value: "7" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Düzenleme modu: mevcut değerlerle önceden doldurulur", () => {
    const existing: MaintenancePlan = {
      id: "mp-1",
      parcelId: PARCEL_ID,
      treeId: null,
      maintenanceType: "pruning",
      intervalDays: 180,
      nextDueDate: "2026-11-01T00:00:00.000Z",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <MaintenancePlanForm parcelId={PARCEL_ID} initialValue={existing} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("pruning");
    expect((screen.getByLabelText("Interval (Days)") as HTMLInputElement).value).toBe("180");
    expect((screen.getByLabelText("Next Due Date") as HTMLInputElement).value).toBe("2026-11-01");
    expect(screen.getByText("Edit Maintenance Plan")).toBeTruthy();
  });

  it("silme akışı: onay verilirse onDelete çağrılır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const existing: MaintenancePlan = {
      id: "mp-1",
      parcelId: PARCEL_ID,
      treeId: null,
      maintenanceType: "irrigation",
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <MaintenancePlanForm
        parcelId={PARCEL_ID}
        initialValue={existing}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Delete Plan"));
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it("oluşturma modunda 'Delete Plan' butonu gösterilmez", () => {
    render(<MaintenancePlanForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.queryByText("Delete Plan")).toBeNull();
  });
});
