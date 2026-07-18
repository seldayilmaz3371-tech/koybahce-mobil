/**
 * getActiveAiProvider Testleri
 * ===============================
 * bkz. Sprint 9.2. Bu davranış ÖNCEDEN AiSessionService.test.ts
 * içinde dolaylı olarak test ediliyordu — artık doğrudan test
 * ediliyor (çıkarma sonrası).
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { aiSettingsRepository } from "../data/aiSettings.repository";
import { providerRegistry } from "../providers/ProviderRegistry";
import type { AIProvider } from "../providers/AIProvider.interface";
import { getActiveAiProvider } from "./getActiveAiProvider";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

function fakeProvider(): AIProvider {
  return {
    providerName: "gemini",
    sendMessage: async () => ({ text: "test", toolCalls: [] }),
    analyzeImage: async () => "test",
  };
}

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("getActiveAiProvider", () => {
  it("isEnabled=false iken AI_NOT_ENABLED hatası fırlatır", async () => {
    providerRegistry.register(fakeProvider());

    await expect(getActiveAiProvider()).rejects.toThrow("AI_NOT_ENABLED");
  });

  it("isEnabled=true AMA internetPermission=false iken AI_INTERNET_PERMISSION_DENIED hatası fırlatır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: false });
    providerRegistry.register(fakeProvider());

    await expect(getActiveAiProvider()).rejects.toThrow("AI_INTERNET_PERMISSION_DENIED");
  });

  it("kayıtlı olmayan bir provider için AI_PROVIDER_NOT_REGISTERED hatası fırlatır", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({
      isEnabled: true,
      internetPermission: true,
      providerName: "hic-kayitli-olmayan",
    });

    await expect(getActiveAiProvider()).rejects.toThrow("AI_PROVIDER_NOT_REGISTERED");
  });

  it("her iki izin de açık ve provider kayıtlıysa, provider + settings döner", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    const provider = fakeProvider();
    providerRegistry.register(provider);

    const result = await getActiveAiProvider();

    expect(result.provider).toBe(provider);
    expect(result.settings.isEnabled).toBe(true);
  });
});
