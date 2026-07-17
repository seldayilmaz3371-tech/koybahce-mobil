/**
 * useMaintenanceRecords Hook
 * =============================
 * bkz. Sprint 5.2. `useFinanceRecords` ile BİREBİR AYNI ince
 * sarmalayıcı deseni (Kural 12) — dual-scope (`parcel`/`tree`) +
 * Parsel'in `hasMore`/`loadMore` sayfalama deseni.
 *
 * Yeni mimari YOK — mevcut hook standardı tekrar kullanıldı.
 */

import { useCallback, useEffect, useState } from "react";
import { maintenanceRepository } from "../data/maintenance.repository";
import type { MaintenanceListOptions } from "../data/maintenance.repository.interface";
import type {
  MaintenanceRecord,
  MaintenanceRecordUpdateInput,
  NewMaintenanceRecordInput,
} from "../domain/maintenance.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

export type UseMaintenanceRecordsScope =
  | { mode: "parcel"; parcelId: string }
  | { mode: "tree"; treeId: string };

type MaintenanceRecordsStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_LIST_LIMIT = 50;

export interface UseMaintenanceRecordsResult {
  records: MaintenanceRecord[];
  status: MaintenanceRecordsStatus;
  errorMessage: string | null;
  errorCode: ErrorCodeValue | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createRecord: (input: NewMaintenanceRecordInput) => Promise<void>;
  updateRecord: (id: string, changes: MaintenanceRecordUpdateInput) => Promise<void>;
  deactivateRecord: (id: string) => Promise<void>;
}

export function useMaintenanceRecords(
  scope: UseMaintenanceRecordsScope,
  options: Pick<MaintenanceListOptions, "activeOnly" | "limit"> = {}
): UseMaintenanceRecordsResult {
  const { activeOnly, limit } = options;
  const pageSize = limit ?? DEFAULT_LIST_LIMIT;
  const scopeMode = scope.mode;
  const parcelId = scope.mode === "parcel" ? scope.parcelId : null;
  const treeId = scope.mode === "tree" ? scope.treeId : null;

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [status, setStatus] = useState<MaintenanceRecordsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    (offset: number) => {
      const listOptions: MaintenanceListOptions = { activeOnly, limit: pageSize, offset };
      return scopeMode === "parcel" && parcelId !== null
        ? maintenanceRepository.listByParcel(parcelId, listOptions)
        : // `scopeMode !== "parcel"` ise birleşim tipi gereği zorunlu
          // olarak "tree" modundayız — `treeId` bu durumda asla null
          // olamaz (yapı gereği garanti).
          maintenanceRepository.listByTree(treeId as string, listOptions);
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
    async (input: NewMaintenanceRecordInput) => {
      await maintenanceRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const updateRecord = useCallback(
    async (id: string, changes: MaintenanceRecordUpdateInput) => {
      await maintenanceRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivateRecord = useCallback(
    async (id: string) => {
      await maintenanceRepository.deactivate(id);
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
