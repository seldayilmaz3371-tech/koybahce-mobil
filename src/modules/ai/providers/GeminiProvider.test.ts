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
      // bkz. Sprint 10.10 — GERÇEK SDK yapısı: `functionCalls` getter'ı
      // ARTIK kullanılmıyor (thoughtSignature'ı YAKALAYAMIYORDU), gerçek
      // kod `candidates[0].content.parts`'ı okuyor.
      candidates: [{ content: { role: "model", parts: [{ functionCall: { name: "queryParcelData", args: { parcelId: "p1" } } }] } }],
    });
    const { geminiProvider } = await import("./GeminiProvider");

    const result = await geminiProvider.sendMessage(
      [{ role: "user", content: "P1 parselinin bilgilerini ver" }],
      { tools: [{ name: "queryParcelData", description: "Parsel bilgisi", parametersJsonSchema: { type: "object" } }] }
    );

    expect(result.toolCalls).toEqual([{ toolName: "queryParcelData", arguments: { parcelId: "p1" }, thoughtSignature: undefined }]);
  });

  it("🔴 GERÇEK KÖK NEDEN DÜZELTMESİ (Sprint 10.10): model bir thoughtSignature İLE araç çağırırsa, bu GERÇEKTEN yakalanır (ÖNCEDEN response.functionCalls getter'ı bunu YAPISAL OLARAK yakalayamıyordu)", async () => {
    generateContentMock.mockResolvedValue({
      text: undefined,
      candidates: [
        {
          content: {
            role: "model",
            parts: [
              {
                functionCall: { name: "queryParcelData", args: { parcelId: "p1" } },
                thoughtSignature: "BASE64_ENCODED_THOUGHT_ABC123",
              },
            ],
          },
        },
      ],
    });
    const { geminiProvider } = await import("./GeminiProvider");

    const result = await geminiProvider.sendMessage([{ role: "user", content: "P1 parselinin bilgilerini ver" }], {
      tools: [{ name: "queryParcelData", description: "Parsel bilgisi", parametersJsonSchema: { type: "object" } }],
    });

    expect(result.toolCalls[0].thoughtSignature).toBe("BASE64_ENCODED_THOUGHT_ABC123");
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

  it("🔴 GERÇEK BUG DÜZELTMESİ: role='model' + toolCalls içeren bir mesaj, GERÇEKTEN functionCall Part'ına çevrilir (AI X-Ray denetiminde bulundu, Gemini'nin resmi sözleşmesiyle kanıtlandı)", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage(
      [
        { role: "user", content: "soru" },
        { role: "model", content: "", toolCalls: [{ toolName: "queryParcelData", arguments: { limit: 5 } }] },
      ],
      { pendingToolResults: [{ toolName: "queryParcelData", result: { count: 3 } }] }
    );

    const sentContents = generateContentMock.mock.calls[0][0].contents;
    // Sıra: [user, model(functionCall), user(functionResponse)] — Gemini'nin
    // resmi örneğiyle (ai.google.dev) BİREBİR aynı yapı.
    expect(sentContents).toHaveLength(3);
    const modelToolCallContent = sentContents[1];
    expect(modelToolCallContent.role).toBe("model");
    expect(modelToolCallContent.parts[0].functionCall).toEqual({
      name: "queryParcelData",
      args: { limit: 5 },
    });
  });

  it("🔴 GERÇEK KÖK NEDEN DÜZELTMESİ (Sprint 10.10): thoughtSignature VARSA, 2. round-trip'e GERÇEKTEN geri gönderilir (Gemini'nin 'thought_signature eksik' 400 hatasının düzeltmesi)", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage(
      [
        { role: "user", content: "soru" },
        {
          role: "model",
          content: "",
          toolCalls: [{ toolName: "queryParcelData", arguments: { limit: 5 }, thoughtSignature: "SIG_XYZ" }],
        },
      ],
      { pendingToolResults: [{ toolName: "queryParcelData", result: { count: 3 } }] }
    );

    const sentContents = generateContentMock.mock.calls[0][0].contents;
    const modelToolCallContent = sentContents[1];
    // thoughtSignature, functionCall'ın İÇİNDE DEĞİL, Part'ın KENDİSİNDE
    // (functionCall ile KARDEŞ bir alan) — resmi tip tanımlarından
    // doğrulandı, testte de AYNI YAPI kontrol ediliyor.
    expect(modelToolCallContent.parts[0].thoughtSignature).toBe("SIG_XYZ");
    expect(modelToolCallContent.parts[0].functionCall).toEqual({ name: "queryParcelData", args: { limit: 5 } });
  });

  it("thoughtSignature YOKSA, Part'a hiç eklenmez (gereksiz 'undefined' alan gönderilmez)", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage(
      [
        { role: "user", content: "soru" },
        { role: "model", content: "", toolCalls: [{ toolName: "queryParcelData", arguments: { limit: 5 } }] },
      ],
      { pendingToolResults: [{ toolName: "queryParcelData", result: { count: 3 } }] }
    );

    const sentContents = generateContentMock.mock.calls[0][0].contents;
    expect("thoughtSignature" in sentContents[1].parts[0]).toBe(false);
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

describe("GeminiProvider — Retry Stratejisi (Web Projesinden BİREBİR Taşınan Mantık, Sprint 10.10'da GERÇEK ApiError formatına düzeltildi)", () => {
  it("kota hatası (429/RESOURCE_EXHAUSTED, GERÇEK ApiError.status formatında) YENİDEN DENENMEZ — tek denemede hata fırlatır", async () => {
    class FakeApiError extends Error {
      status: number;
      constructor() {
        super("You exceeded your current quota");
        this.name = "ApiError";
        this.status = 429;
      }
    }
    generateContentMock.mockRejectedValue(new FakeApiError());
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "test" }])).rejects.toThrow();

    expect(generateContentMock).toHaveBeenCalledTimes(1); // retry YOK
  });

  it("🔴 GERÇEK KÖK NEDEN DÜZELTMESİ (Sprint 10.10): 400 hatası (ör. 'thought_signature eksik') ARTIK RETRY EDİLMİYOR — ÖNCEDEN her 400 hatası GEREKSİZ yere 3 kez Gemini'ye istek gönderip kota TÜKETİYORDU (kullanıcının gerçek cihaz test sırasıyla tutarlı: 400 hataları SONRASI 429/RESOURCE_EXHAUSTED)", async () => {
    class FakeApiError extends Error {
      status: number;
      constructor() {
        super("Function call is missing a thought_signature in functionCall parts");
        this.name = "ApiError";
        this.status = 400;
      }
    }
    generateContentMock.mockRejectedValue(new FakeApiError());
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "test" }])).rejects.toThrow();

    // ÖNCEDEN: bu hata YANLIŞLIKLA "retry edilebilir" sayılıyordu (message
    // içinde '"code":400' aranıyordu, GERÇEK ApiError.message'da bu format
    // YOK) — 3 kez (1+2 retry) istek gönderiliyordu. ŞİMDİ: tek denemede duruyor.
    expect(generateContentMock).toHaveBeenCalledTimes(1);
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

  it("kota hatası (429/RESOURCE_EXHAUSTED, GERÇEK ApiError.status formatında) YENİDEN DENENMEZ (sendMessage ile AYNI retry mantığı)", async () => {
    class FakeApiError extends Error {
      status: number;
      constructor() {
        super("You exceeded your current quota");
        this.name = "ApiError";
        this.status = 429;
      }
    }
    generateContentMock.mockRejectedValue(new FakeApiError());
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.analyzeImage("BASE64", "image/jpeg", "soru")).rejects.toThrow();

    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});

