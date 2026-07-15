/**
 * ObservationCard — Tek Gözlem Kartı
 * =====================================
 * bkz. Sprint 3.4 UX Doğrulaması (madde 3-6).
 *
 * BİLEREK AYRI BİR BİLEŞEN (ParcelList/TreeList'teki satır içi
 * `<button>` deseninden farklı olarak): "Observation Card" kavramı,
 * gelecekte bir Timeline görünümünün DOĞRUDAN yeniden kullanabileceği
 * bir birim olarak tasarlandı (UX Doğrulaması madde 5). İleride
 * fotoğraf sayısı gibi ek bilgiler (madde 6), bu kartın props'una
 * additive olarak eklenebilir — mevcut yapıyı bozmadan.
 *
 * İÇERİK KARARI (madde 3-4, "gereksiz bilgi yok"): Sadece 3 alan —
 * tür (çevrilmiş), kısaltılmış not önizlemesi, tarih. Tam not metni
 * karta değil, düzenleme formuna dokunulduğunda görünür.
 */

import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../../i18n/formatters";
import type { Observation } from "../domain/observation.types";

const NOTE_PREVIEW_MAX_LENGTH = 60;

function truncateNote(note: string | null): string | null {
  if (!note) return null;
  return note.length > NOTE_PREVIEW_MAX_LENGTH
    ? `${note.slice(0, NOTE_PREVIEW_MAX_LENGTH)}…`
    : note;
}

interface ObservationCardProps {
  observation: Observation;
  onSelect: (observation: Observation) => void;
}

export function ObservationCard({ observation, onSelect }: ObservationCardProps) {
  const { t, i18n } = useTranslation();
  const notePreview = truncateNote(observation.note);
  const formattedDate = formatDateTime(observation.observedAt, i18n.language);
  const typeLabel = t(`observation.type.${observation.observationType}`);

  return (
    <button
      type="button"
      className="parcel-list__item"
      onClick={() => onSelect(observation)}
      aria-label={notePreview ? `${typeLabel}, ${formattedDate}, ${notePreview}` : `${typeLabel}, ${formattedDate}`}
    >
      <span className="parcel-list__name">{typeLabel}</span>
      <span className="parcel-list__meta">
        {formattedDate}
        {notePreview ? ` · ${notePreview}` : ""}
      </span>
    </button>
  );
}
