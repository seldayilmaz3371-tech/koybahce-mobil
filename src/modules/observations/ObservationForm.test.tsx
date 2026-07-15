// @vitest-environment jsdom
/**
 * ObservationForm Bileşen Testleri
 * ===================================
 * bkz. TreeForm.test.tsx (Sprint 2.3) — aynı i18n/cleanup deseni.
 *
 * Özellikle Sprint 3.3 UX Doğrulamasında onaylanan 2 karar test
 * ediliyor: (1) observationType varsayılan "general", (2) observedAt
 * kullanıcıdan hiç istenmiyor, gönderim anında üretiliyor (oluşturma)
 * veya orijinali korunuyor (düzenleme).
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { ObservationForm } from "./ObservationForm";
import type { Observation } from "./domain/observation.types";

const PARCEL_ID = "parcel-123";
const TREE_ID = "tree-456";

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

describe("ObservationForm", () => {
  it("observationType varsayılan olarak 'General' seçili gelir (onaylanan UX kararı 1)", () => {
    render(
      <ObservationForm parcelId={PARCEL_ID} treeId={TREE_ID} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect((screen.getByLabelText("Type") as HTMLSelectElement).value).toBe("general");
  });

  it("formda observedAt için HİÇBİR alan yok (kullanıcıdan hiç istenmiyor)", () => {
    render(
      <ObservationForm parcelId={PARCEL_ID} treeId={TREE_ID} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect(screen.queryByLabelText(/date|tarih|observed/i)).toBeNull();
  });

  it("0 zorunlu alan: hiçbir şey doldurulmadan direkt Kaydet başarıyla çalışır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ObservationForm parcelId={PARCEL_ID} treeId={TREE_ID} onSubmit={onSubmit} onCancel={() => {}} />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.parcelId).toBe(PARCEL_ID);
    expect(submitted.treeId).toBe(TREE_ID);
    expect(submitted.observationType).toBe("general");
    expect(submitted.note).toBeNull();
  });

  it("oluşturma modunda observedAt, TAM OLARAK gönderim anında üretilir (onaylanan UX kararı 2)", async () => {
    const beforeSubmit = new Date();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ObservationForm parcelId={PARCEL_ID} treeId={TREE_ID} onSubmit={onSubmit} onCancel={() => {}} />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });
    const afterSubmit = new Date();

    const submittedObservedAt = new Date(onSubmit.mock.calls[0][0].observedAt);
    expect(submittedObservedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
    expect(submittedObservedAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime());
  });

  it("düzenleme modunda ORİJİNAL observedAt korunur, yeniden üretilmez (tarihsel doğruluk)", async () => {
    const existing: Observation = {
      id: "obs-1",
      parcelId: PARCEL_ID,
      treeId: TREE_ID,
      observationType: "health_concern",
      note: "İlk gözlem",
      observedAt: "2020-01-01T00:00:00.000Z", // bilerek uzak bir geçmiş tarih
      isActive: true,
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ObservationForm
        parcelId={PARCEL_ID}
        treeId={TREE_ID}
        initialValue={existing}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Güncellenmiş not" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit.mock.calls[0][0].observedAt).toBe("2020-01-01T00:00:00.000Z");
    expect(onSubmit.mock.calls[0][0].note).toBe("Güncellenmiş not");
  });

  it("treeId verilmediğinde (parsel geneli gözlem) null olarak gönderilir", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ObservationForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit.mock.calls[0][0].treeId).toBeNull();
  });

  it("silme akışı: onay verilirse onDelete çağrılır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const existing: Observation = {
      id: "obs-1",
      parcelId: PARCEL_ID,
      treeId: TREE_ID,
      observationType: "general",
      note: null,
      observedAt: "2026-01-01T00:00:00.000Z",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <ObservationForm
        parcelId={PARCEL_ID}
        treeId={TREE_ID}
        initialValue={existing}
        onSubmit={vi.fn()}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Delete Observation"));
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });
});
