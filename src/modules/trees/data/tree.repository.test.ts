/**
 * TreeRepository Testleri
 * =========================
 * bkz. docs/adr/0018-test-stratejisi.md, docs/repository-contract-matrix.md
 *
 * Test şeması SCHEMA_MIGRATIONS'daki gerçek SQL'den türetiliyor —
 * bu, Sürüm 3'te eklenen UNIQUE(parcel_id, tree_number) kısıtını da
 * otomatik olarak kapsıyor.
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
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
