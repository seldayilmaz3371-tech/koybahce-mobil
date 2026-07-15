/**
 * TreeRepository Testleri
 * =========================
 * bkz. docs/adr/0018-test-stratejisi.md, docs/repository-contract-matrix.md
 *
 * Test şeması SCHEMA_MIGRATIONS'daki gerçek SQL'den türetiliyor —
 * bu, Sürüm 3'te eklenen UNIQUE(parcel_id, tree_number) kısıtını da
 * otomatik olarak kapsıyor.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "./tree.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

/** Testler bir ağaç oluşturmadan önce geçerli bir parsel gerektiriyor (uygulama-seviyesi bütünlük — bkz. ADR 0022). */
async function createTestParcel(): Promise<string> {
  const parcel = await parcelRepository.create({
    name: "Test Parseli",
    cropType: "olive",
    areaDekar: 5,
  });
  return parcel.id;
}

describe("TreeRepository", () => {
  it("create() sonrası listByParcel() ile aynı ağacı döndürür", async () => {
    const parcelId = await createTestParcel();
    const created = await treeRepository.create({
      parcelId,
      treeNumber: "A-1",
      variety: "Gemlik",
    });

    const list = await treeRepository.listByParcel(parcelId);

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: created.id,
      treeNumber: "A-1",
      variety: "Gemlik",
      isReferenceTree: false,
      isActive: true,
    });
  });

  it("listByParcel() sadece o parsele ait ağaçları döndürür (başka parselin ağacını sızdırmaz)", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelB, treeNumber: "B-1", variety: "Ayvalık" });

    const listA = await treeRepository.listByParcel(parcelA);

    expect(listA).toHaveLength(1);
    expect(listA[0].treeNumber).toBe("A-1");
  });

  it("listReferenceTrees() sadece is_reference_tree=1 olan, TÜM parsellerdeki ağaçları döndürür", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({
      parcelId: parcelA,
      treeNumber: "A-1",
      variety: "Gemlik",
      isReferenceTree: true,
    });
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-2", variety: "Gemlik" });
    await treeRepository.create({
      parcelId: parcelB,
      treeNumber: "B-1",
      variety: "Ayvalık",
      isReferenceTree: true,
    });

    const referenceTrees = await treeRepository.listReferenceTrees();

    expect(referenceTrees).toHaveLength(2);
    expect(referenceTrees.every((t) => t.isReferenceTree)).toBe(true);
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await treeRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });

  it("update() parcelId'yi değiştiremez (TreeUpdateInput'ta bilerek yok) ve sadece verilen alanları günceller", async () => {
    const parcelId = await createTestParcel();
    const created = await treeRepository.create({
      parcelId,
      treeNumber: "A-1",
      variety: "Gemlik",
    });

    await treeRepository.update(created.id, { variety: "Ayvalık" });

    const updated = await treeRepository.getById(created.id);
    expect(updated?.variety).toBe("Ayvalık");
    expect(updated?.treeNumber).toBe("A-1"); // değişmemeli
    expect(updated?.parcelId).toBe(parcelId); // değişmemeli — zaten değiştirilecek alan yok
  });

  it("update() isReferenceTree'yi doğru şekilde 0/1'e çevirir", async () => {
    const parcelId = await createTestParcel();
    const created = await treeRepository.create({
      parcelId,
      treeNumber: "A-1",
      variety: "Gemlik",
      isReferenceTree: false,
    });

    await treeRepository.update(created.id, { isReferenceTree: true });

    const updated = await treeRepository.getById(created.id);
    expect(updated?.isReferenceTree).toBe(true);
  });

  it("deactivate() sonrası listByParcel() bu ağacı göstermez", async () => {
    const parcelId = await createTestParcel();
    const created = await treeRepository.create({
      parcelId,
      treeNumber: "A-1",
      variety: "Gemlik",
    });

    await treeRepository.deactivate(created.id);

    const list = await treeRepository.listByParcel(parcelId);
    expect(list).toHaveLength(0);
  });

  it("countByParcel() aktif ağaç sayısını doğru hesaplar (pasif ağaçları saymaz)", async () => {
    const parcelId = await createTestParcel();
    const tree1 = await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId, treeNumber: "A-2", variety: "Gemlik" });
    await treeRepository.deactivate(tree1.id);

    const count = await treeRepository.countByParcel(parcelId);

    expect(count).toBe(1);
  });

  it("aynı parselde aynı tree_number iki kez oluşturulamaz (Sürüm 3 UNIQUE kısıtı)", async () => {
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });

    await expect(
      treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Ayvalık" })
    ).rejects.toThrow();
  });

  it("pasife alınmış bir tree_number, yeni bir ağaca tekrar verilebilir (UNIQUE kısıtının WHERE is_active=1 kapsamı)", async () => {
    const parcelId = await createTestParcel();
    const first = await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.deactivate(first.id);

    await expect(
      treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Ayvalık" })
    ).resolves.toBeTruthy();
  });

  it("farklı parsellerde aynı tree_number kullanılabilir (kısıt parsel-bazlı)", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-1", variety: "Gemlik" });

    await expect(
      treeRepository.create({ parcelId: parcelB, treeNumber: "A-1", variety: "Ayvalık" })
    ).resolves.toBeTruthy();
  });

  it("ADR 0022: foreign key zorlaması etkin — var olmayan bir parcel_id ile ağaç oluşturmak reddedilir", async () => {
    // Bu test, testDatabaseExecutor'da 'PRAGMA foreign_keys = ON'
    // etkinleştirildikten SONRA yazıldı — gerçek native bağlantıda
    // (connection.ts) da aynı PRAGMA artık çalıştırılıyor (ADR 0022
    // düzeltmesi). Bu test, şema tanımlarımızın (REFERENCES
    // parcels(id)) sözdizimsel olarak doğru olduğunu ve FK zorlaması
    // AÇIKKEN gerçekten çalıştığını kanıtlıyor.
    await expect(
      treeRepository.create({
        parcelId: "var-olmayan-parsel-id",
        treeNumber: "A-1",
        variety: "Gemlik",
      })
    ).rejects.toThrow();
  });
});

