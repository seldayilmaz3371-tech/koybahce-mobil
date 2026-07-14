/**
 * ParcelsScreen
 * ===============
 * Liste görünümü + oluşturma/düzenleme akışı (basit view-state ile
 * `ParcelForm`'a geçiş). Silme yok — sadece pasife alma (deactivate),
 * ileride ayrı bir eylem olarak eklenecek (bugün UI'da yok, YAGNI).
 *
 * NAVİGASYON KARARI: Bilerek bir router kütüphanesi YOK — bu modülde
 * tek bir gerçek ekran var, Modül 1'in App.tsx'indeki basit "view
 * state" deseniyle tutarlı kalınıyor. Gerçek çoklu ekran/geri tuşu
 * ihtiyacı doğduğunda (Modül 3+) bu karar yeniden değerlendirilecek.
 *
 * GLOBALIZATION POLICY: Bu dosyada hiçbir kullanıcıya görünen metin
 * doğrudan yazılmaz.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParcels } from "./hooks/useParcels";
import { ParcelList } from "./components/ParcelList";
import { ParcelForm } from "./ParcelForm";
import type { NewParcelInput, Parcel } from "./domain/parcel.types";

type ScreenView = { mode: "list" } | { mode: "create" } | { mode: "edit"; parcel: Parcel };

export function ParcelsScreen() {
  const { t } = useTranslation();
  const { parcels, status, errorMessage, createParcel, updateParcel } = useParcels();
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

  if (view.mode === "create" || view.mode === "edit") {
    return (
      <ParcelForm
        initialValue={view.mode === "edit" ? view.parcel : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setView({ mode: "list" })}
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

      {status === "loading" || status === "idle" ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{errorMessage}</p>
        </div>
      ) : null}

      {status === "ready" && parcels.length === 0 ? (
        <p className="status-card__value">{t("parcel.emptyState")}</p>
      ) : null}

      {status === "ready" && parcels.length > 0 ? (
        <ParcelList parcels={parcels} onSelect={handleSelect} />
      ) : null}
    </main>
  );
}