describe("GeminiProvider — Diagnostic Entegrasyonu (Sprint 10.7/10.9, AI Diagnostic Build)", () => {
  it("sendMessage() BAŞARILI olduğunda, aiDiagnostics GERÇEKTEN provider/model/apiKeyStatus/stage kaydeder", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    // bkz. Sprint 10.9 — `startNewRequest()` artık `getActiveAiProvider()`'da
    // çağrılıyor (GERÇEK production akışı), `GeminiProvider`'ın kendisinde
    // DEĞİL — bu test, o katmanı simüle ediyor (`requestStartedAt`'in dolu
    // olması için, aksi halde `durationMs` hesaplanamaz).
    aiDiagnostics.startNewRequest();
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }]);

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.providerName).toBe("gemini");
    expect(snapshot.model).toBe("gemini-flash-latest");
    expect(snapshot.apiKeyStatus).toBe("configured");
    expect(snapshot.stage).toBe("parsed");
    expect(snapshot.durationMs).not.toBeNull();
  });

  it("API anahtarı BOŞSA, aiDiagnostics GERÇEKTEN 'empty' kaydeder (Madde 1 — Boş/null/geçerli)", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    vi.mocked(secureStorage.get).mockResolvedValue(null);
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "soru" }])).rejects.toThrow();

    expect(aiDiagnostics.getSnapshot().apiKeyStatus).toBe("empty");
  });

  it("🔴 Sprint 10.10, Madde 5: sendMessage() BAŞARILI olduğunda, aiDiagnostics GERÇEK anahtarı MASKELİ olarak kaydeder (TAM anahtar ASLA görünmez)", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    // beforeEach'in varsayılanı "test-api-key" (13 karakter).
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }]);

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.apiKeyMasked).toBe("test****-key");
    expect(snapshot.apiKeyMasked).not.toContain("api");
  });

  it("sendMessage() BAŞARISIZ olduğunda, aiDiagnostics GERÇEK ApiError alanlarını (message/status) kaydeder", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    class FakeApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
      }
    }
    generateContentMock.mockRejectedValue(new FakeApiError("API key not valid.", 400));
    const { geminiProvider } = await import("./GeminiProvider");

    await expect(geminiProvider.sendMessage([{ role: "user", content: "soru" }])).rejects.toThrow();

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.rawError?.message).toBe("API key not valid.");
    expect(snapshot.rawError?.status).toBe(400);
    expect(snapshot.httpStatusCode).toBe(400);
  });

  it("analyzeImage() GERÇEK fotoğraf/base64 boyutlarını kaydeder (Madde 8)", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    generateContentMock.mockResolvedValue({ text: "gözlem", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");
    const fakeBase64 = "A".repeat(1000); // 1000 karakter = 1000 byte (base64 ASCII)

    await geminiProvider.analyzeImage(fakeBase64, "image/jpeg", "soru");

    const snapshot = aiDiagnostics.getSnapshot();
    expect(snapshot.photo?.base64SizeBytes).toBe(1000);
    expect(snapshot.photo?.fileSizeBytes).toBe(750); // ~%75 (base64 şişme oranının tersi)
  });

  it("🔴 Sprint 10.11, GERÇEK KÖK NEDEN DÜZELTMESİ: sendMessage(), httpOptions.timeout YERİNE gerçek bir AbortSignal GEÇİRİR (httpOptions.timeout KANITLANMIŞ olarak çalışmıyor — googleapis/js-genai#1277)", async () => {
    generateContentMock.mockResolvedValue({ text: "cevap", functionCalls: undefined });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }]);

    const sentConfig = generateContentMock.mock.calls[0][0].config;
    // httpOptions.timeout ARTIK gönderilmiyor (kanıtlanmış olarak işe
    // yaramıyordu) — gerçek iptal mekanizması abortSignal.
    expect(sentConfig.httpOptions).toBeUndefined();
    expect(sentConfig.abortSignal).toBeInstanceOf(AbortSignal);
    expect(sentConfig.abortSignal.aborted).toBe(false);
  });

  it("retry GERÇEKLEŞTİĞİNDE, aiDiagnostics retryCount'u GERÇEKTEN artırır", async () => {
    const { aiDiagnostics } = await import("../diagnostics/aiDiagnostics");
    aiDiagnostics.reset();
    let callCount = 0;
    generateContentMock.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) throw new Error("geçici ağ hatası");
      return { text: "cevap", functionCalls: undefined };
    });
    const { geminiProvider } = await import("./GeminiProvider");

    await geminiProvider.sendMessage([{ role: "user", content: "soru" }]);

    expect(aiDiagnostics.getSnapshot().retryCount).toBe(1);
  });
});