describe("TreeRepository.createMany — Sprint 3.10 (Toplu Ağaç Oluşturma)", () => {
  it("başlangıç numarasından ardışık N ağaç oluşturur, hepsi aynı veri modeline sahip", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 10 });

    const created = await treeRepository.createMany({
      parcelId: parcel.id,
      startNumber: 151,
      count: 5,
    });

    expect(created).toHaveLength(5);
    expect(created.map((t) => t.treeNumber)).toEqual(["151", "152", "153", "154", "155"]);
    // Toplu oluşturulan her ağaç, tek-tek oluşturulanla AYNI şekle sahip
    // — özel bir "toplu oluşturuldu" alanı YOK (Dijital Bahçe Hafızası).
    created.forEach((t) => {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("createdAt");
      expect(t.parcelId).toBe(parcel.id);
      expect(t.isActive).toBe(true);
    });
  });

  it("variety verilmezse boş string olarak saklanır (Minimum Dokunuş İlkesi — Tree.variety hâlâ string, asla null)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 10 });

    const created = await treeRepository.createMany({ parcelId: parcel.id, startNumber: 1, count: 3 });

    created.forEach((t) => expect(t.variety).toBe(""));
  });

  it("isReferenceTree true verilirse TÜM partiye uygulanır", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 10 });

    const created = await treeRepository.createMany({
      parcelId: parcel.id,
      startNumber: 1,
      count: 3,
      isReferenceTree: true,
    });

    created.forEach((t) => expect(t.isReferenceTree).toBe(true));
  });

  it("Madde 9 — çakışan numaralar varsa TreeNumberConflictError fırlatır, çakışanları AÇIKÇA listeler", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 10 });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "153", variety: "Gemlik" });

    await expect(
      treeRepository.createMany({ parcelId: parcel.id, startNumber: 151, count: 5 })
    ).rejects.toMatchObject({
      name: "TreeNumberConflictError",
      conflictingNumbers: ["153"],
    });
  });

  it("Madde 9 — çakışma tespit edildiğinde HİÇBİR ağaç oluşturulmaz (ön kontrol, INSERT denenmeden)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 10 });
    await treeRepository.create({ parcelId: parcel.id, treeNumber: "153", variety: "Gemlik" });

    await expect(
      treeRepository.createMany({ parcelId: parcel.id, startNumber: 151, count: 5 })
    ).rejects.toThrow();

    const allTrees = await treeRepository.listByParcel(parcel.id);
    expect(allTrees).toHaveLength(1); // sadece önceden var olan "153"
  });

  it("Veri Bütünlüğü — transaction ORTADA başarısız olursa, ÖNCESİNDE oluşan ağaçlar da geri alınır (gerçek rollback kanıtı)", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 10 });

    // GERÇEK bir ortadaki hata enjekte ediyoruz: `create()`'in 3.
    // çağrısı (5 ağaçlık bir partide) başarısız olacak şekilde spy
    // ediliyor. Bu, transaction'ın gerçekten atomik olduğunu — 1. ve
    // 2. ağaçların da geri alındığını — kanıtlıyor.
    let callCount = 0;
    const originalCreate = treeRepository.create.bind(treeRepository);
    const createSpy = vi.spyOn(treeRepository, "create").mockImplementation(async (input) => {
      callCount++;
      if (callCount === 3) {
        throw new Error("Simüle edilmiş ortadaki hata");
      }
      return originalCreate(input);
    });

    await expect(
      treeRepository.createMany({ parcelId: parcel.id, startNumber: 1, count: 5 })
    ).rejects.toThrow("Simüle edilmiş ortadaki hata");

    createSpy.mockRestore();

    // 1. ve 2. ağaç başarıyla "oluşturulmuştu" ama transaction'ın
    // TAMAMI geri alındığı için veritabanında HİÇBİRİ kalıcı olmamalı.
    const allTrees = await treeRepository.listByParcel(parcel.id);
    expect(allTrees).toHaveLength(0);
  });

  it("Performans — 1000 ağaç makul sürede (test ortamında <2 saniye) ve doğru sayıda oluşturulur", async () => {
    const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 100 });

    const start = Date.now();
    const created = await treeRepository.createMany({ parcelId: parcel.id, startNumber: 1, count: 1000 });
    const durationMs = Date.now() - start;

    expect(created).toHaveLength(1000);
    expect(durationMs).toBeLessThan(2000);

    const allTrees = await treeRepository.listByParcel(parcel.id);
    expect(allTrees).toHaveLength(1000);
  });
});
