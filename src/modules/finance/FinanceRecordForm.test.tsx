// @vitest-environment jsdom
/**
 * FinanceRecordForm Bileşen Testleri
 * =====================================
 * bkz. ObservationForm.test.tsx (Sprint 3.3) — aynı i18n/cleanup deseni.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { FinanceRecordForm } from "./FinanceRecordForm";
import type { FinanceRecord } from "./domain/finance.types";

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

describe("FinanceRecordForm", () => {
  it("recordType varsayılan olarak 'Cost' seçili gelir (Minimum Dokunuş İlkesi)", () => {
    render(<FinanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("cost");
  });

  it("recordDate varsayılan olarak BUGÜN gelir, ama düzenlenebilir", () => {
    render(<FinanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    expect(dateInput.value).toBe(today);
    expect(dateInput.disabled).toBe(false);
  });

  it("amount boşken (veya 0/negatifken) doğrulama hatası gösterir, onSubmit çağrılmaz", async () => {
    const onSubmit = vi.fn();
    render(<FinanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Amount must be a positive number.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("geçerli veriyle gönderim: amount doğru sayıya, recordDate doğru ISO'ya dönüştürülür", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FinanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "250.75" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-03-15" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.amountMinor).toBe(25075);
    expect(submitted.recordDate).toBe("2026-03-15T00:00:00.000Z");
    expect(submitted.recordType).toBe("cost");
    expect(submitted.notes).toBeNull();
  });

  it("Çift-Kayıt Koruması (useRef) — art arda Kaydet'e basmak sadece BİR kez onSubmit çağırır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FinanceRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Düzenleme modu: mevcut değerlerle önceden doldurulur, orijinal tarih korunur", () => {
    const existing: FinanceRecord = {
      id: "fr-1",
      parcelId: PARCEL_ID,
      treeId: null,
      recordType: "sale",
      amountMinor: 150000,
      currencyCode: "TRY",
      recordDate: "2025-06-01T00:00:00.000Z",
      notes: "Zeytin satışı",
      isActive: true,
      createdAt: "2025-06-01T00:00:00.000Z",
      updatedAt: "2025-06-01T00:00:00.000Z",
    };

    render(
      <FinanceRecordForm parcelId={PARCEL_ID} initialValue={existing} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("sale");
    expect((screen.getByLabelText("Amount") as HTMLInputElement).value).toBe("1500");
    expect((screen.getByLabelText("Date") as HTMLInputElement).value).toBe("2025-06-01");
    expect((screen.getByLabelText("Notes") as HTMLTextAreaElement).value).toBe("Zeytin satışı");
    expect(screen.getByText("Edit Finance Record")).toBeTruthy();
  });

  it("silme akışı: onay verilirse onDelete çağrılır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const existing: FinanceRecord = {
      id: "fr-1",
      parcelId: PARCEL_ID,
      treeId: null,
      recordType: "cost",
      amountMinor: 10000,
      currencyCode: "TRY",
      recordDate: "2026-01-01T00:00:00.000Z",
      notes: null,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <FinanceRecordForm
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

  it("currencyCode formda hiç gösterilmiyor (sessizce atanıyor)", () => {
    render(<FinanceRecordForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.queryByText(/TRY/)).toBeNull();
    expect(screen.queryByLabelText(/currency/i)).toBeNull();
  });
});
