/**
 * ProviderRegistry
 * ===================
 * bkz. ADR 0024 Karar 1. Web projesinde (`gemini-client.ts`) emsali
 * YOK — web tek bir tembel-başlatılan singleton kullanıyor, registry
 * deseni yok. Bu, bilinçli bir genişletme (Ek Revizyon 1).
 *
 * Basit bir `Map<string, AIProvider>` sarmalayıcısı — kullanıcının
 * istediği "gerçek registry mantığı" (`register`/`get`/`list`)
 * karşılanıyor, ama GEREKSİZ karmaşıklık (ör. öncelik sıralaması,
 * yaşam döngüsü olayları) EKLENMİYOR — bugün ihtiyaç yok (YAGNI).
 */

import type { AIProvider } from "./AIProvider.interface";

class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.providerName, provider);
  }

  get(providerName: string): AIProvider | null {
    return this.providers.get(providerName) ?? null;
  }

  list(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

export const providerRegistry = new ProviderRegistry();
