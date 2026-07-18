/**
 * PhotoAnalysisScreen
 * ======================
 * bkz. Sprint 9.2. "İlk çalışan akış" — teşhis/tedavi önerisi/
 * karşılaştırmalı analiz YOK (Öncelik 8-10). Sonuç KALICI OLARAK
 * SAKLANMIYOR (bkz. `usePhotoAnalysis`'in necessity analizi).
 *
 * NAVİGASYON: Bu ekran henüz hiçbir rotaya bağlı DEĞİL (diğer
 * modüllerin — Hasat/AI/Dashboard — aşamalı yaklaşımıyla tutarlı).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import { usePhotoAnalysis } from "./hooks/usePhotoAnalysis";
import { toDisplaySrc } from "../../native/displaySrc";
import type { Photo } from "../photos/domain/photo.types";

interface PhotoAnalysisScreenProps {
  photo: Photo;
  onBack: () => void;
}

export function PhotoAnalysisScreen({ photo, onBack }: PhotoAnalysisScreenProps) {
  const { t } = useTranslation();
  const { status, resultText, errorCode, analyze } = usePhotoAnalysis();

  const isAnalyzing = status === "analyzing";

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("photoAnalysis.screenTitle")}</h1>

      <img
        src={toDisplaySrc(photo.filePath)}
        alt=""
        style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12 }}
      />

      <div className="status-card" style={{ marginTop: 12 }}>
        <p className="status-card__value" style={{ fontSize: 13 }}>
          {t("photoAnalysis.disclaimer")}
        </p>
      </div>

      {status === "idle" ? (
        <button
          type="button"
          className="lock-screen__button"
          onClick={() => analyze(photo.filePath)}
          style={{ marginTop: 8 }}
        >
          {t("photoAnalysis.analyzeButton")}
        </button>
      ) : null}

      {isAnalyzing ? (
        <p className="status-card__value" style={{ marginTop: 12 }}>
          <span className="spinner" aria-hidden="true" /> {t("photoAnalysis.analyzing")}
        </p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error" style={{ marginTop: 12 }}>
          <p className="status-card__value">
            {t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}
          </p>
        </div>
      ) : null}

      {status === "ready" && resultText ? (
        <div className="status-card" style={{ marginTop: 12 }}>
          <p className="status-card__label">{t("photoAnalysis.resultTitle")}</p>
          <p className="status-card__value" style={{ fontSize: 15, fontWeight: 400 }}>
            {resultText}
          </p>
        </div>
      ) : null}

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
