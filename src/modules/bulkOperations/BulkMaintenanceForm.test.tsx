// @vitest-environment jsdom
/**
 * BulkMaintenanceForm Bileşen Testleri
 * =======================================
 * bkz. Sprint 10.2.
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
import { parcelRepository } from "../parcels/data/parcel.repository";
import { treeRepository } from "../trees/data/tree.repository";
import { maintenanceRepository } from "../maintenance/data/maintenance.repository";
import { BulkMaintenanceForm } from "./BulkMaintenanceForm";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
  vi.restoreAllMocks();
});

async function createParcelWithTrees(count: number) {
  const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
  const trees = [];
  for (let i = 0; i < count; i++) {
    trees.push(await treeRepository.create({ parcelId: parcel.id, treeNumber: `T-${i}`, variety: "Gemlik" }));
  }
  return { parcel, trees };
}

describe("BulkMaintenanceForm — Tüm Ağaçlara Uygula", () => {
  it("kullanıcı ONAYLARSA, TÜM ağaçlara GERÇEKTEN kayıt oluşturulur ve sonuç gösterilir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(3);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("3 records created. 0 errors.")).toBeTruthy());
    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records).toHaveLength(3);
  });

  it("kullanıcı ONAY VERMEZSE, HİÇBİR kayıt oluşturulmaz", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { parcel, trees } = await createParcelWithTrees(3);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records).toHaveLength(0);
  });
});

describe("BulkMaintenanceForm — Ağaç Seçerek Uygula", () => {
  it("SADECE seçilen ağaçlara kayıt oluşturulur", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(3);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Select Trees to Apply"));
    fireEvent.click(screen.getByLabelText("T-0 · Gemlik"));
    fireEvent.click(screen.getByLabelText("T-1 · Gemlik"));

    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("2 records created. 0 errors.")).toBeTruthy());
  });

  it("hiçbir ağaç seçilmeden Uygula'ya basılırsa hata gösterilir, kayıt OLUŞTURULMAZ", async () => {
    const { parcel, trees } = await createParcelWithTrees(3);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("Select Trees to Apply"));
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("Please select at least one tree.")).toBeTruthy());
    expect(await maintenanceRepository.listByParcel(parcel.id)).toHaveLength(0);
  });
});

describe("BulkMaintenanceForm — Geri Al (Undo)", () => {
  it("'Undo' butonuna basmak, OLUŞTURULAN TÜM kayıtları GERÇEKTEN geri alır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(3);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("3 records created. 0 errors.")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
    });

    await waitFor(async () => {
      const records = await maintenanceRepository.listByParcel(parcel.id);
      expect(records).toHaveLength(0);
    });
  });
});

describe("BulkMaintenanceForm — Undo Güvenliği (Sprint 10.3, Madde 8)", () => {
  it("Undo AYRI bir onay ister — kaç kaydın etkileneceği AÇIKÇA belirtilir", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(5);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("5 records created. 0 errors.")).toBeTruthy());
    confirmSpy.mockClear();

    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
    });

    expect(confirmSpy).toHaveBeenCalledWith("This will undo 5 records. This cannot be easily reversed. Continue?");
  });

  it("Undo onayı REDDEDİLİRSE, kayıtlar KALICI olarak KALIR (yanlışlıkla geri alma ENGELLENİR)", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(3);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });
    await waitFor(() => expect(screen.getByText("3 records created. 0 errors.")).toBeTruthy());

    confirmSpy.mockReturnValue(false); // Kullanıcı Undo onayında "İptal" der
    await act(async () => {
      fireEvent.click(screen.getByText("Undo"));
    });

    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records).toHaveLength(3); // GERİ ALINMADI
  });
});

describe("BulkMaintenanceForm — 'Biçme' Kararı (Sprint 10.2 mimari kararı)", () => {
  it("'Biçme' seçilirse, GERÇEKTEN 'other' maintenanceType ile kaydedilir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "other" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("1 records created. 0 errors.")).toBeTruthy());
    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records[0].maintenanceType).toBe("other");
  });
});
<<<<<<< HEAD

describe("BulkMaintenanceForm — Geriye Dönük Tarih/Saat (Sprint 10.4, Madde 1)", () => {
  it("Tarih/Saat alanları VARSAYILAN olarak DOLU gelir (boş DEĞİL)", async () => {
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    const timeInput = screen.getByLabelText("Time") as HTMLInputElement;
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(timeInput.value).toMatch(/^\d{2}:\d{2}$/);
  });

  it("kullanıcı tarihi GEÇMİŞE değiştirebilir, kayıt GERÇEKTEN o tarihle oluşturulur", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-07-01" } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "14:30" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("1 records created. 0 errors.")).toBeTruthy());
    const records = await maintenanceRepository.listByParcel(parcel.id);
    // GERÇEK KANIT: completedDate, KULLANICININ SEÇTİĞİ tarih+saati YANSITMALI (bugünün tarihi DEĞİL).
    expect(records[0].completedDate).toContain("2026-07-01");
  });

  it("bu davranış TÜM bakım türlerinde (Gübreleme dahil) ÇALIŞIR — sadece Sulama'ya özel DEĞİL", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "fertilization" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-06-15" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("1 records created. 0 errors.")).toBeTruthy());
    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records[0].maintenanceType).toBe("fertilization");
    expect(records[0].completedDate).toContain("2026-06-15");
  });
});

describe("BulkMaintenanceForm — Sulama Başlangıç/Bitiş Saati (Sprint 10.4, Madde 2)", () => {
  it("Başlangıç/Bitiş Saati alanları SADECE Sulama seçiliyken GÖRÜNÜR", async () => {
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    // Varsayılan tür Sulama (Irrigation) — alanlar GÖRÜNÜR olmalı.
    expect(screen.getByLabelText("Start Time")).toBeTruthy();
    expect(screen.getByLabelText("End Time")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "pruning" } });

    expect(screen.queryByLabelText("Start Time")).toBeNull();
    expect(screen.queryByLabelText("End Time")).toBeNull();
  });

  it("Başlangıç/Bitiş saati girilince, TOPLAM SÜRE kullanıcının kendi örneğiyle BİREBİR AYNI şekilde CANLI hesaplanır (06:15->08:05 = 1 Saat 50 Dakika)", async () => {
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "06:15" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "08:05" } });

    await waitFor(() => expect(screen.getByText("Total Duration: 1h 50m")).toBeTruthy());
  });

  it("Başlangıç/Bitiş saati GERÇEKTEN veritabanına kaydedilir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "06:15" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "08:05" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("1 records created. 0 errors.")).toBeTruthy());
    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records[0].startTime).toBe("06:15");
    expect(records[0].endTime).toBe("08:05");
  });

  it("Gübreleme (Sulama DIŞI) türünde startTime/endTime GÖNDERİLMEZ — null olarak kaydedilir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcel, trees } = await createParcelWithTrees(1);

    render(<BulkMaintenanceForm parcelId={parcel.id} trees={trees} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "fertilization" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Apply"));
    });

    await waitFor(() => expect(screen.getByText("1 records created. 0 errors.")).toBeTruthy());
    const records = await maintenanceRepository.listByParcel(parcel.id);
    expect(records[0].startTime).toBeNull();
    expect(records[0].endTime).toBeNull();
  });
});
=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
