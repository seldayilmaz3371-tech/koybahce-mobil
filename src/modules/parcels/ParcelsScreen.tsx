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
import type { NewParcelInput, Parcel } from "./domain/parcel.types";
import type { ParcelListOptions } from "./data/parcel.repository.interface";

type ScreenView = { mode: "list" } | { mode: "create" } | { mode: "edit"; parcel: Parcel };
type SortOption = NonNullable<ParcelListOptions["sortBy"]>;

/** Kullanıcı yazmayı bıraktıktan bu kadar ms sonra arama tetiklenir — her tuş vuruşunda sorgu çalıştırmamak için (Kural 9). */
const SEARCH_DEBOUNCE_MS = 300;

export function ParcelsScreen() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const { parcels, status, errorMessage, hasMore, loadMore, createParcel, updateParcel, deactivateParcel } =
    useParcels({ search: debouncedSearch || undefined, sortBy });
  const [view, setView] = useState<ScreenView>({ mode: "list" });

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
          <p className="status-card__value">{errorMessage}</p>
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
