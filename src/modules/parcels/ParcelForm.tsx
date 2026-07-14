/**
 * ParcelForm
 * ============
 * Yeni parsel oluşturma / mevcut parseli düzenleme formu.
 *
 * Bu sürüm, src/shared/components/form/ altındaki ortak bileşenleri
 * kullanacak şekilde REFAKTÖR edildi (Modül 2 Mimari Doğrulaması
 * madde 3-4) — önceki sürümde alanlar inline yazılmıştı, bilerek
 * (extract, don't predict). Davranış DEĞİŞMEDİ, sadece işaretleme
 * ortak bileşenlere taşındı.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "../../shared/components/form/TextField";
import { NumberField } from "../../shared/components/form/NumberField";
import { SelectField } from "../../shared/components/form/SelectField";
import { TextAreaField } from "../../shared/components/form/TextAreaField";
import { FormError } from "../../shared/components/form/FormError";
import type { CropType, NewParcelInput, Parcel } from "./domain/parcel.types";

const CROP_TYPES: CropType[] = ["olive", "vegetable", "fruit"];

interface ParcelFormProps {
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

      <FormError message={validationError} />

      <TextField id="parcel-name" label={t("parcel.name")} value={name} onChange={setName} required />

      <SelectField
        id="parcel-crop-type"
        label={t("parcel.cropType.label")}
        value={cropType}
        onChange={setCropType}
        options={CROP_TYPES.map((type) => ({ value: type, label: t(`parcel.cropType.${type}`) }))}
      />

      <NumberField
        id="parcel-area"
        label={t("parcel.areaDekar")}
        value={areaDekar}
        onChange={setAreaDekar}
        step="0.01"
        required
      />

      <TextField id="parcel-soil-type" label={t("parcel.soilType")} value={soilType} onChange={setSoilType} />

      <TextField
        id="parcel-irrigation-type"
        label={t("parcel.irrigationType")}
        value={irrigationType}
        onChange={setIrrigationType}
      />

      <NumberField id="parcel-latitude" label={t("parcel.latitude")} value={latitude} onChange={setLatitude} />

      <NumberField id="parcel-longitude" label={t("parcel.longitude")} value={longitude} onChange={setLongitude} />

      <TextAreaField id="parcel-notes" label={t("parcel.notes")} value={notes} onChange={setNotes} />

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
