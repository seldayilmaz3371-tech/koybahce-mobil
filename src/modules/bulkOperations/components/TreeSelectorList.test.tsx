// @vitest-environment jsdom
/**
 * TreeSelectorList Bileşen Testleri
 * ====================================
 * bkz. Sprint 10.2.
 */

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../../../i18n/locales/en/common.json";
import { TreeSelectorList, type TreeSelectionMode } from "./TreeSelectorList";
import { useTreeSelection } from "../hooks/useTreeSelection";
import type { Tree } from "../../trees/domain/tree.types";

const fakeTrees: Tree[] = [
  {
    id: "t1",
    parcelId: "p1",
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
  },
  {
    id: "t2",
    parcelId: "p1",
    treeNumber: "A-2",
    variety: "Ayvalık",
    plantingYear: null,
    latitude: null,
    longitude: null,
    isReferenceTree: false,
    notes: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

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

function TestWrapper({
  trees,
  initialMode,
  onModeChangeSpy,
}: {
  trees: Tree[];
  initialMode: TreeSelectionMode;
  onModeChangeSpy: (mode: TreeSelectionMode) => void;
}) {
  const selection = useTreeSelection();
  const [mode, setMode] = useState(initialMode);
  return (
    <TreeSelectorList
      trees={trees}
      mode={mode}
      onModeChange={(newMode: TreeSelectionMode) => {
        onModeChangeSpy(newMode);
        setMode(newMode);
      }}
      selection={selection}
    />
  );
}

function renderWithSelection(mode: "all" | "select", trees = fakeTrees) {
  const onModeChange = vi.fn();
  render(<TestWrapper trees={trees} initialMode={mode} onModeChangeSpy={onModeChange} />);
  return { onModeChange };
}

describe("TreeSelectorList", () => {
  it("'Apply to All Trees' butonu GERÇEK ağaç sayısını gösterir", () => {
    renderWithSelection("all");

    expect(screen.getByText("Apply to All Trees (2)")).toBeTruthy();
  });

  it("'select' modunda checkbox listesi ve 'Select All'/'Clear Selection' butonları görünür", () => {
    renderWithSelection("select");

    expect(screen.getByText("Select All")).toBeTruthy();
    expect(screen.getByText("Clear Selection")).toBeTruthy();
    expect(screen.getByText("A-1 · Gemlik")).toBeTruthy();
    expect(screen.getByText("A-2 · Ayvalık")).toBeTruthy();
  });

  it("'all' modunda checkbox listesi GÖRÜNMEZ", () => {
    renderWithSelection("all");

    expect(screen.queryByText("Select All")).toBeNull();
  });

  it("bir ağacın checkbox'ına tıklamak seçim sayısını GERÇEKTEN günceller", () => {
    renderWithSelection("select");

    expect(screen.getByText("0 trees selected")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("A-1 · Gemlik"));

    expect(screen.getByText("1 trees selected")).toBeTruthy();
  });

  it("'Apply to All Trees'e tıklamak onModeChange('all') çağırır", () => {
    const { onModeChange } = renderWithSelection("select");

    fireEvent.click(screen.getByText("Apply to All Trees (2)"));

    expect(onModeChange).toHaveBeenCalledWith("all");
  });
});

describe("TreeSelectorList — Arama Kutusu (Sprint 10.3)", () => {
  it("ağaç numarasına göre GERÇEKTEN filtreler", () => {
    renderWithSelection("select");

    fireEvent.change(screen.getByPlaceholderText("Search by tree number or variety..."), {
      target: { value: "A-1" },
    });

    expect(screen.getByText("A-1 · Gemlik")).toBeTruthy();
    expect(screen.queryByText("A-2 · Ayvalık")).toBeNull();
  });

  it("çeşit adına göre (büyük/küçük harf duyarsız) GERÇEKTEN filtreler", () => {
    renderWithSelection("select");

    fireEvent.change(screen.getByPlaceholderText("Search by tree number or variety..."), {
      target: { value: "ayvalık" },
    });

    expect(screen.getByText("A-2 · Ayvalık")).toBeTruthy();
    expect(screen.queryByText("A-1 · Gemlik")).toBeNull();
  });

  it("eşleşme yoksa 'sonuç yok' mesajı gösterir", () => {
    renderWithSelection("select");

    fireEvent.change(screen.getByPlaceholderText("Search by tree number or variety..."), {
      target: { value: "var-olmayan-bir-sey" },
    });

    expect(screen.getByText("No trees match your search.")).toBeTruthy();
  });

  it("'Select All', SADECE aramayla eşleşen ağaçları seçer (tüm parseli DEĞİL)", () => {
    renderWithSelection("select");
    fireEvent.change(screen.getByPlaceholderText("Search by tree number or variety..."), {
      target: { value: "A-1" },
    });

    fireEvent.click(screen.getByText("Select All"));

    expect(screen.getByText("1 trees selected")).toBeTruthy();
  });
});
