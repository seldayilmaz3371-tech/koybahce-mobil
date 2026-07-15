/**
 * useTrees Hook
 * ===============
 *
 * MİMARİ KARAR (Modül 2 Mimari Doğrulaması, 2026-07-14 — Hakem
 * Değerlendirmesi Bulgu 1): Bu hook, `useParcels` ile AYNI ince
 * sarmalayıcı deseniyle yazıldı (Kural 12), ama Ağaç'a özgü tek
 * farkla: iki ayrı çalışma modu destekler. `ParcelsScreen`'in
 * "global sayfalanmış liste" deseni buraya KÖR KOPYALANMADI —
 * gerekçe zaten Mimari Doğrulamasında belgelendi.
 *
 *   1. Parcel Mode ({ mode: "parcel", parcelId }): Belirli bir
 *      parselin ağaçlarını yönetir (`listByParcel`). Sayfalama YOK —
 *      bir parselde onlarca ağaç olması istisnai, gerçek ihtiyaç
 *      doğarsa eklenir (YAGNI).
 *   2. Reference Mode ({ mode: "reference" }): Tüm çiftlik genelinde
 *      referans ağaçları getirir (`listReferenceTrees`) — AI Master
 *      Architecture Bölüm 11 (Fotoğraf Analizi) hazırlığı.
 *
 * AI Tool Calling uyumluluğu ve cache/senkronizasyon genişletilebilirliği
 * gerekçeleri `useParcels`'teki ile aynıdır, burada tekrarlanmıyor.
 */

import { useCallback, useEffect, useState } from "react";
import { treeRepository } from "../data/tree.repository";
import type {
  BulkCreateTreesInput,
  NewTreeInput,
  Tree,
  TreeUpdateInput,
} from "../domain/tree.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

export type UseTreesOptions = { mode: "parcel"; parcelId: string } | { mode: "reference" };

type TreesStatus = "idle" | "loading" | "ready" | "error";

export interface UseTreesResult {
  trees: Tree[];
  status: TreesStatus;
  /** Hata mesajı (varsa) — çevrilmiş metin ÇAĞIRAN bileşende üretilmeli (bkz. Error Handling Standard, bugünkü bilinen boşluk). */
  errorMessage: string | null;
  /** Error Code (varsa) — bkz. docs/error-handling-standard.md. `errorMessage`'ın YANINA eklendi (Sprint 2.6), yerine değil — mevcut davranış değişmedi. */
  errorCode: ErrorCodeValue | null;
  refetch: () => Promise<void>;
  createTree: (input: NewTreeInput) => Promise<void>;
  /**
   * Toplu ağaç oluşturma (Sprint 3.10). `createTree` ile AYNI desen —
   * hata yakalamaz, doğrudan çağırana fırlatır (`TreeNumberConflictError`
   * dahil) — çağıran (BulkTreeCreateForm) kendi try/catch'ini yapar.
   */
  createManyTrees: (input: BulkCreateTreesInput) => Promise<Tree[]>;
  updateTree: (id: string, changes: TreeUpdateInput) => Promise<void>;
  deactivateTree: (id: string) => Promise<void>;
}

export function useTrees(options: UseTreesOptions): UseTreesResult {
  // Bağımlılık dizisinde `options` nesnesinin kendisi değil, ilkel
  // alanları kullanılıyor — çağıran taraf literal bir nesne geçerse
  // referans her render'da değişir, sonsuz döngüyü önlemek için
  // (useParcels ile aynı bilinçli tercih).
  const mode = options.mode;
  const parcelId = options.mode === "parcel" ? options.parcelId : null;

  const [trees, setTrees] = useState<Tree[]>([]);
  const [status, setStatus] = useState<TreesStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);
    try {
      const result =
        mode === "parcel" && parcelId !== null
          ? await treeRepository.listByParcel(parcelId)
          : await treeRepository.listReferenceTrees();
      setTrees(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [mode, parcelId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTree = useCallback(
    async (input: NewTreeInput) => {
      await treeRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const createManyTrees = useCallback(
    async (input: BulkCreateTreesInput) => {
      const created = await treeRepository.createMany(input);
      await refetch();
      return created;
    },
    [refetch]
  );

  const updateTree = useCallback(
    async (id: string, changes: TreeUpdateInput) => {
      await treeRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivateTree = useCallback(
    async (id: string) => {
      await treeRepository.deactivate(id);
      await refetch();
    },
    [refetch]
  );

  return {
    trees,
    status,
    errorMessage,
    errorCode,
    refetch,
    createTree,
    createManyTrees,
    updateTree,
    deactivateTree,
  };
}
