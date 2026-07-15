/**
 * PhotoRepository Testleri
 * ===========================
 * bkz. Sprint 3.6 Veri Modeli Doğrulaması — özellikle Madde 1/2
 * (sahipsiz fotoğraf oluşamaz), Madde 6 (Observation silinirse
 * RESTRICT), Madde 3 (bire-çok) gerçek testlerle kanıtlanıyor.
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "../../trees/data/tree.repository";
import { observationRepository } from "../../observations/data/observation.repository";
import { photoRepository } from "./photo.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createTestChain(): Promise<{ parcelId: string; treeId: string; observationId: string }> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  const observation = await observationRepository.create({
    parcelId: parcel.id,
    treeId: tree.id,
    observationType: "general",
    observedAt: "2026-01-01T00:00:00.000Z",
  });
  return { parcelId: parcel.id, treeId: tree.id, observationId: observation.id };
}

describe("PhotoRepository", () => {
  it("create() sonrası listByObservation() ile aynı fotoğrafı döndürür", async () => {
    const { observationId } = await createTestChain();
    const created = await photoRepository.create({
      observationId,
      filePath: "/data/photos/abc123.jpg",
    });

    const list = await photoRepository.listByObservation(observationId);

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: created.id, filePath: "/data/photos/abc123.jpg" });
  });

  it("takenAt verilmezse otomatik atanır (öncelik sırası madde 2 — backlog #13)", async () => {
    const { observationId } = await createTestChain();
    const before = new Date();

    const photo = await photoRepository.create({ observationId, filePath: "/data/photos/x.jpg" });

    const after = new Date();
    const takenAt = new Date(photo.takenAt);
    expect(takenAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(takenAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("takenAt açıkça verilirse (gelecekte EXIF'ten) o değer kullanılır", async () => {
    const { observationId } = await createTestChain();
    const photo = await photoRepository.create({
      observationId,
      filePath: "/data/photos/x.jpg",
      takenAt: "2020-05-15T10:30:00.000Z",
    });

    expect(photo.takenAt).toBe("2020-05-15T10:30:00.000Z");
  });

  it("Madde 1/2 — SAHİPSİZ fotoğraf oluşturulamaz: var olmayan bir observationId FOREIGN KEY hatası verir", async () => {
    await expect(
      photoRepository.create({ observationId: "var-olmayan-gozlem", filePath: "/data/photos/x.jpg" })
    ).rejects.toThrow();
  });

  it("Madde 3 — bir gözleme birden fazla fotoğraf bağlanabilir (bire-çok, sınır yok)", async () => {
    const { observationId } = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg", takenAt: "2026-01-01T10:00:00.000Z" });
    await photoRepository.create({ observationId, filePath: "/data/photos/2.jpg", takenAt: "2026-01-01T10:05:00.000Z" });
    await photoRepository.create({ observationId, filePath: "/data/photos/3.jpg", takenAt: "2026-01-01T10:10:00.000Z" });

    const list = await photoRepository.listByObservation(observationId);

    expect(list).toHaveLength(3);
  });

  it("Madde 4 — fotoğraflar kronolojik (taken_at ASC) sıralanır", async () => {
    const { observationId } = await createTestChain();
    await photoRepository.create({ observationId, filePath: "/data/photos/2.jpg", takenAt: "2026-01-01T10:05:00.000Z" });
    await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg", takenAt: "2026-01-01T10:00:00.000Z" });
    await photoRepository.create({ observationId, filePath: "/data/photos/3.jpg", takenAt: "2026-01-01T10:10:00.000Z" });

    const list = await photoRepository.listByObservation(observationId);

    expect(list.map((p) => p.filePath)).toEqual(["/data/photos/1.jpg", "/data/photos/2.jpg", "/data/photos/3.jpg"]);
  });

  it("Madde 6 — Observation'a fiziksel DELETE denemesi, bağlı fotoğraf varken FOREIGN KEY RESTRICT ile engellenir", async () => {
    // Uygulama zaten hiçbir zaman fiziksel DELETE kullanmıyor (soft-delete
    // her yerde) — bu test, RESTRICT'in gerçekten DB seviyesinde bir
    // güvenlik ağı olarak çalıştığını, executor'a doğrudan ham SQL ile
    // (repository katmanını bilerek atlayarak) kanıtlıyor.
    const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
    setDatabaseExecutorProviderForTesting(async () => executor);

    const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
    const observation = await observationRepository.create({
      parcelId: parcel.id,
      treeId: null,
      observationType: "general",
      observedAt: "2026-01-01T00:00:00.000Z",
    });
    await photoRepository.create({ observationId: observation.id, filePath: "/data/photos/1.jpg" });

    await expect(
      executor.run(`DELETE FROM observations WHERE id = ?`, [observation.id])
    ).rejects.toThrow();
  });

  it("deactivate() sonrası listByObservation() bu fotoğrafı göstermez", async () => {
    const { observationId } = await createTestChain();
    const photo = await photoRepository.create({ observationId, filePath: "/data/photos/1.jpg" });

    await photoRepository.deactivate(photo.id);

    const list = await photoRepository.listByObservation(observationId);
    expect(list).toHaveLength(0);
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await photoRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });
});
