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
 * route wrapper).
 *
 * Sprint 10.9 YENİDEN TASARIMI (kullanıcının gerçek cihaz geri
 * bildirimi — "gereksiz büyük boş alanlar var, bilgiler verimsiz
 * gösteriliyor"): ÖNCEDEN her alan AYRI bir `.status-card` idi (13
 * ayrı kart, her biri 16px padding + 12px margin) — GERÇEKTEN çok
 * yer kaplıyordu. Şimdi 4 mantıksal GRUBA toplandı: Kimlik (Provider/
 * Model/API Key), Durum (Stage/HTTP/Error Code/Timed Out), Zamanlama
 * (Started/Finished/Duration/Retry/Request Id), Hata Detayı (Error
 * Message/Name/Stack — sadece hata VARSA gösterilir).
 *
 * Her "boş" değer artık düz "—" değil, GERÇEKTEN ne anlama geldiğini
 * açıklayan bir ifade taşıyor — kullanıcının kendi talebi: "Boş
 * kutular görmek istemiyorum. Bilgi yoksa 'Gönderilmedi'/'Henüz
 * oluşmadı' gibi anlamlı ifadeler göster."
 *
 * VERİ KAYNAĞI: `aiDiagnostics` — SON isteğin anlık görüntüsü, kalıcı
 * SAKLAMA YOK.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz — SADECE ham
 * teknik değerler (hata mesajı, stage adı gibi) İSTİSNA, çünkü bunlar
 * GERÇEK teşhis verisi, çevrilebilir bir UI metni DEĞİL.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { aiDiagnostics, type AiDiagnosticSnapshot } from "./diagnostics/aiDiagnostics";

/** bkz. `node_modules/@google/genai/package.json` — gerçek sürümle doğrulandı. */
const SDK_VERSION = "@google/genai 2.12.0";

/**
 * bkz. Sprint 10.8, GERÇEK BULGU: `snapshot.rawError.stack` bazen
 * 15-20+ satır, her satırı 100+ karakter olan (minified bundle'dan
 * kaynaklanan) çok uzun bir metin oluyordu — bu, ekranın geri kalanını
 * aşağı itip "arayüz okunmuyor" izlenimine yol açan gerçek bir
 * nedendi. Şimdi ilk 6 satırla sınırlandırılıyor.
 */
const MAX_STACK_LINES = 6;

interface AiDiagnosticScreenProps {
  onBack: () => void;
  /** bkz. Sprint 10.8 — route wrapper'dan geliyor, ekran KENDİ ayrı bir `useAiSettings()` çağrısı yapmıyor. */
  debugMode: boolean;
}

