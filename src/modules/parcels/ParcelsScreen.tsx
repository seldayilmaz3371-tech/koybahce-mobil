/**
 * ParcelsScreen
 * ===============
 * Bu adımda (Adım 2/6) sadece LİSTELEME. "Parsel Ekle" butonu ve
 * satırlara dokununca açılacak düzenleme akışı, `ParcelForm` Adım 3'te
 * eklendiğinde bağlanacak.
 *
 * NAVİGASYON KARARI: Henüz bir router kütüphanesi YOK (bilinçli — bu
 * modülde tek bir gerçek ekran var, Modül 1'in App.tsx'indeki basit
 * "view state" deseniyle tutarlı kalınıyor). Gerçek çoklu ekran/geri
 * tuşu ihtiyacı doğduğunda (Modül 3+) bu karar yeniden değerlendirilecek.
 *
 * GLOBALIZATION POLICY: Bu dosyada hiçbir kullanıcıya görünen metin
 * doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import { useParcels } from "./hooks/useParcels";
import { ParcelList } from "./components/ParcelList";
import type { Parcel } from "./domain/parcel.types";

export function ParcelsScreen() {
  const { t } = useTranslation();
  const { parcels, status, errorMessage } = useParcels();

  const handleSelect = (_parcel: Parcel) => {
    // Adım 3'te ParcelForm eklendiğinde düzenleme akışına bağlanacak.
  };

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("parcel.title")}</h1>

      <button type="button" className="lock-screen__button" disabled>
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
