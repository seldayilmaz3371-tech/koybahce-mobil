/**
 * useHarvestRecords Hook
 * =========================
 * bkz. Sprint 8.2. `useMaintenanceRecords` ile BİREBİR AYNI ince
 * sarmalayıcı deseni (Kural 12) — dual-scope (`parcel`/`tree`) +
 * sayfalama (`hasMore`/`loadMore`).
 *
 * Yeni mimari YOK — mevcut hook standardı tekrar kullanıldı.
 */

import { useCallback, useEffect, useState } from "react";
import { harvestRepository } from "../data/harvest.repository";
import type { HarvestListOptions } from "../data/harvest.repository.interface";
import type {
  HarvestRecord,
  HarvestRecordUpdateInput,
  NewHarvestRecordInput,
} from "../domain/harvest.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

export type UseHarvestRecordsScope = { mode: "parcel"; parcelId: string } | { mode: "tree"; treeId: string };

type HarvestRecordsStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_LIST_LIMIT = 50;

export interface UseHarvestRecordsResult {
  records: HarvestRecord[];
  status: HarvestRecordsStatus;
  errorMessage: string | null;
  errorCode: ErrorCodeValue | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createRecord: (input: NewHarvestRecordInput) => Promise<void>;
  updateRecord: (id: string, changes: HarvestRecordUpdateInput) => Promise<void>;
  deactivateRecord: (id: string) => Promise<void>;
}

export function useHarvestRecords(
  scope: UseHarvestRecordsScope,
  options: Pick<HarvestListOptions, "activeOnly" | "limit"> = {}
): UseHarvestRecordsResult {
  const { activeOnly, limit } = options;
  const pageSize = limit ?? DEFAULT_LIST_LIMIT;
  const scopeMode = scope.mode;
  const parcelId = scope.mode === "parcel" ? scope.parcelId : null;
  const treeId = scope.mode === "tree" ? scope.treeId : null;

  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [status, setStatus] = useState<HarvestRecordsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    (offset: number) => {
      const listOptions: HarvestListOptions = { activeOnly, limit: pageSize, offset };
      return scopeMode === "parcel" && parcelId !== null
        ? harvestRepository.listByParcel(parcelId, listOptions)
        : // `scopeMode !== "parcel"` ise birleşim tipi gereği zorunlu
          // olarak "tree" modundayız — `treeId` bu durumda asla null
          // olamaz (yapı gereği garanti).
          harvestRepository.listByTree(treeId as string, listOptions);
    },
    [scopeMode, parcelId, treeId, activeOnly, pageSize]
  );

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);
    try {
      const result = await fetchPage(0);
      setRecords(result);
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
      const result = await fetchPage(records.length);
      setRecords((prev) => [...prev, ...result]);
      setHasMore(result.length === pageSize);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [status, hasMore, fetchPage, records.length, pageSize]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createRecord = useCallback(
    async (input: NewHarvestRecordInput) => {
      await harvestRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const updateRecord = useCallback(
    async (id: string, changes: HarvestRecordUpdateInput) => {
      await harvestRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivateRecord = useCallback(
    async (id: string) => {
      await harvestRepository.deactivate(id);
      await refetch();
    },
    [refetch]
  );

  return {
    records,
    status,
    errorMessage,
    errorCode,
    hasMore,
    refetch,
    loadMore,
    createRecord,
    updateRecord,
    deactivateRecord,
  };
}
