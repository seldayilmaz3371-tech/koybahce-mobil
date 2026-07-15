import { describe, expect, it } from "vitest";
import { mapSqliteError } from "./mapSqliteError";
import { ErrorCode } from "./errorCodes";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../data/db/migrations/schema";
import { parcelRepository } from "../../modules/parcels/data/parcel.repository";
import { treeRepository } from "../../modules/trees/data/tree.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

/**
 * Bu testler, mapSqliteError'ı SAHTE (elle yazılmış) hata mesajlarıyla
 * DEĞİL, repository katmanının gerçekten fırlattığı gerçek hatalarla
 * doğruluyor — desenlerin gerçek hayatta işe yaradığını kanıtlıyor.
 */
describe("mapSqliteError", () => {
  it("bilinmeyen bir hatayı SYS_001'e eşler", () => {
    expect(mapSqliteError(new Error("beklenmedik bir şey"))).toBe(ErrorCode.SYS_001);
  });

  it("string olmayan bir fırlatmayı da güvenle ele alır", () => {
    expect(mapSqliteError("ham string hata")).toBe(ErrorCode.SYS_001);
  });

  it("gerçek CHECK kısıtı ihlalini DB_003'e eşler", async () => {
    const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
    setDatabaseExecutorProviderForTesting(async () => executor);
    try {
      try {
        await parcelRepository.create({
          name: "Test",
          // @ts-expect-error - bilerek geçersiz enum-kod deneniyor
          cropType: "gecersiz-kod",
          areaDekar: 1,
        });
        expect.unreachable("CHECK kısıtı ihlali bekleniyordu");
      } catch (error) {
        expect(mapSqliteError(error)).toBe(ErrorCode.DB_003);
      }
    } finally {
      resetDatabaseExecutorProviderForTesting();
    }
  });

  it("gerçek UNIQUE kısıtı ihlalini DB_004'e eşler", async () => {
    const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
    setDatabaseExecutorProviderForTesting(async () => executor);
    try {
      const parcel = await parcelRepository.create({ name: "P", cropType: "olive", areaDekar: 1 });
      await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Gemlik" });
      try {
        await treeRepository.create({ parcelId: parcel.id, treeNumber: "A-1", variety: "Ayvalık" });
        expect.unreachable("UNIQUE kısıtı ihlali bekleniyordu");
      } catch (error) {
        expect(mapSqliteError(error)).toBe(ErrorCode.DB_004);
      }
    } finally {
      resetDatabaseExecutorProviderForTesting();
    }
  });

  it("gerçek FOREIGN KEY kısıtı ihlalini DB_005'e eşler (ADR 0022)", async () => {
    const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
    setDatabaseExecutorProviderForTesting(async () => executor);
    try {
      try {
        await treeRepository.create({
          parcelId: "var-olmayan-parsel",
          treeNumber: "A-1",
          variety: "Gemlik",
        });
        expect.unreachable("FOREIGN KEY kısıtı ihlali bekleniyordu");
      } catch (error) {
        expect(mapSqliteError(error)).toBe(ErrorCode.DB_005);
      }
    } finally {
      resetDatabaseExecutorProviderForTesting();
    }
  });
});
