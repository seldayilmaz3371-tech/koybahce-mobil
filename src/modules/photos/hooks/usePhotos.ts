/**
 * usePhotos Hook
 * ================
 * `useTrees` ile aynı ince sarmalayıcı deseni (Kural 12). Sayfalama
 * YOK — Ağaç'taki gerekçenin aynısı: bir gözleme bağlı fotoğraf
 * sayısı tipik olarak az (Sprint 3.6 Veri Modeli Doğrulaması Madde 3
 * — "sınır bugün yok", ama pratikte bir çekim oturumunda birkaç
 * fotoğraf olması beklenir, Observation'ın yıllar boyunca biriken
 * yüzlerce kaydından farklı bir ölçek).
 *
 * FOTOĞRAF EKLEME BU HOOK'TA YOK (bilinçli): Kamera/galeri yakalama +
 * kalıcı depoya kopyalama, native yan etkiler içeriyor (ObservationForm/
 * TreeForm'daki gibi salt CRUD değil) — bu orkestrasyon
 * `PhotoGalleryScreen`'de, `native/camera.ts` + `native/filesystem.ts`
 * + `photoRepository.create()` birlikte kullanılarak yapılıyor. Hook
 * sadece listeleme ve silme sağlıyor.
 */

import { useCallback, useEffect, useState } from "react";
import { photoRepository } from "../data/photo.repository";
import type { Photo } from "../domain/photo.types";
import { mapSqliteError } from "../../../core/errors/mapSqliteError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

type PhotosStatus = "idle" | "loading" | "ready" | "error";

export interface UsePhotosResult {
  photos: Photo[];
  status: PhotosStatus;
  errorMessage: string | null;
  errorCode: ErrorCodeValue | null;
  refetch: () => Promise<void>;
  deactivatePhoto: (id: string) => Promise<void>;
}

export function usePhotos(observationId: string): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<PhotosStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);
    try {
      const result = await photoRepository.listByObservation(observationId);
      setPhotos(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorCode(mapSqliteError(error));
      setStatus("error");
    }
  }, [observationId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const deactivatePhoto = useCallback(
    async (id: string) => {
      await photoRepository.deactivate(id);
      await refetch();
    },
    [refetch]
  );

  return { photos, status, errorMessage, errorCode, refetch, deactivatePhoto };
}
