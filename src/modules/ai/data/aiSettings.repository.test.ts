/**
 * AiSettingsRepository Testleri
 * ================================
 * bkz. ADR 0024, Sprint 6.
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { aiSettingsRepository } from "./aiSettings.repository";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("AiSettingsRepository — getOrCreate", () => {
  it("ilk çağrıda GÜVENLİ varsayılanlarla bir satır oluşturur (Bölüm 15 — internet izni KAPALI, AI KAPALI)", async () => {
    const settings = await aiSettingsRepository.getOrCreate();

    expect(settings.isEnabled).toBe(false);
    expect(settings.internetPermission).toBe(false);
    expect(settings.apiKeyConfigured).toBe(false);
    expect(settings.providerName).toBe("gemini");
  });

  it("ikinci çağrıda AYNI satırı döndürür, YENİ bir satır OLUŞTURMAZ", async () => {
    const first = await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.update({ isEnabled: true });

    const second = await aiSettingsRepository.getOrCreate();

    expect(second.isEnabled).toBe(true); // ilk update KORUNDU, sıfırlanmadı
    expect(second.createdAt).toBe(first.createdAt); // aynı satır
  });
});

describe("AiSettingsRepository — update", () => {
  it("sadece verilen alanları değiştirir, diğerleri KORUNUR", async () => {
    await aiSettingsRepository.getOrCreate();

    await aiSettingsRepository.update({ isEnabled: true, internetPermission: true });

    const settings = await aiSettingsRepository.getOrCreate();
    expect(settings.isEnabled).toBe(true);
    expect(settings.internetPermission).toBe(true);
    expect(settings.responseLanguage).toBe("tr"); // değişmedi
  });

  it("boolean alanlar SQLite'ta doğru 0/1 olarak saklanır (gerçek dönüşüm testi)", async () => {
    await aiSettingsRepository.getOrCreate();

    await aiSettingsRepository.update({ debugMode: true });
    let settings = await aiSettingsRepository.getOrCreate();
    expect(settings.debugMode).toBe(true);

    await aiSettingsRepository.update({ debugMode: false });
    settings = await aiSettingsRepository.getOrCreate();
    expect(settings.debugMode).toBe(false);
  });

  it("update() satır HENÜZ yoksa bile önce oluşturup sonra günceller (getOrCreate garantisi)", async () => {
    // Bilerek getOrCreate() önce ÇAĞRILMADI — update()'in kendi
    // başına çalışabildiğini kanıtlıyoruz.
    await aiSettingsRepository.update({ isEnabled: true });

    const settings = await aiSettingsRepository.getOrCreate();
    expect(settings.isEnabled).toBe(true);
  });

  it("providerName GÜNCELLENEBİLİR — provider-bağımsız veri modeli (ADR 0024 Karar 4)", async () => {
    await aiSettingsRepository.getOrCreate();

    await aiSettingsRepository.update({ providerName: "openai" });

    const settings = await aiSettingsRepository.getOrCreate();
    expect(settings.providerName).toBe("openai");
  });
});

describe("AiSettingsRepository — setApiKeyConfigured", () => {
  it("anahtarın KENDİSİNİ almadan, sadece 'var mı' bayrağını günceller", async () => {
    await aiSettingsRepository.getOrCreate();

    await aiSettingsRepository.setApiKeyConfigured(true);

    const settings = await aiSettingsRepository.getOrCreate();
    expect(settings.apiKeyConfigured).toBe(true);
  });

  it("false ile geri alınabilir (anahtar silindiğinde)", async () => {
    await aiSettingsRepository.getOrCreate();
    await aiSettingsRepository.setApiKeyConfigured(true);

    await aiSettingsRepository.setApiKeyConfigured(false);

    const settings = await aiSettingsRepository.getOrCreate();
    expect(settings.apiKeyConfigured).toBe(false);
  });
});
