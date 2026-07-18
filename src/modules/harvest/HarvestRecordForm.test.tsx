// @vitest-environment jsdom
/**
 * HarvestRecordForm Bileşen Testleri
 * =====================================
 * bkz. MaintenanceRecordForm.test.tsx — aynı desen. Bakım'ın aksine
 * Hasat'ta GERÇEK zorunlu alanlar var (harvestDate/quantityKg) — bu
 * testler ÖZELLİKLE doğrulama davranışına odaklanıyor.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { HarvestRecordForm } from "./HarvestRecordForm";
import type { HarvestRecord } from "./domain/harvest.types";

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

describe("HarvestRecordForm — Doğrulama", () => {
  it("harvestDate BOŞ iken gönderim REDDEDİLİR (onSubmit çağrılmaz)", async () => {
    const onSubmit = vi.fn();
    render(<HarvestRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Quantity (kg)"), { target: { value: "100" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Please select a harvest date.")).toBeTruthy();
  });

  it("quantityKg BOŞ iken gönderim REDDEDİLİR", async () => {
    const onSubmit = vi.fn();
    render(<HarvestRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Harvest Date"), { target: { value: "2026-11-15" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Quantity must be a positive number.")).toBeTruthy();
  });

  it("quantityKg SIFIR veya NEGATİF iken gönderim REDDEDİLİR", async () => {
    const onSubmit = vi.fn();
    render(<HarvestRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Harvest Date"), { target: { value: "2026-11-15" } });
    fireEvent.change(screen.getByLabelText("Quantity (kg)"), { target: { value: "-5" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("her iki alan da GEÇERLİ doldurulduğunda gönderim başarıyla çalışır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<HarvestRecordForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Harvest Date"), { target: { value: "2026-11-15" } });
    fireEvent.change(screen.getByLabelText("Quantity (kg)"), { target: { value: "640" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.parcelId).toBe(PARCEL_ID);
    expect(submitted.quantityKg).toBe(640);
    expect(submitted.treeId).toBeNull();
  });
});

describe("HarvestRecordForm — Düzenleme Modu", () => {
  const existingRecord: HarvestRecord = {
    id: "h1",
    parcelId: PARCEL_ID,
    treeId: null,
    harvestDate: "2026-11-15T00:00:00.000Z",
    quantityKg: 640,
    notes: "İlk hasat",
    isActive: true,
    createdAt: "2026-11-15T00:00:00.000Z",
    updatedAt: "2026-11-15T00:00:00.000Z",
  };

  it("mevcut değerler forma ÖNCEDEN doldurulmuş gelir", () => {
    render(
      <HarvestRecordForm parcelId={PARCEL_ID} initialValue={existingRecord} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect((screen.getByLabelText("Quantity (kg)") as HTMLInputElement).value).toBe("640");
    expect((screen.getByLabelText("Notes") as HTMLTextAreaElement).value).toBe("İlk hasat");
  });

  it("onDelete verilirse Sil butonu görünür, verilmezse görünmez", () => {
    const { unmount } = render(
      <HarvestRecordForm
        parcelId={PARCEL_ID}
        initialValue={existingRecord}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Delete Record")).toBeTruthy();
    unmount();

    render(
      <HarvestRecordForm parcelId={PARCEL_ID} initialValue={existingRecord} onSubmit={vi.fn()} onCancel={() => {}} />
    );
    expect(screen.queryByText("Delete Record")).toBeNull();
  });
});
