/**
 * getActiveAiProvider
 * =======================
 * bkz. Sprint 9.2. `AiSessionService.sendUserMessage()`'ın izin
 * kontrolü + provider alma mantığından ÇIKARILDI (Kural: "Kod
 * tekrarından kaçın") — Fotoğraf Analizi (Sprint 9.2) de AYNI izin
 * kapısına (Bölüm 15 — güvenli varsayılanlar) ve AYNI provider alma
 * mantığına ihtiyaç duyuyor. Davranış DEĞİŞMEDİ — saf bir çıkarma.
 *
 * bkz. Sprint 10.9, GERÇEK BULGU (kullanıcının gerçek cihaz
 * testleriyle KANITLANDI — Diagnostic ekranı her zaman
 * `stage: idle` gösteriyordu, Error Code her zaman AI_002 kalıyordu):
 * Bu fonksiyon ÖNCEDEN `aiDiagnostics`'e HİÇ dokunmuyordu — sadece
 * `GeminiProvider.sendMessage()`/`analyzeImage()` `startNewRequest()`
 * çağırıyordu. İzin kontrolü (satır ~40'taki `internetPermission`
 * kontrolü) başarısız olduğunda, akış `GeminiProvider`'a HİÇ
 * ULAŞMIYORDU — bu yüzden `aiDiagnostics` hiçbir zaman
 * güncellenmiyordu, `stage` sonsuza kadar "idle" kalıyordu. DÜZELTME:
 * bu fonksiyon artık KENDİSİ `aiDiagnostics.startNewRequest()`'i en
 * başta çağırıyor, her başarısızlık durumunda da `recordRawError()`
 * ile HAM hatayı kaydediyor — izin kontrolü nerede başarısız olursa
 * olsun, artık Diagnostic ekranında GERÇEKTEN gözlemlenebilir.
 */

import { aiSettingsRepository } from "../data/aiSettings.repository";
import { providerRegistry } from "../providers/ProviderRegistry";
import { aiDiagnostics } from "../diagnostics/aiDiagnostics";
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
  aiDiagnostics.startNewRequest();
  const settings = await aiSettingsRepository.getOrCreate();

  if (!settings.isEnabled) {
    const error = new Error("AI_NOT_ENABLED");
    aiDiagnostics.recordRawError(error);
    throw error;
  }
  if (!settings.internetPermission) {
    const error = new Error("AI_INTERNET_PERMISSION_DENIED");
    aiDiagnostics.recordRawError(error);
    throw error;
  }

  const provider = providerRegistry.get(settings.providerName);
  if (!provider) {
    const error = new Error("AI_PROVIDER_NOT_REGISTERED");
    aiDiagnostics.recordRawError(error);
    throw error;
  }

  return { provider, settings };
}
