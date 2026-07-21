// @vitest-environment jsdom
/**
 * MaintenanceRecordForm Bileşen Testleri
 * ==========================================
 * bkz. FinanceRecordForm.test.tsx (Sprint 4.2) — aynı desen.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { MaintenanceRecordForm } from "./MaintenanceRecordForm";
import type { MaintenanceRecord } from "./domain/maintenance.types";

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

describe("MaintenanceRecordForm", () => {
  it("maintenanceType varsayılan olarak 'Irrigation' seçili gelir (Minimum Dokunuş İlkesi)", () => {
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("irrigation");
  });

  it("status varsayılan olarak 'Completed' seçili gelir", () => {
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe("completed");
  });

  it("tarih alanları varsayılan olarak BOŞ gelir (Finance'in aksine — hiçbiri zorunlu değil)", () => {
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect((screen.getByLabelText("Scheduled Date") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Completed Date") as HTMLInputElement).value).toBe("");
  });

  it("hiçbir alan doldurulmadan (0 zorunlu alan) gönderim başarıyla çalışır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.maintenanceType).toBe("irrigation");
    expect(submitted.status).toBe("completed");
    expect(submitted.scheduledDate).toBeNull();
    expect(submitted.completedDate).toBeNull();
    expect(submitted.notes).toBeNull();
  });

  it("geçerli veriyle gönderim: seçilen tür/durum/tarihler doğru ISO'ya dönüştürülür", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "pruning" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "planned" } });
    fireEvent.change(screen.getByLabelText("Scheduled Date"), { target: { value: "2026-05-01" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.maintenanceType).toBe("pruning");
    expect(submitted.status).toBe("planned");
    expect(submitted.scheduledDate).toBe("2026-05-01T00:00:00.000Z");
    expect(submitted.completedDate).toBeNull();
  });

  it("Çift-Kayıt Koruması (useRef) — art arda Kaydet'e basmak sadece BİR kez onSubmit çağırır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Düzenleme modu: mevcut değerlerle önceden doldurulur", () => {
    const existing: MaintenanceRecord = {
      id: "mr-1",
      parcelId: PARCEL_ID,
      treeId: null,
      maintenanceType: "pesticide",
      status: "completed",
      scheduledDate: null,
      completedDate: "2026-04-10T00:00:00.000Z",
      startTime: null,
      endTime: null,
      notes: "Yaprak biti ilaçlaması",
      isActive: true,
      createdAt: "2026-04-10T00:00:00.000Z",
      updatedAt: "2026-04-10T00:00:00.000Z",
    };

    render(
      <MaintenanceRecordForm parcelId={PARCEL_ID} initialValue={existing} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("pesticide");
    expect((screen.getByLabelText("Completed Date") as HTMLInputElement).value).toBe("2026-04-10");
    expect((screen.getByLabelText("Notes") as HTMLTextAreaElement).value).toBe("Yaprak biti ilaçlaması");
    expect(screen.getByText("Edit Maintenance Record")).toBeTruthy();
  });

  it("silme akışı: onay verilirse onDelete çağrılır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const existing: MaintenanceRecord = {
      id: "mr-1",
      parcelId: PARCEL_ID,
      treeId: null,
      maintenanceType: "irrigation",
      status: "completed",
      scheduledDate: null,
      completedDate: "2026-01-01T00:00:00.000Z",
      startTime: null,
      endTime: null,
      notes: null,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <MaintenanceRecordForm
        parcelId={PARCEL_ID}
        initialValue={existing}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Delete Record"));
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it("silme akışı: onay reddedilirse onDelete ÇAĞRILMAZ", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onDelete = vi.fn();
    const existing: MaintenanceRecord = {
      id: "mr-1",
      parcelId: PARCEL_ID,
      treeId: null,
      maintenanceType: "irrigation",
      status: "completed",
      scheduledDate: null,
      completedDate: null,
      startTime: null,
      endTime: null,
      notes: null,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <MaintenanceRecordForm
        parcelId={PARCEL_ID}
        initialValue={existing}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Delete Record"));
    });

    expect(onDelete).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("Cancel: onCancel çağrılır", () => {
    const onCancel = vi.fn();
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("oluşturma modunda (initialValue yok) 'Delete Record' butonu gösterilmez", () => {
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.queryByText("Delete Record")).toBeNull();
  });
});

describe("MaintenanceRecordForm — Sulama Başlangıç/Bitiş Saati (Sprint 10.4 Düzeltme Paketi)", () => {
  it("varsayılan tür Sulama OLDUĞU İÇİN, saat alanları OLUŞTURMA modunda GÖRÜNÜR", () => {
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);

    expect(screen.getByLabelText("Start Time")).toBeTruthy();
    expect(screen.getByLabelText("End Time")).toBeTruthy();
  });

  it("Sulama DIŞI bir tür SEÇİLDİĞİNDE, saat alanları GERÇEKTEN kaybolur", () => {
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "pruning" } });

    expect(screen.queryByLabelText("Start Time")).toBeNull();
    expect(screen.queryByLabelText("End Time")).toBeNull();
  });

  it("düzenleme modunda, MEVCUT bir Sulama kaydının saatleri GERÇEKTEN alanlara YÜKLENİR", () => {
    const existing: MaintenanceRecord = {
      id: "mr-2",
      parcelId: PARCEL_ID,
      treeId: null,
      maintenanceType: "irrigation",
      status: "completed",
      scheduledDate: null,
      completedDate: "2026-07-19T00:00:00.000Z",
      startTime: "06:15",
      endTime: "08:05",
      notes: null,
      isActive: true,
      createdAt: "2026-07-19T00:00:00.000Z",
      updatedAt: "2026-07-19T00:00:00.000Z",
    };

    render(
      <MaintenanceRecordForm parcelId={PARCEL_ID} initialValue={existing} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect((screen.getByLabelText("Start Time") as HTMLInputElement).value).toBe("06:15");
    expect((screen.getByLabelText("End Time") as HTMLInputElement).value).toBe("08:05");
  });

  it("Sulama kaydı kaydedilirken, GİRİLEN saatler GERÇEKTEN onSubmit'e iletilir", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "06:15" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "08:05" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ startTime: "06:15", endTime: "08:05" }));
  });

  it("Sulama DIŞI bir tür kaydedilirken, startTime/endTime GERÇEKTEN null olarak gönderilir (alanlar ekranda OLSA BİLE görmezden gelinir)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MaintenanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "06:15" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "08:05" } });
    // Kullanıcı SONRADAN türü değiştirirse (saatleri GİRDİKTEN sonra) — alanlar KAYBOLUR,
    // GERİYE dönük olarak GİRİLEN değerler GÖNDERİLMEMELİ.
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "fertilization" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ startTime: null, endTime: null }));
  });
});
