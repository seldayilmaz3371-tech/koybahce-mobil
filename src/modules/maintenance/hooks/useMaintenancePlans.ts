/**
 * useMaintenancePlans Hook
 * ===========================
 * bkz. Sprint 5.4. `useMaintenanceRecords` ile BİREBİR AYNI ince
 * sarmalayıcı deseni (Kural 12) — dual-scope + sayfalama.
 *
 * GENİŞLETME (Sprint 5.5 — Yaklaşan/Geciken Bakımlar): `overduePlans`/
 * `todayPlans`/`upcomingPlans` eklendi. Mevcut `plans`/`status`/
 * `hasMore`/CRUD fonksiyonları HİÇ DEĞİŞMEDİ (additive, geriye dönük
 * uyumlu). 3 kategori, repository'nin YENİ `dueStatus` filtresiyle
 * (Sprint 5.5) TEK BİR `refetch()` çağrısında (Promise.all ile
 * paralel) elde edilir — UI, hook'tan gelen HAZIR 3 listeyi gösterir,
 * kendisi hiçbir tarih hesaplaması/filtreleme YAPMAZ ("UI yalnızca
 * sonucu gösterecek" ilkesi).
 *
 * "Bugün" referansı, hook İÇİNDE `refetch()` ÇALIŞTIĞI ANDA (render
 * sırasında DEĞİL) hesaplanır — bu, `new Date()`'in her render'da
 * farklı bir değer üretme riskini ortadan kaldırır (React saf
 * render ilkesiyle tutarlı).
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
import { todayAsDateInputValue } from "../../../shared/utils/dateInputConversion";

export type UseMaintenancePlansScope = { mode: "parcel"; parcelId: string } | { mode: "tree"; treeId: string };

type MaintenancePlansStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_LIST_LIMIT = 50;
/** Kategori görünümleri (Geciken/Bugün/Yaklaşan) için üst sınır — bunlar sayfalanmaz, tek seferde makul bir üst sınırla gösterilir (YAGNI: kategori-bazlı sayfalama bugün gerekmiyor). */
const DUE_CATEGORY_LIMIT = 50;

export interface UseMaintenancePlansResult {
  plans: MaintenancePlan[];
  /** Sprint 5.5 — bugünden ÖNCEki (gecikmiş) planlar. */
  overduePlans: MaintenancePlan[];
  /** Sprint 5.5 — bugüne ait planlar. */
  todayPlans: MaintenancePlan[];
  /** Sprint 5.5 — yarından itibarenki planlar. */
  upcomingPlans: MaintenancePlan[];
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
  const [overduePlans, setOverduePlans] = useState<MaintenancePlan[]>([]);
  const [todayPlans, setTodayPlans] = useState<MaintenancePlan[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<MaintenancePlan[]>([]);
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

  /** bkz. dosya başlığı — "bugün" referansı burada, `refetch()` her çalıştığında YENİDEN hesaplanır. */
  const fetchByDueStatus = useCallback(
    (dueStatus: "overdue" | "today" | "upcoming", referenceDate: string) => {
      const listOptions: MaintenancePlanListOptions = {
        activeOnly,
        limit: DUE_CATEGORY_LIMIT,
        dueStatus,
        referenceDate,
      };
      return scopeMode === "parcel" && parcelId !== null
        ? maintenancePlanRepository.listByParcel(parcelId, listOptions)
        : maintenancePlanRepository.listByTree(treeId as string, listOptions);
    },
    [scopeMode, parcelId, treeId, activeOnly]
  );

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);
    try {
      const referenceDate = todayAsDateInputValue();
      const [result, overdue, today, upcoming] = await Promise.all([
        fetchPage(0),
        fetchByDueStatus("overdue", referenceDate),
        fetchByDueStatus("today", referenceDate),
        fetchByDueStatus("upcoming", referenceDate),
      ]);
      setPlans(result);
      setOverduePlans(overdue);
      setTodayPlans(today);
      setUpcomingPlans(upcoming);
      setHasMore(result.length === pageSize);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [fetchPage, fetchByDueStatus, pageSize]);

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
    overduePlans,
    todayPlans,
    upcomingPlans,
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