const STAGE_LABELS: Record<AiDiagnosticSnapshot["stage"], string> = {
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

function truncateStack(stack: string): { text: string; truncated: boolean } {
  const lines = stack.split("\n");
  if (lines.length <= MAX_STACK_LINES) {
    return { text: stack, truncated: false };
  }
  return { text: lines.slice(0, MAX_STACK_LINES).join("\n"), truncated: true };
}

function formatTimestamp(ms: number | null): string {
  if (ms === null) return "Henüz oluşmadı";
  return new Date(ms).toLocaleTimeString("tr-TR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
}

/** Kompakt bir "etiket: değer" satırı — ayrı kart DEĞİL, mevcut kartın İÇİNDE bir satır (Sprint 10.9'un boşluk azaltma kararı). */
function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", overflowWrap: "anywhere", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

export function AiDiagnosticScreen({ onBack, debugMode }: AiDiagnosticScreenProps) {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<AiDiagnosticSnapshot>(() => aiDiagnostics.getSnapshot());

  // bkz. Sprint 10.7 — istek DEVAM EDERKEN bu ekrana bakılabilmesi
  // için, anlık görüntü periyodik olarak YENİLENİYOR. GERÇEK bir AI
  // çağrısı TETİKLEMİYOR — SADECE bellekteki mevcut veriyi okuyor.
  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshot(aiDiagnostics.getSnapshot());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!debugMode) {
    return null;
  }

  const stackInfo = snapshot.rawError?.stack ? truncateStack(snapshot.rawError.stack) : null;
  const hasError = snapshot.rawError !== null;

  return (
    <main className="status-screen" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <h1 className="status-screen__title">{t("aiDiagnostic.screenTitle")}</h1>

      <div className="status-card">
        <p className="status-card__label">Kimlik</p>
        <DiagnosticRow label="Provider" value={snapshot.providerName ?? "Henüz oluşturulmadı"} />
        <DiagnosticRow label="Model" value={snapshot.model ?? "Henüz seçilmedi"} />
        <DiagnosticRow
          label="API Key"
          value={
            snapshot.apiKeyStatus === "unknown"
              ? "Henüz kontrol edilmedi"
              : snapshot.apiKeyStatus === "empty"
                ? "Boş (girilmemiş)"
                : (snapshot.apiKeyMasked ?? "Girilmiş (geçerliliği doğrulanmadı)")
          }
        />
        <DiagnosticRow label="SDK" value={SDK_VERSION} />
      </div>

      <div className="status-card">
        <p className="status-card__label">Durum</p>
        <DiagnosticRow label="Stage" value={STAGE_LABELS[snapshot.stage]} />
        <DiagnosticRow label="HTTP" value={snapshot.httpStatusCode !== null ? String(snapshot.httpStatusCode) : "İstek henüz gönderilmedi"} />
        <DiagnosticRow label="Error Code" value={snapshot.mappedErrorCode ?? "Hata yok"} />
        <DiagnosticRow label="Timed Out" value={snapshot.timedOut ? "EVET" : "Hayır"} />
      </div>

      <div className="status-card">
        <p className="status-card__label">Zamanlama</p>
        <DiagnosticRow label="Request Id" value={snapshot.requestId ?? "Henüz oluşmadı"} />
        <DiagnosticRow label="Request Started" value={formatTimestamp(snapshot.requestStartedAt)} />
        <DiagnosticRow label="Request Finished" value={formatTimestamp(snapshot.requestEndedAt)} />
        <DiagnosticRow label="Duration" value={snapshot.durationMs !== null ? `${snapshot.durationMs} ms` : "Henüz tamamlanmadı"} />
        <DiagnosticRow label="Retry Count" value={String(snapshot.retryCount)} />
      </div>

      {snapshot.toolCallsRequested.length > 0 ? (
        <div className="status-card">
          <p className="status-card__label">Tool Calling</p>
          {snapshot.toolCallsRequested.map((call, index) => (
            <DiagnosticRow
              key={`${call.name}-${index}`}
              label={call.name}
              value={call.hasThoughtSignature ? "thought_signature VAR" : "thought_signature YOK"}
            />
          ))}
          <DiagnosticRow
            label="SQLite Süresi"
            value={snapshot.toolDurationMs !== null ? `${snapshot.toolDurationMs} ms` : "Henüz tamamlanmadı"}
          />
        </div>
      ) : null}

      {snapshot.photo ? (
        <div className="status-card">
          <p className="status-card__label">Fotoğraf</p>
          <DiagnosticRow
            label="Dosya Boyutu"
            value={
              snapshot.photo.fileSizeBytes !== null ? `~${(snapshot.photo.fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : "—"
            }
          />
          <DiagnosticRow
            label="Base64 Boyutu"
            value={
              snapshot.photo.base64SizeBytes !== null
                ? `~${(snapshot.photo.base64SizeBytes / 1024 / 1024).toFixed(2)} MB`
                : "—"
            }
          />
        </div>
      ) : null}

      {hasError ? (
        <div className="status-card" style={{ overflow: "hidden" }}>
          <p className="status-card__label">Hata Detayı</p>
          <DiagnosticRow label="Error Name" value={snapshot.rawError!.name} />
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8, marginBottom: 2 }}>Error Message (ham):</p>
          <p style={{ fontSize: 14, fontWeight: 600, overflowWrap: "anywhere", margin: 0 }}>{snapshot.rawError!.message}</p>
          {stackInfo ? (
            <>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8, marginBottom: 2 }}>
                Stack{stackInfo.truncated ? ` (ilk ${MAX_STACK_LINES} satır)` : ""}:
              </p>
              <pre
                style={{
                  fontSize: 11,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  maxWidth: "100%",
                  margin: 0,
                }}
              >
                {stackInfo.text}
              </pre>
            </>
          ) : null}
        </div>
      ) : null}

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
