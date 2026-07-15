// @vitest-environment jsdom
/**
 * Modül 3 — Referans Ağaç Akışı + Tam Geri Tuşu Zinciri (Sprint 3.9, Madde 3-4)
 * =================================================================================
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/locales/en/common.json";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../data/db/migrations/schema";
import { parcelRepository } from "../modules/parcels/data/parcel.repository";
import { treeRepository } from "../modules/trees/data/tree.repository";
import { observationRepository } from "../modules/observations/data/observation.repository";
import { TreesScreen } from "../modules/trees/TreesScreen";
import { ObservationScreen } from "../modules/observations/ObservationScreen";

const backButtonListeners: Array<() => void> = [];
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((_e: string, cb: () => void) => {
      backButtonListeners.push(cb);
      return Promise.resolve({ remove: vi.fn() });
    }),
    exitApp: vi.fn(),
  },
}));

function pressBackButton() {
  act(() => {
    backButtonListeners[backButtonListeners.length - 1]();
  });
}

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
  backButtonListeners.length = 0;
});

afterEach(() => {
  cleanup();
  resetDatabaseExecutorProviderForTesting();
});

describe("Modül 3 — Referans Ağaç Akışı (Sprint 3.9, Madde 3)", () => {
  it("referans olarak işaretlenen bir ağaç, Reference Mode'da bulunur ve gözlem geçmişine tam erişilebilir", async () => {
    const parcelA = await parcelRepository.create({ name: "Parsel A", cropType: "olive", areaDekar: 5 });
    const parcelB = await parcelRepository.create({ name: "Parsel B", cropType: "olive", areaDekar: 3 });
    const referenceTree = await treeRepository.create({
      parcelId: parcelA.id,
      treeNumber: "REF-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    await treeRepository.create({ parcelId: parcelB.id, treeNumber: "B-1", variety: "Ayvalık" });
    await observationRepository.create({
      parcelId: parcelA.id,
      treeId: referenceTree.id,
      observationType: "growth_stage",
      note: "Referans ağaç gözlemi",
      observedAt: "2026-01-01T00:00:00.000Z",
    });

    // Reference Mode'da ağacı bul.
    const onViewObservations = vi.fn();
    render(
      <TreesScreen mode={{ mode: "reference" }} onBack={() => {}} onViewObservations={onViewObservations} />
    );
    await waitFor(() => expect(screen.getByText("REF-1")).toBeTruthy());
    expect(screen.queryByText("B-1")).toBeNull(); // referans değil, görünmemeli

    fireEvent.click(screen.getByText("REF-1"));
    await waitFor(() => expect(screen.getByText("View Observations")).toBeTruthy());
    fireEvent.click(screen.getByText("View Observations"));

    expect(onViewObservations).toHaveBeenCalledWith(expect.objectContaining({ id: referenceTree.id }));
    cleanup();

    // Reference Mode üzerinden ulaşılan ağacın gözlem geçmişi tam erişilebilir.
    render(
      <ObservationScreen
        scope={{ mode: "tree", treeId: referenceTree.id }}
        parcelId={parcelA.id}
        onBack={() => {}}
        onViewPhotos={() => {}}
      />
    );
    await waitFor(() => expect(screen.getByText(/Referans ağaç gözlemi/)).toBeTruthy());
  });
});

describe("Modül 3 — Tam Geri Tuşu Zinciri (Sprint 3.9, Madde 4)", () => {
  it("Ağaç ekranından geri tuşu Parsellere döner (onBack çağrılır)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 1 });
    const onBack = vi.fn();
    render(
      <TreesScreen mode={{ mode: "parcel", parcelId: parcel.id }} onBack={onBack} onViewObservations={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("No trees yet.")).toBeTruthy());

    pressBackButton();

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Gözlem ekranından geri tuşu Ağaca döner (onBack çağrılır)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 1 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    const onBack = vi.fn();
    render(
      <ObservationScreen
        scope={{ mode: "tree", treeId: tree.id }}
        parcelId={parcel.id}
        onBack={onBack}
        onViewPhotos={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText("No observations yet.")).toBeTruthy());

    pressBackButton();

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Her ekranda form açıkken geri tuşu KAYDETMEDEN listeye döner (Ağaç ekranında doğrulama)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 1 });

    render(
      <TreesScreen mode={{ mode: "parcel", parcelId: parcel.id }} onBack={() => {}} onViewObservations={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText("Add Tree")).toBeTruthy());
    fireEvent.click(screen.getByText("Add Tree"));
    expect(screen.getByText("New Tree")).toBeTruthy();
    pressBackButton();
    expect(screen.queryByText("New Tree")).toBeNull();
    const treesAfterCancel = await treeRepository.listByParcel(parcel.id);
    expect(treesAfterCancel).toHaveLength(0); // kaydedilmedi
  });
});
