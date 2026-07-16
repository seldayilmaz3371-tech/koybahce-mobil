/**
 * useFinanceRecords Hook
 * ========================
 * bkz. Modül 4 Mimari Onayı, Sprint 4.2.
 *
 * `useObservations` ile AYNI ince sarmalayıcı deseni (Kural 12):
 * dual-scope (`parcel`/`tree`) + Parsel'in `hasMore`/`loadMore`
 * sayfalama deseni (finans kayıtları da yıllar boyunca birikir —
 * Observation'la aynı ölçek gerekçesi).
 *
 * GELECEĞE HAZIRLIK (bugün kullanılmıyor, sadece tasarım): `tree`
 * modu, bugün hiçbir ekrana bağlı değil ama gelecekte bir ağacın
 * finans geçmişini göstermek için hazır — `financeRepository.
 * listByTree()` zaten Sprint 4.1'de var, buraya sadece dual-scope
 * ayrıştırması eklendi (yeni repository kodu YOK).
 */

import { useCallback, useEffect, useState } from "react";
import { financeRepository } from "../data/finance.repository";
import type { FinanceRecordListOptions } from "../data/finance.repository.interface";
import type {
  FinanceRecord,
  FinanceRecordUpdateInput,
  NewFinanceRecordInput,
} from "../domain/finance.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

export type UseFinanceRecordsScope = { mode: "parcel"; parcelId: string } | { mode: "tree"; treeId: string };

type FinanceRecordsStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_LIST_LIMIT = 50;

export interface UseFinanceRecordsResult {
  records: FinanceRecord[];
  status: FinanceRecordsStatus;
  errorMessage: string | null;
  errorCode: ErrorCodeValue | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createRecord: (input: NewFinanceRecordInput) => Promise<void>;
  updateRecord: (id: string, changes: FinanceRecordUpdateInput) => Promise<void>;
  deactivateRecord: (id: string) => Promise<void>;
}

export function useFinanceRecords(
  scope: UseFinanceRecordsScope,
  options: Pick<FinanceRecordListOptions, "activeOnly" | "limit"> = {}
): UseFinanceRecordsResult {
  const { activeOnly, limit } = options;
  const pageSize = limit ?? DEFAULT_LIST_LIMIT;
  const scopeMode = scope.mode;
  const parcelId = scope.mode === "parcel" ? scope.parcelId : null;
  const treeId = scope.mode === "tree" ? scope.treeId : null;

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [status, setStatus] = useState<FinanceRecordsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    (offset: number) => {
      const listOptions: FinanceRecordListOptions = { activeOnly, limit: pageSize, offset };
      return scopeMode === "parcel" && parcelId !== null
        ? financeRepository.listByParcel(parcelId, listOptions)
        : // `scopeMode !== "parcel"` ise birleşim tipi gereği zorunlu
          // olarak "tree" modundayız — `treeId` bu durumda asla null
          // olamaz (yapı gereği garanti).
          financeRepository.listByTree(treeId as string, listOptions);
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
    async (input: NewFinanceRecordInput) => {
      await financeRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const updateRecord = useCallback(
    async (id: string, changes: FinanceRecordUpdateInput) => {
      await financeRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivateRecord = useCallback(
    async (id: string) => {
      await financeRepository.deactivate(id);
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
