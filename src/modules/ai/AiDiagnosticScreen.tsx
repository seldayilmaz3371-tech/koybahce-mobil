/**
 * AiDiagnosticScreen
 * =====================
 * bkz. Sprint 10.7 (AI Diagnostic Build). AMAÇ: kullanıcının gerçek
 * cihazda yaşadığı AI hatalarını (genel "Bir şeyler ters gitti"
 * mesajı, Fotoğraf Analizi'nde sonsuz bekleme) TAHMİN değil, KESİN
 * TEKNİK KANITLA teşhis etmesini sağlamak.
 *
 * GÖRÜNÜRLÜK KURALI (kullanıcının açık talebi — "Release sürümünde
 * bu bilgiler görünmesin"): Bu ekran SADECE `settings.debugMode ===
 * true` iken erişilebilir — aksi halde `null` render eder (route
 * seviyesinde de AYRICA bir koruma var, bkz. `AppRouter.tsx`'teki
 * route wrapper). `debugMode`, `AiSettingsScreen`'de VARSAYILAN
 * OLARAK KAPALI bir toggle — normal (release) kullanıcılar bu
 * ekranı asla görmez, sadece açıkça "Teşhis Modu"nu AÇAN kullanıcılar
 * erişebilir.
 *
 * VERİ KAYNAĞI: `aiDiagnostics` (bkz. o modülün kendi notu) — SON
 * isteğin anlık görüntüsü, kalıcı SAKLAMA YOK.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz — SADECE ham
 * teknik değerler (hata mesajı, stage adı gibi) İSTİSNA, çünkü bunlar
 * GERÇEK teşhis verisi, çevrilebilir bir UI metni DEĞİL.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { aiDiagnostics, type AiDiagnosticSnapshot } from "./diagnostics/aiDiagnostics";
import { useAiSettings } from "./hooks/useAiSettings";

/** bkz. `node_modules/@google/genai/package.json` — gerçek sürümle doğrulandı. */
const SDK_VERSION = "@google/genai 2.12.0";

interface AiDiagnosticScreenProps {
  onBack: () => void;
}

function formatStage(stage: AiDiagnosticSnapshot["stage"]): string {
  const labels: Record<AiDiagnosticSnapshot["stage"], string> = {
    idle: "idle (henüz istek yok)",
    provider_obtained: "provider_obtained (Provider oluşturuldu)",
    request_prepared: "request_prepared (Request hazırlandı)",
    request_sent: "request_sent (Request gönderildi)",
    awaiting_response: "awaiting_response (Response bekleniyor — İSTEK BURADA TAKILI KALMIŞ OLABİLİR)",
    response_received: "response_received (Response geldi)",
    parsed: "parsed (Parse edildi)",
    ui_updated: "ui_updated (UI'ya aktarıldı — TAMAMLANDI)",
    error: "error (Hata oluştu)",
    timeout: "timeout (Zaman aşımı — istek 45 saniyede tamamlanmadı)",
  };
  return labels[stage];
}

export function AiDiagnosticScreen({ onBack }: AiDiagnosticScreenProps) {
  const { t } = useTranslation();
  const { settings } = useAiSettings();
  const [snapshot, setSnapshot] = useState<AiDiagnosticSnapshot>(() => aiDiagnostics.getSnapshot());

  // bkz. Sprint 10.7 — istek DEVAM EDERKEN bu ekrana bakılabilmesi
  // için (ör. "awaiting_response" durumunu CANLI izlemek), anlık
  // görüntü periyodik olarak YENİLENİYOR. Bu, GERÇEK bir AI çağrısı
  // TETİKLEMİYOR — SADECE bellekteki mevcut veriyi okuyor.
  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshot(aiDiagnostics.getSnapshot());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // bkz. dosya başlığı — GÖRÜNÜRLÜK KURALI. `settings` henüz
  // yüklenmemişse (ilk render) geçici olarak `null` döner — bu,
  // "debugMode kapalı" ile KARIŞTIRILMAMALI, sadece kısa bir yükleme
  // anı (useAiSettings zaten kendi "loading" durumunu yönetiyor,
  // burada AYRICA bir yükleniyor ekranı GÖSTERMİYORUZ çünkü bu ekran
  // zaten arka planda, kullanıcı bunu SEZMEZ).
  if (!settings || !settings.debugMode) {
    return null;
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("aiDiagnostic.screenTitle")}</h1>

      <div className="status-card">
        <p className="status-card__label">Provider:</p>
        <p className="status-card__value">{snapshot.providerName ?? "—"}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">API Key:</p>
        <p className="status-card__value">{snapshot.apiKeyStatus}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">Stage:</p>
        <p className="status-card__value">{formatStage(snapshot.stage)}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">HTTP:</p>
        <p className="status-card__value">{snapshot.httpStatusCode ?? "—"}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">SDK:</p>
        <p className="status-card__value">{SDK_VERSION}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">Error Code:</p>
        <p className="status-card__value">{snapshot.mappedErrorCode ?? "—"}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">Error Message (ham):</p>
        <p className="status-card__value">{snapshot.rawError?.message ?? "—"}</p>
      </div>

      {snapshot.rawError ? (
        <div className="status-card">
          <p className="status-card__label">Error Name:</p>
          <p className="status-card__value">{snapshot.rawError.name}</p>
        </div>
      ) : null}

      <div className="status-card">
        <p className="status-card__label">Request Duration:</p>
        <p className="status-card__value">{snapshot.durationMs !== null ? `${snapshot.durationMs} ms` : "—"}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">Retry Count:</p>
        <p className="status-card__value">{snapshot.retryCount}</p>
      </div>

      <div className="status-card">
        <p className="status-card__label">Timed Out:</p>
        <p className="status-card__value">{snapshot.timedOut ? "EVET" : "Hayır"}</p>
      </div>

      {snapshot.photo ? (
        <div className="status-card">
          <p className="status-card__label">Fotoğraf Boyutu:</p>
          <p className="status-card__value">
            {snapshot.photo.fileSizeBytes !== null
              ? `~${(snapshot.photo.fileSizeBytes / 1024 / 1024).toFixed(2)} MB (dosya) / ${(
                  (snapshot.photo.base64SizeBytes ?? 0) /
                  1024 /
                  1024
                ).toFixed(2)} MB (base64)`
              : "—"}
          </p>
        </div>
      ) : null}

      {snapshot.rawError?.stack ? (
        <div className="status-card">
          <p className="status-card__label">Stack:</p>
          <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {snapshot.rawError.stack}
          </pre>
        </div>
      ) : null}

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
