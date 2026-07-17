/**
 * useAiSettings Hook
 * =====================
 * bkz. ADR 0024, Bölüm 15. Mevcut hook standardıyla (Finance/
 * Maintenance) tutarlı ince sarmalayıcı — ama TEK satırlık bir ayar
 * nesnesi olduğu için sayfalama/dual-scope YOK (Kural 4).
 */

import { useCallback, useEffect, useState } from "react";
import { aiSettingsRepository } from "../data/aiSettings.repository";
import type { AiSettings, AiSettingsUpdateInput } from "../domain/ai.types";
import { secureStorage, SecureStorageKey } from "../../../native/secureStorage";
import { mapAiError } from "../../../core/errors/mapAiError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

type UseAiSettingsStatus = "idle" | "loading" | "ready" | "error";

export interface UseAiSettingsResult {
  settings: AiSettings | null;
  status: UseAiSettingsStatus;
  errorCode: ErrorCodeValue | null;
  updateSettings: (changes: AiSettingsUpdateInput) => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  removeApiKey: () => Promise<void>;
}

export function useAiSettings(): UseAiSettingsResult {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [status, setStatus] = useState<UseAiSettingsStatus>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);

  const refetch = useCallback(async () => {
    setStatus("loading");
    setErrorCode(null);
    try {
      setSettings(await aiSettingsRepository.getOrCreate());
      setStatus("ready");
    } catch (error) {
      setErrorCode(mapAiError(error));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateSettings = useCallback(
    async (changes: AiSettingsUpdateInput) => {
      await aiSettingsRepository.update(changes);
      await refetch();
    },
    [refetch]
  );

  const saveApiKey = useCallback(
    async (apiKey: string) => {
      await secureStorage.set(SecureStorageKey.GEMINI_API_KEY, apiKey);
      await aiSettingsRepository.setApiKeyConfigured(true);
      await refetch();
    },
    [refetch]
  );

  const removeApiKey = useCallback(async () => {
    await secureStorage.remove(SecureStorageKey.GEMINI_API_KEY);
    await aiSettingsRepository.setApiKeyConfigured(false);
    await refetch();
  }, [refetch]);

  return { settings, status, errorCode, updateSettings, saveApiKey, removeApiKey };
}
