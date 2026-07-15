// @vitest-environment jsdom
/**
 * ObservationScreen Bileşen Testleri
 * =====================================
 * bkz. TreesScreen.test.tsx (Sprint 2.5) — aynı desen.
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
import { observationRepository } from "./data/observation.repository";
import { ObservationScreen } from "./ObservationScreen";

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
});

async function createTestParcelAndTree(): Promise<{ parcelId: string; treeId: string }> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  return { parcelId: parcel.id, treeId: tree.id };
}

describe("ObservationScreen", () => {
  it("Empty State: hiç gözlem yoksa boş durum mesajı gösterir", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    render(<ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} />);

    await waitFor(() => expect(screen.getByText("No observations yet.")).toBeTruthy());
  });

  it("Create: 'Add Observation' → varsayılan tiple direkt Kaydet → kart listede görünür", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    render(<ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} />);
    await waitFor(() => expect(screen.getByText("No observations yet.")).toBeTruthy());

    fireEvent.click(screen.getByText("Add Observation"));
    expect(screen.getByText("New Observation")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText("General")).toBeTruthy()); // kart üzerindeki tür etiketi
    expect(screen.queryByText("New Observation")).toBeNull(); // listeye dönüldü
  });

  it("Edit: karta dokunmak düzenleme formunu doğru verilerle açar, kaydetmek listeyi günceller", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await observationRepository.create({
      parcelId,
      treeId,
      observationType: "health_concern",
      note: "İlk not",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    render(<ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} />);
    await waitFor(() => expect(screen.getByText("Health Concern")).toBeTruthy());

    fireEvent.click(screen.getByText("Health Concern"));
    expect(screen.getByText("Edit Observation")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Güncellendi" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    await waitFor(() => expect(screen.getByText(/Güncellendi/)).toBeTruthy());
  });

  it("Delete: düzenleme formundan silme, onay sonrası kart listeden kalkar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { parcelId, treeId } = await createTestParcelAndTree();
    await observationRepository.create({
      parcelId,
      treeId,
      observationType: "general",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    render(<ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} />);
    await waitFor(() => expect(screen.getByText("General")).toBeTruthy());

    fireEvent.click(screen.getByText("General"));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete Observation"));
    });

    await waitFor(() => expect(screen.getByText("No observations yet.")).toBeTruthy());
    vi.restoreAllMocks();
  });

  it("Parcel Mode: sadece parsel geneli gözlemleri gösterir (ağaç gözlemini içermez)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await observationRepository.create({
      parcelId,
      treeId: null,
      observationType: "weather_impact",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    await observationRepository.create({
      parcelId,
      treeId,
      observationType: "health_concern",
      observedAt: "2026-01-02T00:00:00.000Z",
    });

    render(<ObservationScreen scope={{ mode: "parcel", parcelId }} parcelId={parcelId} />);

    await waitFor(() => expect(screen.getByText("Weather Impact")).toBeTruthy());
    expect(screen.queryByText("Health Concern")).toBeNull();
  });

  it("Sayfalama: 'Load More' 50'den fazla gözlemde görünür ve çalışır", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await observationRepository.create({
        parcelId,
        treeId,
        observationType: "general",
        observedAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    render(<ObservationScreen scope={{ mode: "tree", treeId }} parcelId={parcelId} />);
    await waitFor(() => expect(screen.getByText("Load More")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Load More"));
    });

    await waitFor(() => expect(screen.queryByText("Load More")).toBeNull());
  });
});
