/**
 * ObservationScreen
 * ===================
 * Sprint 3.4: Liste + CRUD. Sprint 3.5 ile eklenenler:
 *
 *   1. `contextLabel` prop — GERÇEK BULGU (Sprint 3.5 UX Doğrulaması
 *      madde 1/3): ekran başlığı sadece "Observations" idi, kullanıcı
 *      HANGİ ağaçta olduğunu anlayamıyordu. Çağıran taraf (TreesScreen)
 *      zaten ağaç bilgisini bildiği için, ekstra bir DB sorgusu
 *      yapmadan (Kural 9) doğrudan prop olarak geçiriliyor.
 *   2. `onBack` + Android geri tuşu — talep edilmemişti ama
 *      Parsel/Ağaç ekranlarındaki tutarlılık standardını korumak için
 *      eklendi (bkz. sohbet kaydı gerekçesi).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useObservations, type UseObservationsScope } from "./hooks/useObservations";
import { ObservationList } from "./components/ObservationList";
import { ObservationForm } from "./ObservationForm";
import { addBackButtonListener } from "../../native/appBackButton";
import type { NewObservationInput, Observation } from "./domain/observation.types";

type ObservationsView = { mode: "list" } | { mode: "create" } | { mode: "edit"; observation: Observation };

interface ObservationScreenProps {
  scope: UseObservationsScope;
  /** `scope.mode === "tree"` ise zorunlu (formun `parcelId`'ye ihtiyacı var); `scope.mode === "parcel"` ise `scope.parcelId` ile aynı olmalı. */
  parcelId: string;
  /** Ekran başlığının altında gösterilen bağlam metni (ör. "Ağaç: A-1 — Gemlik"). Çağıran taraftan gelir, burada hesaplanmaz. */
  contextLabel?: string;
  /** Kullanıcı geri dönmek istediğinde çağrılır (üst navigasyon App.tsx/TreesScreen'de yönetilir). */
  onBack: () => void;
  /** Kullanıcı bir gözlemin fotoğraflarını görüntülemek istediğinde çağrılır (Sprint 3.7). */
  onViewPhotos: (observation: Observation) => void;
}

export function ObservationScreen({ scope, parcelId, contextLabel, onBack, onViewPhotos }: ObservationScreenProps) {
  const { t } = useTranslation();
  const {
    observations,
    status,
    errorCode,
    hasMore,
    loadMore,
    createObservation,
    updateObservation,
    deactivateObservation,
  } = useObservations(scope);
  const [view, setView] = useState<ObservationsView>({ mode: "list" });

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        setView({ mode: "list" });
      } else {
        onBack();
      }
    });
  }, [view, onBack]);

  const handleSelect = (observation: Observation) => {
    setView({ mode: "edit", observation });
  };

  const handleSubmit = async (input: NewObservationInput) => {
    if (view.mode === "edit") {
      await updateObservation(view.observation.id, {
        observationType: input.observationType,
        note: input.note,
        observedAt: input.observedAt,
      });
    } else {
      await createObservation(input);
    }
    setView({ mode: "list" });
  };

  const handleDelete = async () => {
    if (view.mode !== "edit") return;
    await deactivateObservation(view.observation.id);
    setView({ mode: "list" });
  };

  if (view.mode === "create" || view.mode === "edit") {
    const treeId = scope.mode === "tree" ? scope.treeId : null;
    return (
      <ObservationForm
        parcelId={parcelId}
        treeId={view.mode === "edit" ? view.observation.treeId : treeId}
        initialValue={view.mode === "edit" ? view.observation : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setView({ mode: "list" })}
        onDelete={view.mode === "edit" ? handleDelete : undefined}
        onViewPhotos={view.mode === "edit" ? () => onViewPhotos(view.observation) : undefined}
      />
    );
  }

  return (
    <main className="status-screen">
      <button type="button" className="lock-screen__button" onClick={onBack}>
        {t("observation.backButton")}
      </button>

      <h1 className="status-screen__title">{t("observation.screenTitle")}</h1>
      {contextLabel ? <p className="status-card__label">{contextLabel}</p> : null}

      <button type="button" className="lock-screen__button" onClick={() => setView({ mode: "create" })}>
        {t("observation.addButton")}
      </button>

      {status === "idle" || (status === "loading" && observations.length === 0) ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">
            {t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        </div>
      ) : null}

      {status === "ready" && observations.length === 0 ? (
        <p className="status-card__value">{t("observation.emptyState")}</p>
      ) : null}

      {observations.length > 0 ? (
        <>
          <ObservationList observations={observations} onSelect={handleSelect} />
          {status === "loading" ? <p className="status-card__value">{t("common.loading")}</p> : null}
          {hasMore && status !== "loading" ? (
            <button type="button" className="lock-screen__button" onClick={loadMore}>
              {t("observation.loadMoreButton")}
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
