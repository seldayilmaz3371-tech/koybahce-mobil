import { beforeEach, describe, expect, it } from "vitest";
import type { AIProvider, AIProviderResponse } from "./AIProvider.interface";

// Her testte TEMİZ bir registry için modülü yeniden import ediyoruz
// (singleton state, testler arası sızmasın diye).
async function freshRegistry() {
  const mod = await import("./ProviderRegistry");
  return mod.providerRegistry;
}

function fakeProvider(name: string): AIProvider {
  return {
    providerName: name,
    async sendMessage(): Promise<AIProviderResponse> {
      return { text: `${name} yanıtı`, toolCalls: [] };
    },
    async analyzeImage(): Promise<string> {
      return `${name} analiz sonucu`;
    },
  };
}

describe("ProviderRegistry", () => {
  beforeEach(async () => {
    const { providerRegistry } = await import("./ProviderRegistry");
    // Singleton'ı test-arası temizlemek için: modül önbelleğini
    // sıfırlamak yerine, her testte KENDİ sağlayıcılarımızı ekleyip
    // sadece onları doğruluyoruz (başka testlerin eklediği sağlayıcılar
    // varlığını etkilemiyor, sadece `list().length` gibi kesin sayı
    // beklemiyoruz).
    void providerRegistry;
  });

  it("register() sonrası get() ile AYNI provider döner", async () => {
    const registry = await freshRegistry();
    const provider = fakeProvider("test-provider-1");

    registry.register(provider);

    expect(registry.get("test-provider-1")).toBe(provider);
  });

  it("kayıtlı olmayan bir provider için get() null döner", async () => {
    const registry = await freshRegistry();
    expect(registry.get("hic-kayitli-olmayan")).toBeNull();
  });

  it("list() kayıtlı TÜM provider'ları içerir", async () => {
    const registry = await freshRegistry();
    const providerA = fakeProvider("test-provider-a");
    const providerB = fakeProvider("test-provider-b");

    registry.register(providerA);
    registry.register(providerB);

    const list = registry.list();
    expect(list).toContain(providerA);
    expect(list).toContain(providerB);
  });

  it("aynı isimle tekrar register() edilirse ESKİSİNİN yerine geçer (üzerine yazar)", async () => {
    const registry = await freshRegistry();
    const first = fakeProvider("test-provider-overwrite");
    const second = fakeProvider("test-provider-overwrite");

    registry.register(first);
    registry.register(second);

    expect(registry.get("test-provider-overwrite")).toBe(second);
    expect(registry.get("test-provider-overwrite")).not.toBe(first);
  });
});
