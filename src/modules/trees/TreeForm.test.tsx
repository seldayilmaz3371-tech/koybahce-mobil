// @vitest-environment jsdom
/**
 * TreeForm Bileşen Testleri
 * ============================
 * i18next, gerçek çeviri kaynaklarıyla (en/common.json) ama Capacitor
 * Preferences'a HİÇ dokunmadan (initI18n() değil, doğrudan basit bir
 * init) başlatılıyor — bileşen testleri, native köprüye bağımlı
 * olmamalı (izole, hızlı, güvenilir).
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { TreeForm } from "./TreeForm";
import type { Tree } from "./domain/tree.types";

const PARCEL_ID = "parcel-123";

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

// `vitest.config.ts`'te `globals: true` YOK (bilinçli — global sızıntıyı
// önlemek için, bkz. proje geneli tercih) — bu yüzden @testing-library/
// react'in otomatik DOM temizliği tetiklenmiyor, açıkça çağırmamız gerekiyor.
afterEach(() => {
  cleanup();
});

describe("TreeForm", () => {
  it("zorunlu alanlar boşken submit edilirse treeNumberRequired hatası gösterir, onSubmit çağrılmaz", async () => {
    const onSubmit = vi.fn();
    render(<TreeForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Tree number is required.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("treeNumber doluyken variety boşsa varietyRequired hatası gösterir", async () => {
    const onSubmit = vi.fn();
    render(<TreeForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Tree Number"), { target: { value: "A-1" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(screen.getByText("Variety is required.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("geçerli veriyle submit edilirse onSubmit doğru parcelId ve alanlarla çağrılır", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TreeForm parcelId={PARCEL_ID} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Tree Number"), { target: { value: "A-1" } });
    fireEvent.change(screen.getByLabelText("Variety"), { target: { value: "Gemlik" } });
    fireEvent.click(screen.getByLabelText("Reference Tree"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(onSubmit).toHaveBeenCalledWith({
      parcelId: PARCEL_ID,
      treeNumber: "A-1",
      variety: "Gemlik",
      plantingYear: null,
      latitude: null,
      longitude: null,
      isReferenceTree: true,
      notes: null,
    });
  });

  it("initialValue verildiğinde alanlar önceden dolu gelir (düzenleme modu)", () => {
    const existingTree: Tree = {
      id: "tree-1",
      parcelId: PARCEL_ID,
      treeNumber: "A-1",
      variety: "Gemlik",
      plantingYear: 2015,
      latitude: 39.5,
      longitude: 27.1,
      isReferenceTree: true,
      notes: "Sağlıklı",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <TreeForm parcelId={PARCEL_ID} initialValue={existingTree} onSubmit={vi.fn()} onCancel={() => {}} />
    );

    expect(screen.getByText("Edit Tree")).toBeTruthy();
    expect((screen.getByLabelText("Tree Number") as HTMLInputElement).value).toBe("A-1");
    expect((screen.getByLabelText("Variety") as HTMLInputElement).value).toBe("Gemlik");
    expect((screen.getByLabelText("Reference Tree") as HTMLInputElement).checked).toBe(true);
  });

  it("onDelete verilmediğinde silme butonu gösterilmez", () => {
    render(<TreeForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.queryByText("Delete Tree")).toBeNull();
  });

  describe("silme akışı", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("kullanıcı onay dialogunu onaylarsa onDelete çağrılır", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const onDelete = vi.fn().mockResolvedValue(undefined);
      render(
        <TreeForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} onDelete={onDelete} />
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Delete Tree"));
      });

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("kullanıcı onay dialogunu reddederse onDelete çağrılmaz", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const onDelete = vi.fn();
      render(
        <TreeForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} onDelete={onDelete} />
      );

      await act(async () => {
        fireEvent.click(screen.getByText("Delete Tree"));
      });

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("Gözlemleri Görüntüle (Sprint 3.5)", () => {
    it("onViewObservations verilmediğinde buton gösterilmez", () => {
      render(<TreeForm parcelId={PARCEL_ID} onSubmit={vi.fn()} onCancel={() => {}} />);
      expect(screen.queryByText("View Observations")).toBeNull();
    });

    it("oluşturma modunda bile onViewObservations verilirse buton gösterilir (onDelete ile TUTARLI desen — çağıranın sorumluluğu)", () => {
      // GERÇEK BULGU: İlk yazımda bu test yanlış varsaydı (buton
      // sadece düzenleme modunda gösterilir diye). Gerçek kod, onDelete
      // ile AYNI deseni kullanıyor: sadece prop varlığına bakılıyor,
      // initialValue'ya değil — hangi modda geçirileceği ÇAĞIRANIN
      // (TreesScreen) sorumluluğu. TreesScreen zaten sadece düzenleme
      // modunda geçiriyor (kodda doğrulandı) — bu, o gerçek entegrasyonu
      // test ediyor, TreeForm'un kendi başına yaptığı bir kısıtlama değil.
      render(
        <TreeForm
          parcelId={PARCEL_ID}
          onSubmit={vi.fn()}
          onCancel={() => {}}
          onViewObservations={vi.fn()}
        />
      );
      expect(screen.getByText("View Observations")).toBeTruthy();
    });

    it("düzenleme modunda buton gösterilir ve tıklanınca onViewObservations çağrılır", async () => {
      const existingTree: Tree = {
        id: "tree-1",
        parcelId: PARCEL_ID,
        treeNumber: "A-1",
        variety: "Gemlik",
        plantingYear: null,
        latitude: null,
        longitude: null,
        isReferenceTree: false,
        notes: null,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      const onViewObservations = vi.fn();
      render(
        <TreeForm
          parcelId={PARCEL_ID}
          initialValue={existingTree}
          onSubmit={vi.fn()}
          onCancel={() => {}}
          onViewObservations={onViewObservations}
        />
      );

      fireEvent.click(screen.getByText("View Observations"));

      expect(onViewObservations).toHaveBeenCalledTimes(1);
    });
  });
});
