/**
 * GeminiProvider Testleri
 * ==========================
 * bkz. ADR 0024. Gerçek `@google/genai` çağrısı YAPILMIYOR (mock'landı)
 * — Sprint 6'nın kendi talimatı: "Gerçek API çağrıları testlerde
 * kullanılmayacaktır. Mock kullanılacaktır."
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  secureStorage,
} from "../../../native/secureStorage";

let generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function (this: unknown) {
    return { models: { generateContent: (...args: unknown[]) => generateContentMock(...args) } };
  }),
}));

vi.mock("../../../native/secureStorage", () => ({
  secureStorage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
  SecureStorageKey: { GEMINI_API_KEY: "gemini_api_key" },
}));

beforeEach(() => {
  generateContentMock = vi.fn();
  vi.mocked(secureStorage.get).mockReset();
  vi.mocked(secureStorage.get).mockResolvedValue("test-api-key");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GeminiProvider — API Anahtarı", () => {
  it("API anahtarı yapılandırılmamışsa AÇIK bir hata fırlatır (ham teknik metin DEĞİL)", async () => {
    vi.mocked(secureStorage.get).mockResolvedValue(null);
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "test" }])).rejects.toThrow(
      "AI_PROVIDER_API_KEY_NOT_CONFIGURED"
    );
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("her sendMessage() çağrısında GÜNCEL anahtarı okur (cache YOK — kullanıcı Ayarlar'dan değiştirebilir)", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "1" }]);
    vi.mocked(secureStorage.get).mockResolvedValue("yeni-anahtar");
    await geminiProvider.sendMessage([{ role: "user", content: "2" }]);

    expect(secureStorage.get).toHaveBeenCalledTimes(2);
  });
});

describe("GeminiProvider — sendMessage", () => {
  it("basit bir metin yanıtını doğru döndürür (araç çağrısı YOK)", async () => {
    generateContentMock.mockResolvedValue({ text: "Bu ay 3 sulama yaptınız.", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    const result = await geminiProvider.sendMessage([{ role: "user", content: "Kaç sulama yaptım?" }]);

    expect(result.text).toBe("Bu ay 3 sulama yaptınız.");
    expect(result.toolCalls).toEqual([]);
  });

  it("model bir araç çağrısı talep ederse, DOĞRU toolName/arguments ile döner", async () => {
    generateContentMock.mockResolvedValue({
      text: undefined,
      functionCalls: [{ name: "queryParcelData", args: { parcelId: "p1" } }],
    });
    const { geminiProvider } = await import("./GeminiProvider");

    const result = await geminiProvider.sendMessage(
      [{ role: "user", content: "P1 parselinin bilgilerini ver" }],
      { tools: [{ name: "queryParcelData", description: "Parsel bilgisi", parametersJsonSchema: { type: "object" } }] }
    );

    expect(result.toolCalls).toEqual([{ toolName: "queryParcelData", arguments: { parcelId: "p1" } }]);
  });

  it("`role: 'tool'` mesajları Gemini'ye GÖNDERİLMEZ (Content.role sadece user/model kabul eder — filtrelenir)", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([
      { role: "user", content: "soru" },
      { role: "tool", content: "bu asla gonderilmemeli" },
      { role: "model", content: "onceki cevap" },
    ]);

    const sentContents = generateContentMock.mock.calls[0][0].contents;
    expect(sentContents.every((c: { role: string }) => c.role === "user" || c.role === "model")).toBe(true);
    expect(sentContents).toHaveLength(2); // "tool" mesajı filtrelendi
  });

  it("pendingToolResults verilirse, GERÇEK functionResponse Part formatında gönderilir", async () => {
    generateContentMock.mockResolvedValue({ text: "Sonuç: 3 kayıt bulundu.", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }], {
      pendingToolResults: [{ toolName: "queryParcelData", result: { count: 3 } }],
    });

    const sentContents = generateContentMock.mock.calls[0][0].contents;
    const lastContent = sentContents[sentContents.length - 1];
    expect(lastContent.role).toBe("user");
    expect(lastContent.parts[0].functionResponse).toEqual({
      name: "queryParcelData",
      response: { output: { count: 3 } },
    });
  });

  it("tools verilirse, DOĞRU functionDeclarations formatında gönderilir", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }], {
      tools: [{ name: "queryTreeData", description: "Ağaç bilgisi", parametersJsonSchema: { type: "object" } }],
    });

    const sentConfig = generateContentMock.mock.calls[0][0].config;
    expect(sentConfig.tools).toEqual([
      {
        functionDeclarations: [
          { name: "queryTreeData", description: "Ağaç bilgisi", parametersJsonSchema: { type: "object" } },
        ],
      },
    ]);
  });

  it("systemInstruction verilirse, Gemini'nin GERÇEK config.systemInstruction alanına gönderilir", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }], {
      systemInstruction: "Sen bir tarım asistanısın.",
    });

    const sentConfig = generateContentMock.mock.calls[0][0].config;
    expect(sentConfig.systemInstruction).toBe("Sen bir tarım asistanısın.");
  });
});

describe("GeminiProvider — Retry Stratejisi (Web Projesinden BİREBİR Taşınan Mantık)", () => {
  it("kota hatası (RESOURCE_EXHAUSTED) YENİDEN DENENMEZ — tek denemede hata fırlatır", async () => {
    generateContentMock.mockRejectedValue(new Error('{"code":429,"message":"RESOURCE_EXHAUSTED"}'));
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "test" }])).rejects.toThrow();

    expect(generateContentMock).toHaveBeenCalledTimes(1); // retry YOK
  });

  it("geçici bir hata (ör. ağ hatası) YENİDEN DENENİR, sonunda başarılı olursa sonuç döner", async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error("network timeout"))
      .mockResolvedValueOnce({ text: "başarılı", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    const result = await geminiProvider.sendMessage([{ role: "user", content: "test" }]);

    expect(result.text).toBe("başarılı");
    expect(generateContentMock).toHaveBeenCalledTimes(2); // 1 başarısız + 1 başarılı retry
  }, 10000);

  it("geçici hata MAX_RETRY_ATTEMPTS kadar denendikten sonra hâlâ başarısızsa, hatayı fırlatır", async () => {
    generateContentMock.mockRejectedValue(new Error("kalıcı ağ hatası"));
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "test" }])).rejects.toThrow(
      "kalıcı ağ hatası"
    );

    expect(generateContentMock).toHaveBeenCalledTimes(3); // 1 ilk deneme + 2 retry
  }, 10000);
});

describe("GeminiProvider — analyzeImage (Sprint 9.2)", () => {
  it("GERÇEK inlineData formatında (base64+mimeType) görsel gönderir", async () => {
    generateContentMock.mockResolvedValue({ text: "Yapraklar sağlıklı görünüyor.", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    const result = await geminiProvider.analyzeImage("BASE64VERISI", "image/jpeg", "Bu yaprağı analiz et");

    expect(result).toBe("Yapraklar sağlıklı görünüyor.");
    const sentContents = generateContentMock.mock.calls[0][0].contents;
    expect(sentContents[0].parts[0]).toEqual({ inlineData: { data: "BASE64VERISI", mimeType: "image/jpeg" } });
    expect(sentContents[0].parts[1]).toEqual({ text: "Bu yaprağı analiz et" });
  });

  it("systemInstruction verilirse GERÇEK config.systemInstruction alanına gönderilir", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.analyzeImage("BASE64", "image/jpeg", "soru", "Sen bir tarım uzmanısın.");

    const sentConfig = generateContentMock.mock.calls[0][0].config;
    expect(sentConfig.systemInstruction).toBe("Sen bir tarım uzmanısın.");
  });

  it("boş yanıt (response.text yok) AÇIK bir hata fırlatır — sessizce boş sonuç DÖNMEZ", async () => {
    generateContentMock.mockResolvedValue({ text: undefined, functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.analyzeImage("BASE64", "image/jpeg", "soru")).rejects.toThrow(
      "AI_PHOTO_ANALYSIS_EMPTY_RESPONSE"
    );
  });

  it("API anahtarı yoksa AÇIK bir hata fırlatır (sendMessage ile AYNI kural)", async () => {
    vi.mocked(secureStorage.get).mockResolvedValue(null);
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.analyzeImage("BASE64", "image/jpeg", "soru")).rejects.toThrow(
      "AI_PROVIDER_API_KEY_NOT_CONFIGURED"
    );
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("kota hatası (RESOURCE_EXHAUSTED) YENİDEN DENENMEZ (sendMessage ile AYNI retry mantığı)", async () => {
    generateContentMock.mockRejectedValue(new Error('{"code":429,"message":"RESOURCE_EXHAUSTED"}'));
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.analyzeImage("BASE64", "image/jpeg", "soru")).rejects.toThrow();

    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});
