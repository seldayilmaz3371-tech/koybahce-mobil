/**
 * ParcelsScreen
 * ===============
 * Liste görünümü + oluşturma/düzenleme/silme (soft-delete) akışı
 * (basit view-state ile `ParcelForm`'a geçiş).
 *
 * NAVİGASYON KARARI: Bilerek bir router kütüphanesi YOK — bu modülde
 * tek bir gerçek ekran var, Modül 1'in App.tsx'indeki basit "view
 * state" deseniyle tutarlı kalınıyor. Gerçek çoklu ekran/geri tuşu
 * ihtiyacı doğduğunda (Modül 3+) bu karar yeniden değerlendirilecek.
 *
 * GLOBALIZATION POLICY: Bu dosyada hiçbir kullanıcıya görünen metin
 * doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParcels } from "./hooks/useParcels";
import { ParcelList } from "./components/ParcelList";
import { ParcelForm } from "./ParcelForm";
import { SelectField } from "../../shared/components/form/SelectField";
import { addBackButtonListener, exitApp } from "../../native/appBackButton";
import type { NewParcelInput, Parcel } from "./domain/parcel.types";
import type { ParcelListOptions } from "./data/parcel.repository.interface";

type ScreenView = { mode: "list" } | { mode: "create" } | { mode: "edit"; parcel: Parcel };
type SortOption = NonNullable<ParcelListOptions["sortBy"]>;

/** Kullanıcı yazmayı bıraktıktan bu kadar ms sonra arama tetiklenir — her tuş vuruşunda sorgu çalıştırmamak için (Kural 9). */
const SEARCH_DEBOUNCE_MS = 300;

interface ParcelsScreenProps {
  /** Kullanıcı bir parselin ağaçlarını görüntülemek istediğinde çağrılır (App.tsx üst navigasyonu yönetir). */
  onViewTrees: (parcel: Parcel) => void;
  /** Kullanıcı çiftlik genelindeki referans ağaçları görüntülemek istediğinde çağrılır. */
  onViewReferenceTrees: () => void;
  /** Kullanıcı bir parselin finans geçmişini görüntülemek istediğinde çağrılır (Sprint 4.3). */
  onViewFinance: (parcel: Parcel) => void;
}

export function ParcelsScreen({ onViewTrees, onViewReferenceTrees, onViewFinance }: ParcelsScreenProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const { parcels, status, errorCode, hasMore, loadMore, createParcel, updateParcel, deactivateParcel } =
    useParcels({ search: debouncedSearch || undefined, sortBy });
  const [view, setView] = useState<ScreenView>({ mode: "list" });

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        // Form açıkken geri tuşu = İptal (mevcut onCancel ile aynı davranış).
        setView({ mode: "list" });
      } else {
        // Ana ekrandayız — Android'in doğal davranışı: uygulamadan çık.
        exitApp();
      }
    });
  }, [view]);

  const handleSelect = (parcel: Parcel) => {
    setView({ mode: "edit", parcel });
  };

  const handleSubmit = async (input: NewParcelInput) => {
    if (view.mode === "edit") {
      await updateParcel(view.parcel.id, input);
    } else {
      await createParcel(input);
    }
    setView({ mode: "list" });
  };

  const handleDelete = async () => {
    if (view.mode !== "edit") return;
    await deactivateParcel(view.parcel.id);
    setView({ mode: "list" });
  };

  if (view.mode === "create" || view.mode === "edit") {
    return (
      <ParcelForm
        initialValue={view.mode === "edit" ? view.parcel : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setView({ mode: "list" })}
        onDelete={view.mode === "edit" ? handleDelete : undefined}
        onViewTrees={view.mode === "edit" ? () => onViewTrees(view.parcel) : undefined}
        onViewFinance={view.mode === "edit" ? () => onViewFinance(view.parcel) : undefined}
      />
    );
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("parcel.title")}</h1>

      <button
        type="button"
        className="lock-screen__button"
        onClick={() => setView({ mode: "create" })}
      >
        {t("parcel.addButton")}
      </button>

      <button type="button" className="lock-screen__button" onClick={onViewReferenceTrees}>
        {t("parcel.referenceTreesButton")}
      </button>

      <div className="search-field form-field">
        <label htmlFor="parcel-search" className="sr-only">
          {t("parcel.searchLabel")}
        </label>
        <input
          id="parcel-search"
          type="search"
          placeholder={t("parcel.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <SelectField
        id="parcel-sort"
        label={t("parcel.sortLabel")}
        value={sortBy}
        onChange={setSortBy}
        options={[
          { value: "name", label: t("parcel.sortByName") },
          { value: "areaDekar", label: t("parcel.sortByArea") },
        ]}
      />

      {status === "idle" || (status === "loading" && parcels.length === 0) ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">
            {t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        </div>
      ) : null}

      {status === "ready" && parcels.length === 0 ? (
        <p className="status-card__value">
          {debouncedSearch ? t("parcel.noSearchResults") : t("parcel.emptyState")}
        </p>
      ) : null}

      {parcels.length > 0 ? (
        <>
          <ParcelList parcels={parcels} onSelect={handleSelect} />
          {status === "loading" ? (
            <p className="status-card__value">{t("common.loading")}</p>
          ) : null}
          {hasMore && status !== "loading" ? (
            <button type="button" className="lock-screen__button" onClick={loadMore}>
              {t("parcel.loadMoreButton")}
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
