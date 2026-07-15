/**
 * PhotoGalleryScreen
 * ====================
 * bkz. Sprint 3.7 UX + Veri Modeli Doğrulaması.
 *
 * AKIŞ (Madde 1-4'ün doğrudan çözümü): Çekim → ÖNİZLEME → Onay/Vazgeç.
 * Fotoğraf, kullanıcı önizlemede "Kaydet"e basana kadar veritabanına
 * YAZILMAZ — bu hem "doğru fotoğrafı çektiğini hemen anlama" (Madde 3)
 * hem "yanlışlıkla iki kez kaydetme" (Madde 1-2, `isSubmitting`
 * deseniyle onay butonunun tek seferlik kilitlenmesi) sorunlarını
 * çözüyor.
 *
 * KAYNAK-AGNOSTİK (Madde 5-6): `capturePhoto("camera")` ve
 * `capturePhoto("gallery")` AYNI `CapturedPhoto` şeklini döndürüyor —
 * önizleme/kayıt akışı kaynağı hiç bilmiyor.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePhotos } from "./hooks/usePhotos";
import { photoRepository } from "./data/photo.repository";
import { capturePhoto, type PhotoSource } from "../../native/camera";
import { persistPhotoFile } from "../../native/filesystem";
import { addBackButtonListener } from "../../native/appBackButton";
import type { Photo } from "./domain/photo.types";

type GalleryView = { mode: "list" } | { mode: "preview"; webPath: string; sourceUri: string };

interface PhotoGalleryScreenProps {
  observationId: string;
  onBack: () => void;
}

export function PhotoGalleryScreen({ observationId, onBack }: PhotoGalleryScreenProps) {
  const { t } = useTranslation();
  const { photos, status, errorMessage, refetch, deactivatePhoto } = usePhotos(observationId);
  const [view, setView] = useState<GalleryView>({ mode: "list" });
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // GERÇEK BULGU (test yazarken bulundu — Madde 1-2): `isSaving` state'i
  // TEK BAŞINA yeterli değil. React state güncellemeleri (setIsSaving)
  // ASENKRON/batch'li işleniyor — aynı senkron JS turu içinde art arda
  // gelen iki tıklama, ikisi de `isSaving`in HÂLÂ `false` olduğu ESKİ
  // bir closure görebiliyor (state henüz yeniden render edilip
  // `disabled` özniteliğine yansımadan). `useRef`, senkron olarak
  // GÜNCELLENDİĞİ için bu yarış durumunu (race condition) gerçekten
  // engelliyor. `isSaving` state'i sadece UI'da butonun görsel olarak
  // devre dışı görünmesi için hâlâ tutuluyor.
  const isSavingRef = useRef(false);

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        setView({ mode: "list" });
      } else {
        onBack();
      }
    });
  }, [view, onBack]);

  const handleCapture = async (source: PhotoSource) => {
    setCaptureError(null);
    try {
      const captured = await capturePhoto(source);
      setView({ mode: "preview", webPath: captured.webPath, sourceUri: captured.sourceUri });
    } catch {
      // Ham native hata mesajı kullanıcıya gösterilmiyor (Error
      // Handling Standard) — çevrilmiş, genel bir mesaj yeterli.
      // İzin reddi/iptal/donanım hatası hepsi aynı şekilde ele alınıyor
      // (Madde 8) — kullanıcı cihaz ayarlarına yönlendiriliyor.
      setCaptureError(t("photo.captureError"));
    }
  };

  const handleConfirmSave = async () => {
    if (view.mode !== "preview" || isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      // photo.id'den BAĞIMSIZ bir dosya adı seed'i — backlog madde 11
      // netleştirmesi (sohbet kaydı): file_path bir ilişki anahtarı
      // değil, iki ayrı UUID kullanılması ilkeyi ihlal etmiyor.
      const fileNameSeed = crypto.randomUUID();
      const permanentPath = await persistPhotoFile(view.sourceUri, fileNameSeed);
      await photoRepository.create({ observationId, filePath: permanentPath });
      setView({ mode: "list" });
      await refetch();
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <main className="status-screen">
      <button type="button" className="lock-screen__button" onClick={onBack}>
        {t("photo.backButton")}
      </button>

      <h1 className="status-screen__title">{t("photo.screenTitle")}</h1>

      {view.mode === "preview" ? (
        <>
          <h2 className="status-card__label">{t("photo.previewTitle")}</h2>
          <img
            src={view.webPath}
            alt={t("photo.previewTitle")}
            style={{ width: "100%", borderRadius: 10, marginBottom: 16 }}
          />
          <button
            type="button"
            className="lock-screen__button"
            onClick={handleConfirmSave}
            disabled={isSaving}
          >
            {t("common.save")}
          </button>
          <button
            type="button"
            className="lock-screen__button"
            style={{ marginTop: 8 }}
            onClick={() => setView({ mode: "list" })}
            disabled={isSaving}
          >
            {t("photo.discardButton")}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="lock-screen__button"
            onClick={() => handleCapture("camera")}
          >
            {t("photo.cameraButton")}
          </button>
          <button
            type="button"
            className="lock-screen__button"
            style={{ marginTop: 8 }}
            onClick={() => handleCapture("gallery")}
          >
            {t("photo.galleryButton")}
          </button>

          {captureError ? (
            <div className="status-card status-card--error">
              <p className="status-card__value">{captureError}</p>
            </div>
          ) : null}

          {status === "loading" && photos.length === 0 ? (
            <p className="status-card__value">{t("common.loading")}</p>
          ) : null}

          {status === "error" ? (
            <div className="status-card status-card--error">
              <p className="status-card__value">{errorMessage}</p>
            </div>
          ) : null}

          {status === "ready" && photos.length === 0 ? (
            <p className="status-card__value">{t("photo.emptyState")}</p>
          ) : null}

          {photos.length > 0 ? (
            <ul className="parcel-list">
              {photos.map((photo) => (
                <PhotoListItem key={photo.id} photo={photo} onDelete={deactivatePhoto} />
              ))}
            </ul>
          ) : null}
        </>
      )}
    </main>
  );
}

function PhotoListItem({ photo, onDelete }: { photo: Photo; onDelete: (id: string) => Promise<void> }) {
  const { t } = useTranslation();

  const handleDelete = async () => {
    const confirmed = window.confirm(t("photo.deleteConfirm"));
    if (!confirmed) return;
    await onDelete(photo.id);
  };

  return (
    <li>
      <div className="parcel-list__item">
        <img
          src={photo.filePath}
          alt=""
          style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }}
        />
        <button
          type="button"
          className="lock-screen__button lock-screen__button--danger"
          onClick={handleDelete}
        >
          {t("photo.deleteButton")}
        </button>
      </div>
    </li>
  );
}
