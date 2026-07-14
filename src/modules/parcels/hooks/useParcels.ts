/**
 * useParcels Hook
 * =================
 *
 * MİMARİ KARAR (Modül 2 Mimari Doğrulaması, 2026-07-14):
 * Bu hook, `parcelRepository`'nin İNCE bir React sarmalayıcısıdır —
 * hiçbir iş mantığı içermez. Bunun iki bilinçli gerekçesi var:
 *
 *   1. AI Tool Calling uyumluluğu (bkz. AI Master Architecture Bölüm 7):
 *      Gelecekte AI'nin çağıracağı `queryParcelData` gibi araçlar,
 *      bu hook'u DEĞİL, doğrudan `parcelRepository`'yi kullanacak —
 *      hook React bileşen ağacına bağımlı, AI orkestrasyon katmanı
 *      değil. İş mantığını repository'de tutmak, iki farklı
 *      tüketicinin (UI ve AI) aynı tek gerçek kaynağı paylaşmasını
 *      sağlıyor.
 *   2. Cache/senkronizasyon genişletilebilirliği: Bugün önbellekleme
 *      YOK (Modül 2 Mimari Tasarımı — SQLite okuması zaten hızlı,
 *      YAGNI). İleride gerekirse, bu hook'un dışa açık arayüzü
 *      (`{ parcels, status, ... }`) DEĞİŞMEDEN, sadece `refetch`'in
 *      içi (ör. önce cache'e bak) değişir — tüketen bileşenler
 *      etkilenmez.
 */

import { useCallback, useEffect, useState } from "react";
import { parcelRepository } from "../data/parcel.repository";
import type { ParcelListOptions } from "../data/parcel.repository.interface";
import type { NewParcelInput, Parcel, ParcelUpdateInput } from "../domain/parcel.types";

type ParcelsStatus = "idle" | "loading" | "ready" | "error";

export interface UseParcelsResult {
  parcels: Parcel[];
  status: ParcelsStatus;
  /** Hata mesajı (varsa) — kullanıcıya gösterilecek metin `t()` ile ÇAĞIRAN bileşende üretilmeli, burada ham hata metni tutulur. */
  errorMessage: string | null;
  refetch: () => Promise<void>;
  createParcel: (input: NewParcelInput) => Promise<void>;
  updateParcel: (id: string, changes: ParcelUpdateInput) => Promise<void>;
  deactivateParcel: (id: string) => Promise<void>;
}

export function useParcels(options: ParcelListOptions = {}): UseParcelsResult {
  const { activeOnly, limit, offset, search, sortBy } = options;

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [status, setStatus] = useState<ParcelsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await parcelRepository.list({ activeOnly, limit, offset, search, sortBy });
      setParcels(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
    // `options` nesnesinin referansı her render'da değişebileceği için
    // (çağıran taraf literal `{}` geçebilir), bağımlılık dizisinde
    // nesnenin kendisi değil, ilkel alanları kullanılıyor — sonsuz
    // döngüyü önlemek için bilinçli bir tercih.
  }, [activeOnly, limit, offset, search, sortBy]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createParcel = useCallback(
    async (input: NewParcelInput) => {
      await parcelRepository.create(input);
      await refetch();
    },
    [refetch]
  );

  const updateParcel = useCallback(
    async (id: string, changes: ParcelUpdateInput) => {
      await parcelRepository.update(id, changes);
      await refetch();
    },
    [refetch]
  );

  const deactivateParcel = useCallback(
    async (id: string) => {
      await parcelRepository.deactivate(id);
      await refetch();
    },
    [refetch]
  );

  return { parcels, status, errorMessage, refetch, createParcel, updateParcel, deactivateParcel };
}
