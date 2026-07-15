// @vitest-environment jsdom
/**
 * useTrees Hook Testleri
 * ========================
 * bkz. docs/repository-contract-matrix.md, Modül 2 Mimari Doğrulaması
 *
 * ORTAM NOTU: Bu dosya, dosya-başı `@vitest-environment jsdom`
 * yorumuyla SADECE KENDİSİ için jsdom ortamı kullanıyor — global
 * `vitest.config.ts` hâlâ 'node' (repository testleri için gerekli,
 * bkz. ADR 0018). Bu, üretim/global test yapılandırmasını DEĞİŞTİRMEDEN
 * hook testlerini mümkün kılıyor.
 *
 * TEST STRATEJİSİ: Gerçek repository + gerçek (test) SQLite'a karşı
 * (aynı `createTestDatabaseExecutor`, ParcelRepository/TreeRepository
 * testleriyle aynı desen) — mocking kütüphanesi (ör. vi.mock) YENİ bir
 * test paradigması olarak eklenmedi, var olan altyapı yeniden kullanıldı
 * (Kural 12).
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "../data/tree.repository";
import { useTrees } from "./useTrees";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

async function createTestParcel(): Promise<string> {
  const parcel = await parcelRepository.create({
    name: "Test Parseli",
    cropType: "olive",
    areaDekar: 5,
  });
  return parcel.id;
}

describe("useTrees", () => {
  it("Loading State: mount sonrası hemen 'loading' durumuna geçer", async () => {
    const parcelId = await createTestParcel();

    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId }));

    // refetch()'in senkron kısmı (setStatus('loading')) await'ten önce
    // çalışır — bu yüzden render sonrası hemen gözlemlenebilir olmalı.
    expect(["idle", "loading"]).toContain(result.current.status);
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("Parcel Mode: sadece verilen parselin ağaçlarını getirir", async () => {
    const parcelA = await createTestParcel();
    const parcelB = await createTestParcel();
    await treeRepository.create({ parcelId: parcelA, treeNumber: "A-1", variety: "Gemlik" });
    await treeRepository.create({ parcelId: parcelB, treeNumber: "B-1", variety: "Ayvalık" });

    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId: parcelA }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.trees).toHaveLength(1);
    expect(result.current.trees[0].treeNumber).toBe("A-1");
  });

  it("Reference Mode: tüm parsellerdeki referans ağaçları getirir", async () => {
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

    const { result } = renderHook(() => useTrees({ mode: "reference" }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.trees).toHaveLength(2);
    expect(result.current.trees.every((t) => t.isReferenceTree)).toBe(true);
  });

  it("Empty State: hiç ağaç yoksa boş dizi ve 'ready' durumu döner (hata değil)", async () => {
    const parcelId = await createTestParcel();

    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.trees).toEqual([]);
  });

  it("Refresh davranışı: createTree() sonrası liste otomatik güncellenir", async () => {
    const parcelId = await createTestParcel();
    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.trees).toHaveLength(0);

    await result.current.createTree({ parcelId, treeNumber: "A-1", variety: "Gemlik" });

    await waitFor(() => expect(result.current.trees).toHaveLength(1));
    expect(result.current.trees[0].treeNumber).toBe("A-1");
  });

  it("manuel refetch() liste durumunu yeniden yükler", async () => {
    const parcelId = await createTestParcel();
    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Hook'un dışından, doğrudan repository ile bir kayıt ekleniyor
    // (ör. başka bir ekranın tetiklediği bir değişikliği simüle eder).
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });
    expect(result.current.trees).toHaveLength(0); // hook henüz haberdar değil

    await result.current.refetch();

    await waitFor(() => expect(result.current.trees).toHaveLength(1));
  });

  it("Error State (Yazma Yolu): createTree() hatayı doğrudan çağırana fırlatır, hook status'u DEĞİŞTİRMEZ", async () => {
    // GERÇEK BULGU: useTrees'in mutasyon metodları (createTree/updateTree/
    // deactivateTree) try/catch İÇERMİYOR — bu useParcels ile tutarlı,
    // kasıtlı bir tasarım (sadece refetch/okuma yolu status/errorMessage
    // yönetir; yazma hataları doğrudan çağıran UI'a fırlatılır, UI kendi
    // try/catch'ini yapar — bkz. ParcelForm deseni). Bu test, varsayılan
    // bir davranışı değil, KODUN GERÇEKTE YAPTIĞINI doğruluyor.
    const parcelId = await createTestParcel();
    await treeRepository.create({ parcelId, treeNumber: "A-1", variety: "Gemlik" });

    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId }));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Aynı parselde aynı tree_number — Sürüm 3 UNIQUE kısıtını ihlal eder (gerçek hata, simülasyon değil).
    await expect(
      result.current.createTree({ parcelId, treeNumber: "A-1", variety: "Ayvalık" })
    ).rejects.toThrow();

    // Hook'un okuma-durumu ETKİLENMEDİ — hâlâ 'ready', çünkü hata
    // refetch()'e hiç ulaşmadan createTree() içinde fırlatıldı.
    expect(result.current.status).toBe("ready");
    expect(result.current.errorMessage).toBeNull();
  });

  it("Error State (Okuma Yolu): repository listByParcel() hatası 'error' durumuna ve dolu errorMessage'a yol açar", async () => {
    // Okuma yolunda gerçek bir hata tetiklemek için, hook mount olmadan
    // ÖNCE test veritabanı bağlantısını geçersiz bir sağlayıcıyla
    // değiştiriyoruz — bu, gerçek bir DB bağlantı hatasını simüle eder.
    resetDatabaseExecutorProviderForTesting();
    setDatabaseExecutorProviderForTesting(async () => {
      throw new Error("Test: veritabanı bağlantısı simülasyonu başarısız");
    });

    const { result } = renderHook(() => useTrees({ mode: "parcel", parcelId: "herhangi-bir-id" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toContain("veritabanı bağlantısı simülasyonu başarısız");
  });
});
