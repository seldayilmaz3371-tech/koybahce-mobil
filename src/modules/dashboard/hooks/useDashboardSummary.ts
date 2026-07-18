/**
 * useDashboardSummary Hook
 * ===========================
 * bkz. Sprint 8.4, roadmap Bölüm 2.7: "Mevcut repository'lerin ÖZET
 * sorgularını birleştiren yeni bir ekran — yeni bir mimari kategori
 * GEREKMİYOR."
 *
 * GERÇEK BULGU (kod öncesi inceleme, Sprint 8.4): Hiçbir repository'de
 * "TÜM parseller genelinde" bir GLOBAL sorgu YOK — Parcel/Tree/
 * MaintenancePlan/Observation/Harvest repository'lerinin HEPSİ
 * `listByParcel`/`listByTree` (dual-scope) deseninde. Bu hook, YENİ
 * bir repository metodu EKLEMEDEN, mevcut `listByParcel` çağrılarını
 * TÜM parseller için PARALEL (`Promise.all`) çalıştırıp JS
 * tarafında BİRLEŞTİRİYOR.
 *
 * BİLİNEN SINIR (gerçek, kayıtlı bir teknik not — spekülatif bir
 * "gelecek sorunu" DEĞİL): `parcelRepository.list()`'in varsayılan
 * limiti (50) aşılırsa, Dashboard EKSİK gösterir. Bugün bu bir sorun
 * DEĞİL (Beta aşaması, az sayıda parsel bekleniyor) — gerçek bir
 * ölçek sorunu ortaya çıkarsa, GERÇEK bir özet-sorgu repository
 * metodu eklenmesi değerlendirilmelidir (YAGNI — bugün spekülatif
 * olarak eklenmedi).
 */

import { useCallback, useEffect, useState } from "react";
import { parcelRepository } from "../../parcels/data/parcel.repository";
import { treeRepository } from "../../trees/data/tree.repository";
import { maintenancePlanRepository } from "../../maintenance/data/maintenancePlan.repository";
import { observationRepository } from "../../observations/data/observation.repository";
import { harvestRepository } from "../../harvest/data/harvest.repository";
import type { Observation } from "../../observations/domain/observation.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

type DashboardStatus = "idle" | "loading" | "ready" | "error";

const RECENT_OBSERVATIONS_LIMIT = 5;

export interface DashboardSummary {
  totalParcels: number;
  totalTrees: number;
  overdueMaintenanceCount: number;
  upcomingMaintenanceCount: number;
  /** En yeni 5 gözlem, TÜM parseller genelinde (JS tarafında birleştirilip sıralanmış). */
  recentObservations: Observation[];
  /** TÜM parseller genelindeki toplam hasat miktarı (kg). */
  totalHarvestKg: number;
}

export interface UseDashboardSummaryResult {
  summary: DashboardSummary | null;
  status: DashboardStatus;
  errorCode: ErrorCodeValue | null;
  refetch: () => Promise<void>;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalParcels: 0,
  totalTrees: 0,
  overdueMaintenanceCount: 0,
  upcomingMaintenanceCount: 0,
  recentObservations: [],
  totalHarvestKg: 0,
};

export function useDashboardSummary(): UseDashboardSummaryResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorCode(null);
    try {
      const parcels = await parcelRepository.list();

      if (parcels.length === 0) {
        setSummary(EMPTY_SUMMARY);
        setStatus("ready");
        return;
      }

      // Repository'nin kendi `new Date()` ÜRETMEMESİ kuralı (Sprint
      // 5.5, deterministik/test edilebilirlik) — referenceDate BURADA
      // (Hook seviyesinde) üretiliyor.
      const referenceDate = new Date().toISOString().slice(0, 10);

      const perParcelResults = await Promise.all(
        parcels.map(async (parcel) => {
          const [trees, overduePlans, upcomingTodayPlans, todayPlans, observations, harvests] = await Promise.all([
            treeRepository.listByParcel(parcel.id),
            maintenancePlanRepository.listByParcel(parcel.id, { dueStatus: "overdue", referenceDate }),
            maintenancePlanRepository.listByParcel(parcel.id, { dueStatus: "upcoming", referenceDate }),
            maintenancePlanRepository.listByParcel(parcel.id, { dueStatus: "today", referenceDate }),
            observationRepository.listByParcel(parcel.id, { limit: RECENT_OBSERVATIONS_LIMIT }),
            harvestRepository.listByParcel(parcel.id),
          ]);
          return { trees, overduePlans, upcomingTodayPlans, todayPlans, observations, harvests };
        })
      );

      const totalTrees = perParcelResults.reduce((sum, r) => sum + r.trees.length, 0);
      const overdueMaintenanceCount = perParcelResults.reduce((sum, r) => sum + r.overduePlans.length, 0);
      // "Yaklaşan" — Sprint 5.5'in kendi UI ayrımıyla tutarlı: "bugün" + "yaklaşan" birlikte sayılır (geciken HARİÇ).
      const upcomingMaintenanceCount = perParcelResults.reduce(
        (sum, r) => sum + r.upcomingTodayPlans.length + r.todayPlans.length,
        0
      );
      const totalHarvestKg = perParcelResults.reduce(
        (sum, r) => sum + r.harvests.reduce((s, h) => s + h.quantityKg, 0),
        0
      );

      const allObservations = perParcelResults.flatMap((r) => r.observations);
      const recentObservations = allObservations
        .sort((a, b) => (a.observedAt > b.observedAt ? -1 : 1))
        .slice(0, RECENT_OBSERVATIONS_LIMIT);

      setSummary({
        totalParcels: parcels.length,
        totalTrees,
        overdueMaintenanceCount,
        upcomingMaintenanceCount,
        recentObservations,
        totalHarvestKg,
      });
      setStatus("ready");
    } catch (error) {
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, status, errorCode, refetch };
}
