/**
 * PhotoAnalysisScreen
 * ======================
<<<<<<< HEAD
 * bkz. Sprint 9.2/10.5. "İlk çalışan akış" — teşhis/tedavi önerisi/
 * karşılaştırmalı analiz YOK (Öncelik 8-10). Sonuç KALICI OLARAK
 * SAKLANMIYOR (bkz. `usePhotoAnalysis`'in necessity analizi).
 *
 * NAVİGASYON: Sprint 10.5'te `PhotoAnalysisScreenRoute` ile rotaya
 * bağlandı (bkz. `AppRouter.tsx`).
 *
 * Sprint 10.5 EKLENTİSİ: Donanım geri tuşu desteği eklendi — GERÇEK
 * BULGU (bu sprintte bulundu): bu ekran, diğer TÜM ekranların
 * (Hasat/Bakım/Toplu İşlemler) aksine, hiç donanım geri tuşu
 * dinleyicisi kaydetmiyordu. "Analiz devam ederken geri tuşuna
 * basılması" senaryosu (kullanıcının Sprint 10.5 test talebi)
 * incelenirken ortaya çıktı — analiz sırasında geri tuşuna basmak
 * hiçbir şey yapmıyordu (çökme yoktu ama kullanıcı sıkışabilirdi).
 * Diğer ekranların KANITLANMIŞ deseniyle (established pattern)
 * düzeltildi.
=======
 * bkz. Sprint 9.2. "İlk çalışan akış" — teşhis/tedavi önerisi/
 * karşılaştırmalı analiz YOK (Öncelik 8-10). Sonuç KALICI OLARAK
 * SAKLANMIYOR (bkz. `usePhotoAnalysis`'in necessity analizi).
 *
 * NAVİGASYON: Bu ekran henüz hiçbir rotaya bağlı DEĞİL (diğer
 * modüllerin — Hasat/AI/Dashboard — aşamalı yaklaşımıyla tutarlı).
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

<<<<<<< HEAD
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePhotoAnalysis } from "./hooks/usePhotoAnalysis";
import { toDisplaySrc } from "../../native/displaySrc";
import { addBackButtonListener } from "../../native/appBackButton";
=======
import { useTranslation } from "react-i18next";
import { usePhotoAnalysis } from "./hooks/usePhotoAnalysis";
import { toDisplaySrc } from "../../native/displaySrc";
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
import type { Photo } from "../photos/domain/photo.types";

interface PhotoAnalysisScreenProps {
  photo: Photo;
  onBack: () => void;
<<<<<<< HEAD
  /** bkz. Sprint 10.7 (AI Diagnostic Build). SADECE bu true iken "AI Teşhis Bilgisi" butonu görünür — Release kullanıcıları bunu hiç görmez. */
  debugMode?: boolean;
  onViewDiagnostics?: () => void;
}

export function PhotoAnalysisScreen({ photo, onBack, debugMode, onViewDiagnostics }: PhotoAnalysisScreenProps) {
=======
}

export function PhotoAnalysisScreen({ photo, onBack }: PhotoAnalysisScreenProps) {
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
  const { t } = useTranslation();
  const { status, resultText, errorCode, analyze } = usePhotoAnalysis();

  const isAnalyzing = status === "analyzing";

<<<<<<< HEAD
  useEffect(() => {
    return addBackButtonListener(onBack);
  }, [onBack]);

=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
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

<<<<<<< HEAD
      {debugMode && onViewDiagnostics ? (
        <button
          type="button"
          className="lock-screen__button"
          onClick={onViewDiagnostics}
          style={{ marginTop: 8, border: "2px dashed var(--color-primary)" }}
        >
          {t("aiDiagnostic.openButton")}
        </button>
      ) : null}

=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
