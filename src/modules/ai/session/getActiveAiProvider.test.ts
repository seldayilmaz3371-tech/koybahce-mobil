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
<<<<<<< HEAD

describe("getActiveAiProvider — Diagnostic Entegrasyonu (Sprint 10.9, GERÇEK CİHAZ BULGUSU DÜZELTMESİ)", () => {
  it("🔴 KULLANICININ TAM OLARAK GÖRDÜĞÜ SENARYO: internetPermission=false (varsayılan) İKEN, aiDiagnostics ARTIK 'idle'da TAKILI KALMIYOR", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    await aiSettingsRepository.getOrCreate(); // internetPermission VARSAYILAN false
    await aiSettingsRepository.update({ isEnabled: true }); // AMA internetPermission HİÇ değiştirilmedi
    providerRegistry.register(fakeProvider());

    await expect(getActiveAiProvider()).rejects.toThrow("AI_INTERNET_PERMISSION_DENIED");

    const snapshot = aiDiagnostics.getSnapshot();
    // ÖNCEDEN: stage HER ZAMAN "idle" kalıyordu (kullanıcının gerçek
    // cihaz raporu). ŞİMDİ: stage GERÇEKTEN "error"a geçiyor.
    expect(snapshot.stage).toBe("error");
    expect(snapshot.requestId).not.toBeNull();
    expect(snapshot.rawError?.message).toBe("AI_INTERNET_PERMISSION_DENIED");
  });

  it("isEnabled=false İSE de, aiDiagnostics GERÇEKTEN 'error' aşamasına geçer (idle'da KALMAZ)", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    providerRegistry.register(fakeProvider());

    await expect(getActiveAiProvider()).rejects.toThrow("AI_NOT_ENABLED");

    expect(aiDiagnostics.getSnapshot().stage).toBe("error");
    expect(aiDiagnostics.getSnapshot().rawError?.message).toBe("AI_NOT_ENABLED");
  });

  it("provider kayıtlı DEĞİLSE de, aiDiagnostics GERÇEKTEN 'error' aşamasına geçer", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({
      isEnabled: true,
      internetPermission: true,
      providerName: "hic-kayitli-olmayan",
    });

    await expect(getActiveAiProvider()).rejects.toThrow("AI_PROVIDER_NOT_REGISTERED");

    expect(aiDiagnostics.getSnapshot().stage).toBe("error");
    expect(aiDiagnostics.getSnapshot().rawError?.message).toBe("AI_PROVIDER_NOT_REGISTERED");
  });

  it("BAŞARILI bir provider alma, aiDiagnostics'i 'provider_obtained' aşamasına GERÇEKTEN geçirir (artık idle'da kalmaz)", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });
    providerRegistry.register(fakeProvider());

    await getActiveAiProvider();

    expect(aiDiagnostics.getSnapshot().stage).toBe("provider_obtained");
    expect(aiDiagnostics.getSnapshot().requestId).not.toBeNull();
  });
});
=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
