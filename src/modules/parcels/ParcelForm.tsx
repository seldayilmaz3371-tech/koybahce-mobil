/**
 * ParcelForm
 * ============
 * Yeni parsel oluşturma / mevcut parseli düzenleme formu.
 *
 * BİLİNÇLİ TASARIM SIRASI: Bu adımda alanlar INLINE yazılıyor (henüz
 * ortak bileşenlere çıkarılmadı). Gerekçe: soyutlamayı, gerçek bir
 * kullanım örneği olmadan önceden tahmin etmek yerine, ilk somut
 * formdan ÇIKARMAK (extract, don't predict) — bir sonraki adımda
 * (Ortak Form Bileşenleri) bu alanlar `src/shared/components/form/`
 * altına taşınacak ve bu dosya onları kullanacak şekilde güncellenecek.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 * ERİŞİLEBİLİRLİK (Protocol Bölüm 19): Her alan gerçek <label
 * htmlFor>'a sahip, hata mesajları `role="alert"` ile duyuruluyor.
 */

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CropType, NewParcelInput, Parcel } from "./domain/parcel.types";

const CROP_TYPES: CropType[] = ["olive", "vegetable", "fruit"];

interface ParcelFormProps {
  /** Düzenleme modunda mevcut parsel; oluşturma modunda `undefined`. */
  initialValue?: Parcel;
  onSubmit: (input: NewParcelInput) => Promise<void>;
  onCancel: () => void;
}

export function ParcelForm({ initialValue, onSubmit, onCancel }: ParcelFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(initialValue?.name ?? "");
  const [cropType, setCropType] = useState<CropType>(initialValue?.cropType ?? "olive");
  const [areaDekar, setAreaDekar] = useState(initialValue?.areaDekar?.toString() ?? "");
  const [soilType, setSoilType] = useState(initialValue?.soilType ?? "");
  const [irrigationType, setIrrigationType] = useState(initialValue?.irrigationType ?? "");
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [latitude, setLatitude] = useState(initialValue?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(initialValue?.longitude?.toString() ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setValidationError(t("parcel.nameRequired"));
      return;
    }

    const parsedArea = Number(areaDekar);
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
      setValidationError(t("parcel.areaRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        cropType,
        areaDekar: parsedArea,
        soilType: soilType.trim() || null,
        irrigationType: irrigationType.trim() || null,
        notes: notes.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="status-screen" onSubmit={handleSubmit}>
      <h1 className="status-screen__title">
        {initialValue ? t("parcel.formTitleEdit") : t("parcel.formTitleCreate")}
      </h1>

      {validationError ? (
        <p role="alert" className="form-field__error">
          {validationError}
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="parcel-name">{t("parcel.name")}</label>
        <input
          id="parcel-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="parcel-crop-type">{t("parcel.cropType.label")}</label>
        <select
          id="parcel-crop-type"
          value={cropType}
          onChange={(e) => setCropType(e.target.value as CropType)}
        >
          {CROP_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`parcel.cropType.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="parcel-area">{t("parcel.areaDekar")}</label>
        <input
          id="parcel-area"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={areaDekar}
          onChange={(e) => setAreaDekar(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="parcel-soil-type">{t("parcel.soilType")}</label>
        <input
          id="parcel-soil-type"
          type="text"
          value={soilType}
          onChange={(e) => setSoilType(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="parcel-irrigation-type">{t("parcel.irrigationType")}</label>
        <input
          id="parcel-irrigation-type"
          type="text"
          value={irrigationType}
          onChange={(e) => setIrrigationType(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="parcel-latitude">{t("parcel.latitude")}</label>
        <input
          id="parcel-latitude"
          type="number"
          inputMode="decimal"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="parcel-longitude">{t("parcel.longitude")}</label>
        <input
          id="parcel-longitude"
          type="number"
          inputMode="decimal"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="parcel-notes">{t("parcel.notes")}</label>
        <textarea id="parcel-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button type="submit" className="lock-screen__button" disabled={isSubmitting}>
        {t("common.save")}
      </button>
      <button
        type="button"
        className="lock-screen__button"
        style={{ marginTop: 8 }}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {t("common.cancel")}
      </button>
    </form>
  );
}
