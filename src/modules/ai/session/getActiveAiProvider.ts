/**
 * getActiveAiProvider
 * =======================
 * bkz. Sprint 9.2. `AiSessionService.sendUserMessage()`'ın izin
 * kontrolü + provider alma mantığından ÇIKARILDI (Kural: "Kod
 * tekrarından kaçın") — Fotoğraf Analizi (Sprint 9.2) de AYNI izin
 * kapısına (Bölüm 15 — güvenli varsayılanlar) ve AYNI provider alma
 * mantığına ihtiyaç duyuyor. Davranış DEĞİŞMEDİ — saf bir çıkarma.
 */

import { aiSettingsRepository } from "../data/aiSettings.repository";
import { providerRegistry } from "../providers/ProviderRegistry";
import type { AIProvider } from "../providers/AIProvider.interface";
import type { AiSettings } from "../domain/ai.types";

export interface ActiveAiProvider {
  provider: AIProvider;
  settings: AiSettings;
}

/**
 * AI ayarlarını okur, güvenli varsayılan izin kapısını (Bölüm 15)
 * uygular, kayıtlı sağlayıcıyı döner. Hiçbiri sağlanmazsa AÇIK bir
 * hata fırlatır (`AI_NOT_ENABLED`/`AI_INTERNET_PERMISSION_DENIED`/
 * `AI_PROVIDER_NOT_REGISTERED`) — `mapAiError` bunları çevirir.
 */
export async function getActiveAiProvider(): Promise<ActiveAiProvider> {
  const settings = await aiSettingsRepository.getOrCreate();

  if (!settings.isEnabled) {
    throw new Error("AI_NOT_ENABLED");
  }
  if (!settings.internetPermission) {
    throw new Error("AI_INTERNET_PERMISSION_DENIED");
  }

  const provider = providerRegistry.get(settings.providerName);
  if (!provider) {
    throw new Error("AI_PROVIDER_NOT_REGISTERED");
  }

  return { provider, settings };
}
