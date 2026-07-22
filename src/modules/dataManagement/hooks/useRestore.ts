/**
 * useRestore Hook
 * ==================
 * bkz. Sprint 10.13. Akış: FilePicker ile ZIP seç → doğrula → (geçersizse
 * DM_002 ile dur) → kullanıcı onayı bekle (UI katmanında, `window.confirm`
 * established pattern — bkz. `handleRemoveApiKey`) → onaylanırsa
 * `restoreFromBackup()` çalıştır.
 *
 * Bu hook, KULLANICI ONAYINI kendi içinde YÖNETMEZ (established pattern:
 * `AiSettingsScreen`'deki `window.confirm` çağrısı gibi, onay UI
 * katmanının sorumluluğu) — `pickAndValidate()` ile `confirmAndRestore()`
 * İKİ AYRI adım olarak sunuluyor, ekran bu ikisi arasında `window.confirm`
 * çağırır.
 */

import { useCallback, useState } from "react";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Filesystem } from "@capacitor/filesystem";
import { validateAndParseBackup, restoreFromBackup, type ParsedBackup } from "../services/restoreService";
import { mapDataManagementError } from "../../../core/errors/mapDataManagementError";
import { ErrorCode, type ErrorCodeValue } from "../../../core/errors/errorCodes";
import type { RestoreProgress, RestoreResult } from "../domain/dataManagement.types";

type UseRestoreStatus =
  | "idle"
  | "picking"
  | "validating"
  | "awaiting_confirmation"
  | "restoring"
  | "success"
  | "error";

export interface UseRestoreResult {
  status: UseRestoreStatus;
  errorCode: ErrorCodeValue | null;
  progress: RestoreProgress | null;
  restoreResult: RestoreResult | null;
  /** Kullanıcı dosya seçer, GERÇEK doğrulama yapılır. Geçerliyse `awaiting_confirmation` durumuna geçer. */
  pickAndValidate: () => Promise<void>;
  /** Kullanıcı onayı SONRASI çağrılır — GERÇEK geri yükleme akışını başlatır. */
  confirmAndRestore: () => Promise<void>;
  reset: () => void;
}

export function useRestore(): UseRestoreResult {
  const [status, setStatus] = useState<UseRestoreStatus>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [parsedBackup, setParsedBackup] = useState<ParsedBackup | null>(null);

  const pickAndValidate = useCallback(async () => {
    setStatus("picking");
    setErrorCode(null);
    try {
      // GERÇEK GÜVENLİK NOTU (bkz. dosyanın kendi dokümantasyonu):
      // `readData: true` KULLANILMIYOR — resmi eklenti dokümantasyonu
      // bunun BÜYÜK dosyalarda "app crash" riski taşıdığını AÇIKÇA
      // belirtiyor. Bunun yerine `path` alınıp `Filesystem.readFile`
      // ile GÜVENLE okunuyor.
      const pickResult = await FilePicker.pickFiles({ types: ["application/zip"], limit: 1 });
      const file = pickResult.files[0];
      if (!file?.path) {
        setErrorCode(ErrorCode.DM_006);
        setStatus("error");
        return;
      }

      setStatus("validating");
      const readResult = await Filesystem.readFile({ path: file.path });
      const base64 = typeof readResult.data === "string" ? readResult.data : "";

      const parsed = await validateAndParseBackup(base64);
      if (!parsed) {
        setErrorCode(mapDataManagementError("DM_002"));
        setStatus("error");
        return;
      }

      setParsedBackup(parsed);
      setStatus("awaiting_confirmation");
    } catch (error) {
      setErrorCode(mapDataManagementError(error));
      setStatus("error");
    }
  }, []);

  const confirmAndRestore = useCallback(async () => {
    if (!parsedBackup) return;
    setStatus("restoring");
    try {
      const result = await restoreFromBackup(parsedBackup, (p) => setProgress(p));
      setRestoreResult(result);
      if (!result.success) {
        setErrorCode(mapDataManagementError(result.errorCode ?? "DM_004"));
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch (error) {
      setErrorCode(mapDataManagementError(error));
      setStatus("error");
    }
  }, [parsedBackup]);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorCode(null);
    setProgress(null);
    setRestoreResult(null);
    setParsedBackup(null);
  }, []);

  return { status, errorCode, progress, restoreResult, pickAndValidate, confirmAndRestore, reset };
}
