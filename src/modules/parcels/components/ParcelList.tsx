/**
 * ParcelList — Liste Render Bileşeni
 * =====================================
 *
 * MİMARİ KARAR (Modül 2 Mimari Doğrulaması madde 7):
 * Bu bileşen, parsel dizisini render etme sorumluluğunu `ParcelsScreen`den
 * BİLEREK ayırıyor. Bugün basit bir `.map()`; binlerce kayıtta
 * performans sorunu çıkarsa (Kural: bugün eklenmiyor, YAGNI), sadece
 * bu dosyanın içi bir sanallaştırma kütüphanesiyle değişir —
 * `ParcelsScreen` veya `useParcels` etkilenmez.
 */

import { useTranslation } from "react-i18next";
import type { Parcel } from "../domain/parcel.types";

interface ParcelListProps {
  parcels: Parcel[];
  onSelect: (parcel: Parcel) => void;
}

export function ParcelList({ parcels, onSelect }: ParcelListProps) {
  const { t } = useTranslation();

  return (
    <ul className="parcel-list">
      {parcels.map((parcel) => (
        <li key={parcel.id}>
          <button
            type="button"
            className="parcel-list__item"
            onClick={() => onSelect(parcel)}
            aria-label={`${parcel.name}, ${t(`parcel.cropType.${parcel.cropType}`)}, ${parcel.areaDekar} ${t("parcel.areaDekar")}`}
          >
            <span className="parcel-list__name">{parcel.name}</span>
            <span className="parcel-list__meta">
              {t(`parcel.cropType.${parcel.cropType}`)} · {parcel.areaDekar} {t("parcel.areaDekar")}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
