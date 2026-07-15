/**
 * useObservations Hook
 * ======================
 *
 * MİMARİ KARAR (Sprint 3.2 Ön Kontrol — kullanıcı onayı 2026-07-15):
 * `useParcels` ile aynı ince sarmalayıcı deseni (Kural 12). İki
 * bilinçli farkla:
 *
 *   1. Dual-scope: `{ mode: "tree", treeId }` (birincil akış — Modül 3
 *      Hedefi: bir ağacın dijital sağlık geçmişi) veya
 *      `{ mode: "parcel", parcelId }` (sadece parsel geneli gözlemler
 *      — `ObservationRepository.listByParcel`'in kendisi zaten ağaç
 *      gözlemlerini hariç tutuyor, bkz. Sprint 3.1).
 *   2. Sayfalama: `useParcels`'teki `hasMore`/`loadMore` deseni
 *      BİREBİR miras alındı (Domain Review onayı — Ağaç'ın DEĞİL).
 *
 * GENİŞLETİLEBİLİRLİK (Sprint 3.2 Mimari Doğrulaması, kod YAZILMADI):
 * `dateFrom`/`dateTo`/`observationType` gibi gelecekteki filtreler,
 * `ParcelListOptions`'ın `search`/`sortBy` ile genişlediği AYNI
 * yöntemle (yeni opsiyonel alan, `refetch`'in bağımlılık dizisine
 * ilkel değer olarak eklenir) eklenecek — bugün eklenmiyor (YAGNI).
 *
 * AI Tool Calling uyumluluğu gerekçesi `useParcels`/`useTrees`'teki
 * ile aynıdır (hook değil, doğrudan repository çağrılır) — burada
 * tekrarlanmıyor.
 */

import { useCallback, useEffect, useState } from "react";
import { observationRepository } from "../data/observation.repository";
import type { ObservationListOptions } from "../data/observation.repository.interface";
import type {
  NewObservationInput,
  Observation,
  ObservationUpdateInput,
} from "../domain/observation.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

export type UseObservationsScope = { mode: "tree"; treeId: string } | { mode: "parcel"; parcelId: string };

type ObservationsStatus = "idle" | "loading" | "ready" | "error";

/** Domain Review'da onaylanan sayfalama eşiği — ParcelRepository'nin DEFAULT_LIST_LIMIT'iyle aynı değer, ayrı bir sabit (modüller arası çapraz bağımlılık kurulmadı — Kural 4). */
const DEFAULT_LIST_LIMIT = 50;

export interface UseObservationsResult {
  observations: Observation[];
  status: ObservationsStatus;
  errorMessage: string | null;
  errorCode: ErrorCodeValue | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createObservation: (input: NewObservationInput) => Promise<void>;
  updateObservation: (id: string, changes: ObservationUpdateInput) => Promise<void>;
  deactivateObservation: (id: string) => Promise<void>;
}

export function useObservations(
  scope: UseObservationsScope,
  options: Pick<ObservationListOptions, "activeOnly" | "limit"> = {}
): UseObservationsResult {
  const { activeOnly, limit } = options;
  const pageSize = limit ?? DEFAULT_LIST_LIMIT;
  // `useTrees`'teki `mode`/`parcelId` ayrıştırma deseniyle birebir
  // tutarlı (Kural 12) — `scope` nesnesinin kendisi değil, ilkel
  // alanları bağımlılık dizisinde kullanılıyor.
  const scopeMode = scope.mode;
  const treeId = scope.mode === "tree" ? scope.treeId : null;
  const parcelId = scope.mode === "parcel" ? scope.parcelId : null;

  const [observations, setObservations] = useState<Observation[]>([]);
  const [status, setStatus] = useState<ObservationsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    (offset: number) => {
      const listOptions: ObservationListOptions = { activeOnly, limit: pageSize, offset };
      return scopeMode === "tree" && treeId !== null
        ? observationRepository.listByTree(treeId, listOptions)
        : // `scopeMode !== "tree"` ise `UseObservationsScope` birleşim tipi
          // gereği zorunlu olarak "parcel" modundayız — `parcelId` bu
          // durumda asla null olamaz (yapı gereği garanti, TS bunu
          // ayrı değişkenler arasında otomatik çıkaramıyor).
          observationRepository.listByParcel(parcelId as string, listOptions);
    },
    [scopeMode, treeId, parcelId, activeOnly, pageSize]
  );

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);
    try {
      const result = await fetchPage(0);
      setObservations(result);
      setHasMore(result.length === pageSize);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [fetchPage, pageSize]);

  const loadMore = useCallback(async () => {
    if (status !== "ready" || !hasMore) return;
    try {
      const result = await fetchPage(observations.length);
      setObservations((prev) => [...prev, ...result]);
      setHasMore(result.length === pageSize);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [status, hasMore, fetchPage, observations.length, pageSize]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createObservation = useCallback(
    async (input: NewObservationInput) => {
      await observationRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const updateObservation = useCallback(
    async (id: string, changes: ObservationUpdateInput) => {
      await observationRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivateObservation = useCallback(
    async (id: string) => {
      await observationRepository.deactivate(id);
      await refetch();
    },
    [refetch]
  );

  return {
    observations,
    status,
    errorMessage,
    errorCode,
    hasMore,
    refetch,
    loadMore,
    createObservation,
    updateObservation,
    deactivateObservation,
  };
}
