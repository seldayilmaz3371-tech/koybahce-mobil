/**
 * ParcelRepository Testleri
 * ============================
 * bkz. docs/adr/0018-test-stratejisi.md
 *
 * Test şeması, `SCHEMA_MIGRATIONS`'daki GERÇEK SQL ifadelerinden
 * türetiliyor (kopyalanmıyor) — bu sayede test şeması ile üretim
 * şeması arasında asla sapma (drift) riski olmaz (Kural 8).
 *
 * KAPSAM: Bu testler SQL sorgu doğruluğunu ve repository iş mantığını
 * doğrular. Native şifreleme/Capacitor köprüsü kapsam DIŞINDA (ADR
 * 0018) — o, gerçek Android cihaz testiyle doğrulanır.
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "./parcel.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("ParcelRepository", () => {
  it("create() sonrası list() ile aynı parseli döndürür", async () => {
    const created = await parcelRepository.create({
      name: "Zeytin Parseli",
      cropType: "olive",
      areaDekar: 12.5,
    });

    const list = await parcelRepository.list();

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: created.id,
      name: "Zeytin Parseli",
      cropType: "olive",
      areaDekar: 12.5,
      isActive: true,
    });
  });

  it("getById() var olmayan id için null döner", async () => {
    const result = await parcelRepository.getById("olmayan-id");
    expect(result).toBeNull();
  });

  it("update() sadece verilen alanları değiştirir, diğerlerini korur", async () => {
    const created = await parcelRepository.create({
      name: "Sebze Parseli",
      cropType: "vegetable",
      areaDekar: 5,
      soilType: "Killi",
    });

    await parcelRepository.update(created.id, { areaDekar: 7.5 });

    const updated = await parcelRepository.getById(created.id);
    expect(updated?.areaDekar).toBe(7.5);
    expect(updated?.name).toBe("Sebze Parseli"); // değişmemeli
    expect(updated?.soilType).toBe("Killi"); // değişmemeli
  });

  it("update() boş değişiklik setinde SQL çalıştırmaz ve hata fırlatmaz", async () => {
    const created = await parcelRepository.create({
      name: "Test Parseli",
      cropType: "fruit",
      areaDekar: 3,
    });

    await expect(parcelRepository.update(created.id, {})).resolves.toBeUndefined();
  });

  it("deactivate() sonrası varsayılan list() bu parseli göstermez", async () => {
    const created = await parcelRepository.create({
      name: "Pasife Alınacak",
      cropType: "olive",
      areaDekar: 2,
    });

    await parcelRepository.deactivate(created.id);

    const activeList = await parcelRepository.list();
    expect(activeList).toHaveLength(0);

    const allList = await parcelRepository.list({ activeOnly: false });
    expect(allList).toHaveLength(1);
    expect(allList[0].isActive).toBe(false);
  });

  it("list() varsayılan olarak 50 kayıtla sınırlıdır (sayfalama)", async () => {
    for (let i = 0; i < 55; i++) {
      await parcelRepository.create({
        name: `Parsel ${i}`,
        cropType: "olive",
        areaDekar: 1,
      });
    }

    const firstPage = await parcelRepository.list();
    expect(firstPage).toHaveLength(50);

    const secondPage = await parcelRepository.list({ offset: 50 });
    expect(secondPage).toHaveLength(5);
  });

  it("list({ search }) sadece adı eşleşen parselleri döndürür (büyük/küçük harf duyarsız)", async () => {
    await parcelRepository.create({ name: "Kuzey Zeytinliği", cropType: "olive", areaDekar: 4 });
    await parcelRepository.create({ name: "Güney Sebze Bahçesi", cropType: "vegetable", areaDekar: 2 });

    const results = await parcelRepository.list({ search: "zeytin" });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Kuzey Zeytinliği");
  });

  it("crop_type CHECK kısıtı geçersiz bir kodu reddeder", async () => {
    // Repository katmanını atlayıp doğrudan geçersiz bir SQL denemesi —
    // ADR 0017'nin veritabanı seviyesindeki garantisini doğrular.
    const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
    await expect(
      executor.run(
        `INSERT INTO parcels (id, name, crop_type, area_dekar, is_active, created_at, updated_at)
         VALUES ('x', 'Geçersiz', 'Zeytin', 1, 1, '2026-01-01', '2026-01-01')`
      )
    ).rejects.toThrow();
  });
});
