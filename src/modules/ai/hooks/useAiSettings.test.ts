// @vitest-environment jsdom
/**
 * useAiSettings Hook Testleri
 * ==============================
 * bkz. ADR 0024.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { secureStorage } from "../../../native/secureStorage";
import { useAiSettings } from "./useAiSettings";

vi.mock("../../../native/secureStorage", () => ({
  secureStorage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  SecureStorageKey: { GEMINI_API_KEY: "gemini_api_key" },
}));

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
  vi.mocked(secureStorage.set).mockReset().mockResolvedValue(undefined);
  vi.mocked(secureStorage.remove).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("useAiSettings", () => {
  it("başlangıçta güvenli varsayılanları yükler", async () => {
    const { result } = renderHook(() => useAiSettings());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.settings?.isEnabled).toBe(false);
    expect(result.current.settings?.internetPermission).toBe(false);
  });

  it("updateSettings() sonrası ayarlar GÜNCELLENMİŞ olarak yeniden yüklenir", async () => {
    const { result } = renderHook(() => useAiSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.updateSettings({ isEnabled: true, internetPermission: true });

    await waitFor(() => expect(result.current.settings?.isEnabled).toBe(true));
    expect(result.current.settings?.internetPermission).toBe(true);
  });

  it("saveApiKey() Secure Storage'a yazar VE apiKeyConfigured bayrağını true yapar", async () => {
    const { result } = renderHook(() => useAiSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.saveApiKey("gizli-anahtar-123");

    expect(secureStorage.set).toHaveBeenCalledWith("gemini_api_key", "gizli-anahtar-123");
    await waitFor(() => expect(result.current.settings?.apiKeyConfigured).toBe(true));
  });

  it("removeApiKey() Secure Storage'dan siler VE apiKeyConfigured bayrağını false yapar", async () => {
    const { result } = renderHook(() => useAiSettings());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await result.current.saveApiKey("gizli-anahtar-123");
    await waitFor(() => expect(result.current.settings?.apiKeyConfigured).toBe(true));

    await result.current.removeApiKey();

    expect(secureStorage.remove).toHaveBeenCalledWith("gemini_api_key");
    await waitFor(() => expect(result.current.settings?.apiKeyConfigured).toBe(false));
  });
});
