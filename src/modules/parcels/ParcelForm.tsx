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
  /** Sadece düzenleme modunda sağlanır — oluşturma modunda silinecek bir kayıt henüz yok. */
  onDelete?: () => Promise<void>;
  /** Sadece düzenleme modunda sağlanır — henüz kaydedilmemiş bir parselin ağaçları olamaz (Sprint 2.5). */
  onViewTrees?: () => void;
  /** Sadece düzenleme modunda sağlanır — henüz kaydedilmemiş bir parselin finans geçmişi olamaz (Sprint 4.3). NOT: onDelete/onViewTrees ile tutarlı desen — hangi modda geçirileceği çağıranın sorumluluğu. */
  onViewFinance?: () => void;
  /** Sadece düzenleme modunda sağlanır (Sprint 5.3). Aynı desen. */
  onViewMaintenance?: () => void;
  /** Sadece düzenleme modunda sağlanır (Sprint 8.3). Aynı desen. */
  onViewHarvest?: () => void;
  /** Sadece düzenleme modunda sağlanır (Sprint 10.3). Aynı desen. */
  onViewBulkOperations?: () => void;
  /** Sadece düzenleme modunda sağlanır (Sprint 7.1). Aynı desen. */
  onViewAiChat?: () => void;
}

export function ParcelForm({
  initialValue,
  onSubmit,
  onCancel,
  onDelete,
  onViewTrees,
  onViewFinance,
  onViewMaintenance,
  onViewHarvest,
  onViewBulkOperations,
  onViewAiChat,
}: ParcelFormProps) {
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

  const handleDelete = async () => {
    if (!onDelete) return;
    // window.confirm, Capacitor WebView'de native tarzı bir onay
    // diyaloğu gösterir — bu aşamada özel bir modal bileşeni
    // gerekmiyor (YAGNI). Yanlışlıkla silmeye karşı tek koruma bu.
    const confirmed = window.confirm(t("parcel.deleteConfirm"));
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="status-screen" onSubmit={handleSubmit} noValidate>
      <h1 className="status-screen__title">
        {initialValue ? t("parcel.formTitleEdit") : t("parcel.formTitleCreate")}
      </h1>

      <FormError message={validationError} />
      {/* Not: <form noValidate> bilerek eklendi — `required` özniteliği
          olmadan native tarayıcı doğrulaması, kendi i18n'li JS
          doğrulamamızı (yukarıdaki FormError) atlayıp çevrilmemiş,
          stilize edilemeyen bir tarayıcı balonu gösterirdi. Bu, gerçek
          bir bileşen testinde (TreeForm.test.tsx) bulundu ve aynı hata
          burada da (daha önce hiç component testi yazılmadığı için
          fark edilmemiş) düzeltildi. */}

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

      <NumberField id="parcel-latitude" label={t("common.latitude")} value={latitude} onChange={setLatitude} />

      <NumberField id="parcel-longitude" label={t("common.longitude")} value={longitude} onChange={setLongitude} />

      <TextAreaField id="parcel-notes" label={t("common.notes")} value={notes} onChange={setNotes} />

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

      {onViewTrees ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewTrees}
          disabled={isSubmitting}
        >
          {t("parcel.viewTreesButton")}
        </button>
      ) : null}

      {onViewFinance ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewFinance}
          disabled={isSubmitting}
        >
          {t("parcel.viewFinanceButton")}
        </button>
      ) : null}

      {onViewMaintenance ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewMaintenance}
          disabled={isSubmitting}
        >
          {t("parcel.viewMaintenanceButton")}
        </button>
      ) : null}

      {onViewHarvest ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewHarvest}
          disabled={isSubmitting}
        >
          {t("parcel.viewHarvestButton")}
        </button>
      ) : null}

      {onViewBulkOperations ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8, border: "2px solid var(--color-primary)" }}
          onClick={onViewBulkOperations}
          disabled={isSubmitting}
        >
          {t("parcel.viewBulkOperationsButton")}
        </button>
      ) : null}

      {onViewAiChat ? (
        <button
          type="button"
          className="lock-screen__button"
          style={{ marginTop: 8 }}
          onClick={onViewAiChat}
          disabled={isSubmitting}
        >
          {t("parcel.viewAiChatButton")}
        </button>
      ) : null}

      {onDelete ? (
        <button
          type="button"
          className="lock-screen__button lock-screen__button--danger"
          style={{ marginTop: 8 }}
          onClick={handleDelete}
          disabled={isSubmitting}
        >
          {t("parcel.deleteButton")}
        </button>
      ) : null}
    </form>
  );
}
