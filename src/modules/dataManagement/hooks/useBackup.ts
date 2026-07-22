/**
 * useBackup Hook
 * =================
 * bkz. Sprint 10.13. Mevcut hook standardıyla (Finance/Maintenance)
 * tutarlı ince sarmalayıcı — `createFullBackup()` servisini çağırır,
 * başarılıysa native paylaşım menüsünü açar (kullanıcının açık talebi:
 * "Yedek oluşturulduktan sonra Android paylaşım menüsü açılsın").
 */

import { useCallback, useState } from "react";
import { Share } from "@capacitor/share";
import { createFullBackup } from "../services/backupService";
import { mapDataManagementError } from "../../../core/errors/mapDataManagementError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

type UseBackupStatus = "idle" | "creating" | "success" | "error";

export interface UseBackupResult {
  status: UseBackupStatus;
  errorCode: ErrorCodeValue | null;
  createBackup: () => Promise<void>;
  reset: () => void;
}

export function useBackup(): UseBackupResult {
  const [status, setStatus] = useState<UseBackupStatus>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);

  const createBackup = useCallback(async () => {
    setStatus("creating");
    setErrorCode(null);
    try {
      const result = await createFullBackup();
      if (!result.success || !result.filePath) {
        setErrorCode(mapDataManagementError(result.errorCode ?? "DM_001"));
        setStatus("error");
        return;
      }
      // bkz. kullanıcının açık talebi: "Android paylaşım menüsü
      // açılsın veya kullanıcı istediği klasöre kaydedebilsin." —
      // `Share.share({files: [...]})`, Android'in kendi paylaşım
      // sayfasını açar; bu sayfa "Dosyalarım'a Kaydet" gibi
      // seçenekleri ZATEN içerir (native davranış) — ayrı bir "klasöre
      // kaydet" akışı EKLEMEK gerekmiyor (kod tekrarı/gereksiz
      // karmaşıklık olurdu).
      await Share.share({ files: [result.filePath], title: "Bahçem Mobile Yedek" });
      setStatus("success");
    } catch (error) {
      setErrorCode(mapDataManagementError(error));
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorCode(null);
  }, []);

  return { status, errorCode, createBackup, reset };
}
