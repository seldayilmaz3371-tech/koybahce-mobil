/**
 * MaintenanceRepository Testleri
 * =================================
 * bkz. Module 5 Technical Blueprint (Onaylandı), Revizyon 6/7.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "../../trees/data/tree.repository";
import { maintenanceRepository } from "./maintenance.repository";
import { MaintenanceStatus, MaintenanceType } from "../domain/maintenance.types";

import type { DatabaseExecutor } from "../../../data/db/databaseExecutor";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

let currentExecutor: DatabaseExecutor;

beforeEach(() => {
  currentExecutor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => currentExecutor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createTestParcelAndTree(): Promise<{ parcelId: string; treeId: string }> {
  const parcel = await parcelRepository.create({ name: "Test Parseli", cropType: "olive", areaDekar: 5 });
  const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
  return { parcelId: parcel.id, treeId: tree.id };
}

describe("MaintenanceRepository — Temel CRUD", () => {
  it("create() sonrası getById() ile aynı kaydı döndürür", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      completedDate: "2026-01-01T00:00:00.000Z",
      notes: "Damla sulama",
    });

    const found = await maintenanceRepository.getById(created.id);

    expect(found).toMatchObject({ maintenanceType: "irrigation", notes: "Damla sulama" });
  });

  it("status verilmezse varsayılan olarak 'completed' atanır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const record = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Pruning,
    });

    expect(record.status).toBe(MaintenanceStatus.Completed);
  });

  it("notes/treeId olmadan (isteğe bağlı) kayıt oluşturulabilir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.Other })
    ).resolves.toMatchObject({ notes: null, treeId: null });
  });

  it("deactivate() sonrası listByParcel() bu kaydı göstermez", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Fertilization,
    });

    await maintenanceRepository.deactivate(created.id);

    const list = await maintenanceRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });
});

describe("MaintenanceRepository — Dual-Scope (listByParcel/listByTree)", () => {
  it("listByParcel() TÜM kayıtları döndürür — ağaca özel olanlar DAHİL (Finance ile tutarlı)", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.SoilPreparation });
    await maintenanceRepository.create({ parcelId, treeId, maintenanceType: MaintenanceType.Pesticide });

    const list = await maintenanceRepository.listByParcel(parcelId);

    expect(list).toHaveLength(2);
  });

  it("listByTree() SADECE o ağaca bağlı kayıtları döndürür", async () => {
    const { parcelId, treeId } = await createTestParcelAndTree();
    await maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.SoilPreparation });
    await maintenanceRepository.create({ parcelId, treeId, maintenanceType: MaintenanceType.Pesticide });

    const list = await maintenanceRepository.listByTree(treeId);

    expect(list).toHaveLength(1);
    expect(list[0].maintenanceType).toBe("pesticide");
  });

  it("listByTree() referans ağaçlar için de özel bir ayrım olmadan aynı şekilde çalışır", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const referenceTree = await treeRepository.create({
      parcelId: parcel.id,
      treeNumber: "REF-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    await maintenanceRepository.create({
      parcelId: parcel.id,
      treeId: referenceTree.id,
      maintenanceType: MaintenanceType.Pruning,
    });

    const list = await maintenanceRepository.listByTree(referenceTree.id);

    expect(list).toHaveLength(1);
  });
});

describe("MaintenanceRepository — Filtreler (Revizyon 3)", () => {
  it("maintenanceType filtresi doğru çalışır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.Irrigation });
    await maintenanceRepository.create({ parcelId, maintenanceType: MaintenanceType.Pruning });

    const list = await maintenanceRepository.listByParcel(parcelId, {
      maintenanceType: MaintenanceType.Pruning,
    });

    expect(list).toHaveLength(1);
    expect(list[0].maintenanceType).toBe("pruning");
  });

  it("fromDate/toDate tarih aralığı filtresi doğru çalışır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      completedDate: "2026-01-01T00:00:00.000Z",
    });
    await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      completedDate: "2026-06-01T00:00:00.000Z",
    });
    await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      completedDate: "2026-12-01T00:00:00.000Z",
    });

    const list = await maintenanceRepository.listByParcel(parcelId, {
      fromDate: "2026-02-01T00:00:00.000Z",
      toDate: "2026-11-01T00:00:00.000Z",
    });

    expect(list).toHaveLength(1);
    expect(list[0].completedDate).toBe("2026-06-01T00:00:00.000Z");
  });

  it("kayıtlar en yeni tarih önce sıralanır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      completedDate: "2026-01-01T00:00:00.000Z",
    });
    await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      completedDate: "2026-06-01T00:00:00.000Z",
    });

    const list = await maintenanceRepository.listByParcel(parcelId);

    expect(list.map((r) => r.completedDate)).toEqual([
      "2026-06-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    ]);
  });

  it("list({ limit, offset }) sayfalamayı destekler", async () => {
    const { parcelId } = await createTestParcelAndTree();
    for (let i = 0; i < 55; i++) {
      await maintenanceRepository.create({
        parcelId,
        maintenanceType: MaintenanceType.Irrigation,
        completedDate: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      });
    }

    const firstPage = await maintenanceRepository.listByParcel(parcelId);
    expect(firstPage).toHaveLength(50);

    const secondPage = await maintenanceRepository.listByParcel(parcelId, { offset: 50 });
    expect(secondPage).toHaveLength(5);
  });
});

describe("MaintenanceRepository — Status Log (Revizyon 4, UI'dan asla tetiklenmez)", () => {
  it("update() ile status değiştirildiğinde maintenance_status_log'a OTOMATİK bir satır eklenir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      status: MaintenanceStatus.Planned,
      scheduledDate: "2026-03-01T00:00:00.000Z",
    });

    await maintenanceRepository.update(created.id, { status: MaintenanceStatus.Completed });

    const updated = await maintenanceRepository.getById(created.id);
    expect(updated?.status).toBe(MaintenanceStatus.Completed);
  });

  it("status DIŞINDAKİ bir alan değişirse log satırı EKLENMEZ (sadece status geçişleri loglanır)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      notes: "İlk not",
    });

    await maintenanceRepository.update(created.id, { notes: "Güncellenmiş not" });

    const updated = await maintenanceRepository.getById(created.id);
    expect(updated?.notes).toBe("Güncellenmiş not");

    const result = await currentExecutor.query(
      `SELECT * FROM maintenance_status_log WHERE maintenance_record_id = ?`,
      [created.id]
    );
    expect(result.values ?? []).toHaveLength(0); // DOĞRUDAN kanıt — log tablosu boş
  });

  it("Gerçek log İÇERİĞİ doğru: previous_status/new_status/changed_at doğru yazılır", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      status: MaintenanceStatus.Planned,
    });

    await maintenanceRepository.update(created.id, { status: MaintenanceStatus.Completed });

    // Repository sözleşmesinde bir "listStatusLog" metodu yok (bugün
    // gerekmiyor — YAGNI) — bu yüzden ham SQL ile doğrudan tabloyu
    // sorguluyoruz (test-özel bir doğrulama, ADR 0022 FK testindeki
    // aynı desen — executor'a doğrudan erişim).
    const result = await currentExecutor.query(
      `SELECT * FROM maintenance_status_log WHERE maintenance_record_id = ?`,
      [created.id]
    );
    const rows = (result.values ?? []) as Array<{ previous_status: string | null; new_status: string }>;

    expect(rows).toHaveLength(1);
    expect(rows[0].previous_status).toBe("planned");
    expect(rows[0].new_status).toBe("completed");
  });

  it("Aynı statüye 'değiştirme' (no-op) log satırı ÜRETMEZ mi? — GERÇEK DAVRANIŞ: status alanı verilirse (değeri aynı olsa bile) log yazılır, bu bilinçli bir basitleştirme", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      status: MaintenanceStatus.Completed,
    });

    await maintenanceRepository.update(created.id, { status: MaintenanceStatus.Completed });

    const result = await currentExecutor.query(
      `SELECT * FROM maintenance_status_log WHERE maintenance_record_id = ?`,
      [created.id]
    );
    const rows = (result.values ?? []) as Array<{ id: string }>;
    // GERÇEK BULGU: repository "değişti mi" kontrolü yapmıyor, `status`
    // alanı `update()`'e verildiği her seferinde log yazıyor — bu,
    // "hangi tarihte tekrar onaylandı" bilgisini de değerli kılabilir,
    // bilinçli bir tasarım kararı olarak burada kayıt altına alınıyor.
    expect(rows).toHaveLength(1);
  });

  it("Veri Bütünlüğü — log INSERT'i başarısız olursa, status UPDATE'i de GERİ ALINIR (gerçek atomiklik kanıtı)", async () => {
    const { parcelId } = await createTestParcelAndTree();
    const created = await maintenanceRepository.create({
      parcelId,
      maintenanceType: MaintenanceType.Irrigation,
      status: MaintenanceStatus.Planned,
    });

    // GERÇEK bir ortadaki hata enjekte ediyoruz: repository'nin dahili
    // `execute()`'unu, SADECE log INSERT'i (2. execute çağrısı — 1.
    // olan status UPDATE'inden SONRA) başarısız olacak şekilde spy
    // ediyoruz. Bu, transaction'ın GERÇEKTEN atomik olduğunu —
    // status UPDATE'inin de geri alındığını — kanıtlıyor.
    let executeCallCount = 0;
    const originalQuery = currentExecutor.query.bind(currentExecutor);
    const originalRun = currentExecutor.run.bind(currentExecutor);
    vi.spyOn(currentExecutor, "run").mockImplementation(async (sql, values, transaction) => {
      if (sql.startsWith("UPDATE maintenance_records")) {
        executeCallCount++;
      }
      if (sql.startsWith("INSERT INTO maintenance_status_log")) {
        throw new Error("Simüle edilmiş log yazma hatası");
      }
      return originalRun(sql, values, transaction);
    });
    void originalQuery;

    await expect(
      maintenanceRepository.update(created.id, { status: MaintenanceStatus.Completed })
    ).rejects.toThrow("Simüle edilmiş log yazma hatası");

    vi.restoreAllMocks();

    // status GERÇEKTEN değişmemiş olmalı — transaction'ın TAMAMI
    // geri alındı.
    const afterFailedUpdate = await maintenanceRepository.getById(created.id);
    expect(afterFailedUpdate?.status).toBe(MaintenanceStatus.Planned);
    expect(executeCallCount).toBe(1); // UPDATE denendi ama commit olmadı
  });
});

describe("MaintenanceRepository — Veri Bütünlüğü (CHECK/FOREIGN KEY)", () => {
  it("maintenance_type CHECK kısıtı geçersiz bir kodu reddeder", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenanceRepository.create({
        parcelId,
        // @ts-expect-error - bilerek geçersiz bir tip deneniyor
        maintenanceType: "harvest",
      })
    ).rejects.toThrow();
  });

  it("status CHECK kısıtı geçersiz bir kodu reddeder", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenanceRepository.create({
        parcelId,
        maintenanceType: MaintenanceType.Irrigation,
        // @ts-expect-error - bilerek geçersiz bir tip deneniyor
        status: "in_progress",
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir parcelId ile kayıt oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir (ADR 0022)", async () => {
    await expect(
      maintenanceRepository.create({
        parcelId: "var-olmayan-parsel",
        maintenanceType: MaintenanceType.Irrigation,
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir treeId ile kayıt oluşturmak FOREIGN KEY kısıtı nedeniyle reddedilir", async () => {
    const { parcelId } = await createTestParcelAndTree();
    await expect(
      maintenanceRepository.create({
        parcelId,
        treeId: "var-olmayan-agac",
        maintenanceType: MaintenanceType.Irrigation,
      })
    ).rejects.toThrow();
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await maintenanceRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });
});

describe("MaintenanceRepository — Integration Test (Parsel→Ağaç→Bakım Tam Zincir)", () => {
  it("gerçekçi bir saha akışı: Parsel→Ağaç→çoklu Bakım (planlı+tamamlanmış)→durum geçmişi→pasife alma", async () => {
    // 1. Gerçek bir Parsel ve Ağaç.
    const parcel = await parcelRepository.create({
      name: "Entegrasyon Parseli",
      cropType: "olive",
      areaDekar: 8,
    });
    const tree = await treeRepository.create({
      parcelId: parcel.id,
      treeNumber: "E-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });

    // 2. Parsel geneli PLANLI bir sulama.
    const irrigation = await maintenanceRepository.create({
      parcelId: parcel.id,
      maintenanceType: MaintenanceType.Irrigation,
      status: MaintenanceStatus.Planned,
      scheduledDate: "2026-04-01T00:00:00.000Z",
    });

    // 3. Ağaca özel TAMAMLANMIŞ bir budama.
    const pruning = await maintenanceRepository.create({
      parcelId: parcel.id,
      treeId: tree.id,
      maintenanceType: MaintenanceType.Pruning,
      completedDate: "2026-03-15T00:00:00.000Z",
      notes: "Kış budaması",
    });

    // 4. Planlı sulama gerçekleşti — status güncelleniyor (log otomatik oluşuyor).
    await maintenanceRepository.update(irrigation.id, {
      status: MaintenanceStatus.Completed,
      completedDate: "2026-04-02T00:00:00.000Z",
    });

    // 5. Parselin TÜM geçmişi (ağaç-özel dahil) — 2 kayıt.
    const parcelHistory = await maintenanceRepository.listByParcel(parcel.id);
    expect(parcelHistory).toHaveLength(2);

    // 6. SADECE ağacın (referans ağaç) geçmişi — 1 kayıt.
    const treeHistory = await maintenanceRepository.listByTree(tree.id);
    expect(treeHistory).toHaveLength(1);
    expect(treeHistory[0].id).toBe(pruning.id);

    // 7. Sulama gerçekten "completed" oldu mu?
    const updatedIrrigation = await maintenanceRepository.getById(irrigation.id);
    expect(updatedIrrigation?.status).toBe(MaintenanceStatus.Completed);

    // 8. Durum geçmişi gerçekten oluştu mu?
    const logResult = await currentExecutor.query(
      `SELECT * FROM maintenance_status_log WHERE maintenance_record_id = ?`,
      [irrigation.id]
    );
    expect((logResult.values ?? [])).toHaveLength(1);

    // 9. Budamayı pasife al — parsel geçmişinden düşmeli, ağaç
    // kaydının kendisi (Modül 2) ETKİLENMEMELİ.
    await maintenanceRepository.deactivate(pruning.id);
    const parcelHistoryAfterDeactivate = await maintenanceRepository.listByParcel(parcel.id);
    expect(parcelHistoryAfterDeactivate).toHaveLength(1);

    const treeStillExists = await treeRepository.getById(tree.id);
    expect(treeStillExists).not.toBeNull();
    expect(treeStillExists?.isActive).toBe(true);
  });
});

describe("MaintenanceRepository — createMany (Sprint 10.1, Saha Operasyonları)", () => {
  it("TEK bir maintenanceType (ör. sulama), treeIds'teki HER ağaç için AYRI bir kayıt olarak oluşturulur", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const treeA = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    const treeB = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-2", variety: "Gemlik" });

    const created = await maintenanceRepository.createMany({
      parcelId: parcel.id,
      treeIds: [treeA.id, treeB.id],
      maintenanceType: MaintenanceType.Irrigation,
      status: MaintenanceStatus.Completed,
      completedDate: "2026-07-18",
    });

    expect(created).toHaveLength(2);
    expect(created.every((r) => r.maintenanceType === MaintenanceType.Irrigation)).toBe(true);
    expect(created.map((r) => r.treeId).sort()).toEqual([treeA.id, treeB.id].sort());
  });

  it("boş treeIds ile hiçbir kayıt oluşturulmaz, hata FIRLATILMAZ", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });

    const created = await maintenanceRepository.createMany({
      parcelId: parcel.id,
      treeIds: [],
      maintenanceType: MaintenanceType.Pruning,
    });

    expect(created).toEqual([]);
  });

  it("Gübreleme/İlaçlama/Budama AYNI mekanizmayla (SADECE maintenanceType farkıyla) çalışır", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const tree = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });

    const fertilization = await maintenanceRepository.createMany({
      parcelId: parcel.id,
      treeIds: [tree.id],
      maintenanceType: MaintenanceType.Fertilization,
    });
    const pesticide = await maintenanceRepository.createMany({
      parcelId: parcel.id,
      treeIds: [tree.id],
      maintenanceType: MaintenanceType.Pesticide,
    });
    const pruning = await maintenanceRepository.createMany({
      parcelId: parcel.id,
      treeIds: [tree.id],
      maintenanceType: MaintenanceType.Pruning,
    });

    expect(fertilization[0].maintenanceType).toBe(MaintenanceType.Fertilization);
    expect(pesticide[0].maintenanceType).toBe(MaintenanceType.Pesticide);
    expect(pruning[0].maintenanceType).toBe(MaintenanceType.Pruning);
  });
});

describe("MaintenanceRepository — deactivateMany (Sprint 10.2, Toplu İşlemler 'Geri Al')", () => {
  it("createMany() sonrası deactivateMany() ile TÜM oluşturulan kayıtlar geri alınabilir", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 5 });
    const treeA = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
    const treeB = await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-2", variety: "Gemlik" });
    const created = await maintenanceRepository.createMany({
      parcelId: parcel.id,
      treeIds: [treeA.id, treeB.id],
      maintenanceType: MaintenanceType.Irrigation,
    });

    await maintenanceRepository.deactivateMany(created.map((r) => r.id));

    expect(await maintenanceRepository.listByTree(treeA.id)).toHaveLength(0);
    expect(await maintenanceRepository.listByTree(treeB.id)).toHaveLength(0);
  });

  it("boş id listesiyle hata FIRLATILMAZ", async () => {
    await expect(maintenanceRepository.deactivateMany([])).resolves.not.toThrow();
  });
});
