/**
 * useMaintenancePlans Hook
 * ===========================
 * bkz. Sprint 5.4. `useMaintenanceRecords` ile BİREBİR AYNI ince
 * sarmalayıcı deseni (Kural 12) — dual-scope + sayfalama.
 */

import { useCallback, useEffect, useState } from "react";
import { maintenancePlanRepository } from "../data/maintenancePlan.repository";
import type { MaintenancePlanListOptions } from "../data/maintenancePlan.repository.interface";
import type {
  MaintenancePlan,
  MaintenancePlanUpdateInput,
  NewMaintenancePlanInput,
} from "../domain/maintenance.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

export type UseMaintenancePlansScope = { mode: "parcel"; parcelId: string } | { mode: "tree"; treeId: string };

type MaintenancePlansStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_LIST_LIMIT = 50;

export interface UseMaintenancePlansResult {
  plans: MaintenancePlan[];
  status: MaintenancePlansStatus;
  errorMessage: string | null;
  errorCode: ErrorCodeValue | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPlan: (input: NewMaintenancePlanInput) => Promise<void>;
  updatePlan: (id: string, changes: MaintenancePlanUpdateInput) => Promise<void>;
  deactivatePlan: (id: string) => Promise<void>;
}

export function useMaintenancePlans(
  scope: UseMaintenancePlansScope,
  options: Pick<MaintenancePlanListOptions, "activeOnly" | "limit"> = {}
): UseMaintenancePlansResult {
  const { activeOnly, limit } = options;
  const pageSize = limit ?? DEFAULT_LIST_LIMIT;
  const scopeMode = scope.mode;
  const parcelId = scope.mode === "parcel" ? scope.parcelId : null;
  const treeId = scope.mode === "tree" ? scope.treeId : null;

  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [status, setStatus] = useState<MaintenancePlansStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    (offset: number) => {
      const listOptions: MaintenancePlanListOptions = { activeOnly, limit: pageSize, offset };
      return scopeMode === "parcel" && parcelId !== null
        ? maintenancePlanRepository.listByParcel(parcelId, listOptions)
        : // `scopeMode !== "parcel"` ise birleşim tipi gereği zorunlu
          // olarak "tree" modundayız — `treeId` bu durumda asla null
          // olamaz (yapı gereği garanti).
          maintenancePlanRepository.listByTree(treeId as string, listOptions);
    },
    [scopeMode, parcelId, treeId, activeOnly, pageSize]
  );

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);
    try {
      const result = await fetchPage(0);
      setPlans(result);
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
      const result = await fetchPage(plans.length);
      setPlans((prev) => [...prev, ...result]);
      setHasMore(result.length === pageSize);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [status, hasMore, fetchPage, plans.length, pageSize]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createPlan = useCallback(
    async (input: NewMaintenancePlanInput) => {
      await maintenancePlanRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const updatePlan = useCallback(
    async (id: string, changes: MaintenancePlanUpdateInput) => {
      await maintenancePlanRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivatePlan = useCallback(
    async (id: string) => {
      await maintenancePlanRepository.deactivate(id);
      await refetch();
    },
    [refetch]
  );

  return {
    plans,
    status,
    errorMessage,
    errorCode,
    hasMore,
    refetch,
    loadMore,
    createPlan,
    updatePlan,
    deactivatePlan,
  };
}
