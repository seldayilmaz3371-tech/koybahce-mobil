/**
 * usePhotoAnalysis Hook
 * ========================
 * bkz. Sprint 9.2. "İlk çalışan akış" — Öncelik 8-10 gereği KALICI
 * SAKLAMA YOK (sonuç sadece bu ekran oturumunda, state'te tutulur).
 *
 * NECESSITY ANALİZİ (Sprint 9.1'in tasarım belgesindeki Seçenek B/C
 * arasındaki karar): Bu sprint Seçenek C'yi (kalıcı saklama YOK)
 * uyguluyor — gerekçe: kalıcı saklamanın TEK gerçek tüketicisi
 * ("Karşılaştırmalı Fotoğraf"/"Zaman Çizelgesi", roadmap Bölüm 2.4)
 * bu sprintin AÇIKÇA kapsamı DIŞINDA (Öncelik 10). Bu, kalıcı
 * saklamanın BUGÜN gerekli OLMADIĞININ kanıtıdır — Seçenek B
 * (`photo_analyses` tablosu), o özellik gerçekten geliştirilmeye
 * başlandığında, gerçek bir ADR ile değerlendirilmelidir.
 */

import { useCallback, useRef, useState } from "react";
import { readFileAsBase64 } from "../../../native/filesystem";
import { getActiveAiProvider } from "../../ai/session/getActiveAiProvider";
import { buildPhotoAnalysisSystemPrompt } from "../photoAnalysisPrompt";
import { mapAiError } from "../../../core/errors/mapAiError";
import type { ErrorCodeValue } from "../../../core/errors/errorCodes";

type PhotoAnalysisStatus = "idle" | "analyzing" | "ready" | "error";

export interface UsePhotoAnalysisResult {
  status: PhotoAnalysisStatus;
  resultText: string | null;
  errorCode: ErrorCodeValue | null;
  analyze: (filePath: string) => Promise<void>;
  reset: () => void;
}

const DEFAULT_ANALYSIS_PROMPT =
  "Please describe what you observe in this photo of an olive tree, leaf, or fruit.";

/** `filePath`'in uzantısından MIME tipini belirler. Bilinmeyen/eksik uzantı için güvenli bir varsayılana (`image/jpeg`) düşer. */
function inferMimeType(filePath: string): string {
  const extension = filePath.split(".").pop()?.split("?")[0]?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export function usePhotoAnalysis(): UsePhotoAnalysisResult {
  const [status, setStatus] = useState<PhotoAnalysisStatus>("idle");
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCodeValue | null>(null);
  // bkz. Sprint 10.5, Madde 3. `PhotoGalleryScreen`'in `isSavingRef`
  // deseninin AYNI gerekçesiyle: React `status` state'i ASENKRON/
  // batch'li güncellendiği için, aynı senkron JS turunda art arda
  // gelen İKİ `analyze()` çağrısı, ikisi de `status`'un HÂLÂ "idle"
  // olduğu ESKİ bir closure görebilir — bu, eşzamanlı İKİ Gemini
  // çağrısına yol açabilirdi. `useRef` SENKRON güncellendiği için bu
  // yarış durumunu GERÇEKTEN engelliyor. Bu, bir CACHE DEĞİL — sadece
  // "aynı anda birden fazla çağrı OLMASIN" koruması (kullanıcının
  // AÇIK talebi, Sprint 10.5).
  const isAnalyzingRef = useRef(false);

  const analyze = useCallback(async (filePath: string) => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    setStatus("analyzing");
    setErrorCode(null);
    setResultText(null);
    try {
      const { provider, settings } = await getActiveAiProvider();
      const base64 = await readFileAsBase64(filePath);
      const mimeType = inferMimeType(filePath);
      const systemInstruction = buildPhotoAnalysisSystemPrompt(settings.responseLanguage);

      const text = await provider.analyzeImage(base64, mimeType, DEFAULT_ANALYSIS_PROMPT, systemInstruction);

      setResultText(text);
      setStatus("ready");
    } catch (error) {
      setErrorCode(mapAiError(error));
      setStatus("error");
    } finally {
      isAnalyzingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResultText(null);
    setErrorCode(null);
  }, []);

  return { status, resultText, errorCode, analyze, reset };
}
