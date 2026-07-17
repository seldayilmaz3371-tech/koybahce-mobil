/**
 * MaintenancePlanRepository Testleri
 * =====================================
 * bkz. Module 5 Technical Blueprint (Sprint 5.4).
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
import { maintenancePlanRepository } from "./maintenancePlan.repository";
import { MaintenanceType } from "../domain/maintenance.types";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createTestParcelAndTree(): Promise<{ parcelId: string; treeId: string }> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  return { parcelId: parcel.id, treeId: tree.id };
}

describe("MaintenancePlanRepository — Temel CRUD", () => {
  it("create() sonrası getById() ile aynı kaydı döndürür", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });

    const found = await maintenancePlanRepository.getById(created.id);

    expect(found).toMatchObject({
      maintenanceType: "irrigation",
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
  });

  it("treeId olmadan (isteğe bağlı) plan oluşturulabilir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenancePlanRepository.create({
        parcelId,
        maintenanceType: MaintenanceType.Fertilization,
        intervalDays: 30,
        nextDueDate: "2026-05-01T00:00:00.000Z",
      })
    ).resolves.toMatchObject({ treeId: null });
  });

  it("deactivate() sonrası listByParcel() bu planı göstermez", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Pruning,
      intervalDays: 90,
      nextDueDate: "2026-06-01T00:00:00.000Z",
    });

    await maintenancePlanRepository.deactivate(created.id);

    const list = await maintenancePlanRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });

  it("update() sadece verilen alanları değiştirir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });

    await maintenancePlanRepository.update(created.id, { intervalDays: 14 });

    const updated = await maintenancePlanRepository.getById(created.id);
    expect(updated?.intervalDays).toBe(14);
    expect(updated?.maintenanceType).toBe("irrigation"); // değişmemeli
  });
});

describe("MaintenancePlanRepository — Dual-Scope", () => {
  it("listByParcel() TÜM planları döndürür — ağaca özel olanlar DAHİL", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    await maintenancePlanRepository.create({
      parcelId,
      treeId,
      maintenanceType: MaintenanceType.Pesticide,
      intervalDays: 14,
      nextDueDate: "2026-04-05T00:00:00.000Z",
    });

    const list = await maintenancePlanRepository.listByParcel(parcelId);

    expect(list).toHaveLength(2);
  });

  it("listByTree() SADECE o ağaca bağlı planları döndürür", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    await maintenancePlanRepository.create({
      parcelId,
      treeId,
      maintenanceType: MaintenanceType.Pesticide,
      intervalDays: 14,
      nextDueDate: "2026-04-05T00:00:00.000Z",
    });

    const list = await maintenancePlanRepository.listByTree(treeId);

    expect(list).toHaveLength(1);
    expect(list[0].maintenanceType).toBe("pesticide");
  });
});

describe("MaintenancePlanRepository — Sıralama ve Sayfalama", () => {
  it("planlar en YAKIN next_due_date önce sıralanır (ASC — kayıtların DESC'inden bilinçli farklı)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-06-01T00:00:00.000Z",
    });
    await maintenancePlanRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-03-01T00:00:00.000Z",
    });

    const list = await maintenancePlanRepository.listByParcel(parcelId);

    // En YAKIN (en erken) tarih önce — "yaklaşan işler" mantığına
    // doğal olarak hazır (gerçek görünüm Sprint 5.5'te).
    expect(list.map((p) => p.nextDueDate)).toEqual([
      "2026-03-01T00:00:00.000Z",
      "2026-06-01T00:00:00.000Z",
    ]);
  });

  it("list({ limit, offset }) sayfalamayı destekler", async () => {
    const { parcelId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await maintenancePlanRepository.create({
        parcelId,
        maintenanceType: MaintenanceType.Irrigation,
        intervalDays: 7,
        nextDueDate: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const firstPage = await maintenancePlanRepository.listByParcel(parcelId);
    expect(firstPage).toHaveLength(50);

    const secondPage = await maintenancePlanRepository.listByParcel(parcelId, { offset: 50 });
    expect(secondPage).toHaveLength(5);
  });
});

describe("MaintenancePlanRepository — Veri Bütünlüğü (CHECK/FOREIGN KEY)", () => {
  it("maintenance_type CHECK kısıtı geçersiz bir kodu reddeder", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenancePlanRepository.create({
        parcelId,
        // @ts-expect-error - bilerek geçersiz bir tip deneniyor
        maintenanceType: "gecersiz",
        intervalDays: 7,
        nextDueDate: "2026-04-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir parcelId ile plan oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir (ADR 0022)", async () => {
    await expect(
      maintenancePlanRepository.create({
        parcelId: "var-olmayan-parsel",
        maintenanceType: MaintenanceType.Irrigation,
        intervalDays: 7,
        nextDueDate: "2026-04-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir treeId ile plan oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenancePlanRepository.create({
        parcelId,
        treeId: "var-olmayan-agac",
        maintenanceType: MaintenanceType.Irrigation,
        intervalDays: 7,
        nextDueDate: "2026-04-01T00:00:00.000Z",
      })
    ).rejects.toThrow();
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await maintenancePlanRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });
});

describe("MaintenancePlanRepository — Integration Test (Parsel→Ağaç→Plan Tam Zincir)", () => {
  it("gerçekçi bir saha akışı: parsel geneli + ağaç-özel plan birlikte, pasife alma sonrası kalıcılık", async () => {
    const parcel = await parcelRepository.create({ name: "Plan Parseli", cropType: "olive", areaDekar: 8 });
    const tree = await treeRepository.create({
      parcelId: parcel.id,
      treeNumber: "P-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });

    const parcelPlan = await maintenancePlanRepository.create({
      parcelId: parcel.id,
      maintenanceType: MaintenanceType.Irrigation,
      intervalDays: 7,
      nextDueDate: "2026-04-01T00:00:00.000Z",
    });
    const treePlan = await maintenancePlanRepository.create({
      parcelId: parcel.id,
      treeId: tree.id,
      maintenanceType: MaintenanceType.Pruning,
      intervalDays: 180,
      nextDueDate: "2026-11-01T00:00:00.000Z",
    });

    const parcelHistory = await maintenancePlanRepository.listByParcel(parcel.id);
    expect(parcelHistory).toHaveLength(2);

    const treeHistory = await maintenancePlanRepository.listByTree(tree.id);
    expect(treeHistory).toHaveLength(1);
    expect(treeHistory[0].id).toBe(treePlan.id);

    await maintenancePlanRepository.deactivate(parcelPlan.id);
    const afterDeactivate = await maintenancePlanRepository.listByParcel(parcel.id);
    expect(afterDeactivate).toHaveLength(1);
    expect(afterDeactivate[0].id).toBe(treePlan.id);

    // Ağaç (Modül 2) hiç etkilenmemeli.
    const treeStillExists = await treeRepository.getById(tree.id);
    expect(treeStillExists?.isActive).toBe(true);
  });
});
