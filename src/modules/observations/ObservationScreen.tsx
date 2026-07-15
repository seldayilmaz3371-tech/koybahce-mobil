/**
 * ObservationScreen
 * ===================
 * Sprint 3.4 kapsamı: Liste + CRUD (ObservationForm Sprint 3.3'te
 * zaten hazırdı — Ağaç modülünden farklı olarak, burada Screen ve
 * Form aynı sprint sınırında birleşiyor, sahte bir "sadece listeleme"
 * ara adımı eklemiyoruz, çünkü form zaten mevcut).
 *
 * NAVİGASYON/GERİ TUŞU BU SPRİNTİN DIŞINDA (Sprint 3.5 — Tree→
 * Observation Navigation): `scope` prop'u dışarıdan (gelecekte
 * TreesScreen'den) geleceği için `onBack` burada henüz YOK — Sprint
 * 3.5'te App.tsx/TreesScreen entegrasyonu ile birlikte eklenecek.
 *
 * SAYFALAMA: `useObservations`'ın `hasMore`/`loadMore`'u (Domain
 * Review onayı, Sprint 3.2) — Parsel deseni, Ağaç'ınki değil.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useObservations, type UseObservationsScope } from "./hooks/useObservations";
import { ObservationList } from "./components/ObservationList";
import { ObservationForm } from "./ObservationForm";
import type { NewObservationInput, Observation } from "./domain/observation.types";

type ObservationsView = { mode: "list" } | { mode: "create" } | { mode: "edit"; observation: Observation };

interface ObservationScreenProps {
  scope: UseObservationsScope;
  /** `scope.mode === "tree"` ise zorunlu (formun `parcelId`'ye ihtiyacı var); `scope.mode === "parcel"` ise `scope.parcelId` ile aynı olmalı. */
  parcelId: string;
}

export function ObservationScreen({ scope, parcelId }: ObservationScreenProps) {
  const { t } = useTranslation();
  const {
    observations,
    status,
    errorMessage,
    hasMore,
    loadMore,
    createObservation,
    updateObservation,
    deactivateObservation,
  } = useObservations(scope);
  const [view, setView] = useState<ObservationsView>({ mode: "list" });

  const handleSelect = (observation: Observation) => {
    setView({ mode: "edit", observation });
  };

  const handleSubmit = async (input: NewObservationInput) => {
    if (view.mode === "edit") {
      // parcelId/treeId sözleşmede yok (ObservationUpdateInput) —
      // sadece observationType/note/observedAt geçiriliyor.
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
      />
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("observation.screenTitle")}</h1>

      <button type="button" className="lock-screen__button" onClick={() => setView({ mode: "create" })}>
        {t("observation.addButton")}
      </button>

      {status === "idle" || (status === "loading" && observations.length === 0) ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{errorMessage}</p>
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
