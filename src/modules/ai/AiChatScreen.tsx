/**
 * AiChatScreen
 * ===============
 * bkz. ADR 0024. Bölüm 8 (Offline-First AI) — çevrimdışıyken sohbet
 * gönderme devre dışı bırakılır, geçmiş konuşma (bu oturumda) yine de
 * görüntülenebilir.
 *
 * Sprint 7.3 — Mobil UX iyileştirmesi (kullanıcı talebi, 2026-07-17):
 * çok satırlı otomatik büyüyen textarea, sohbet balonları (kullanıcı
 * sağda/AI solda), gönderim sırasında "yazıyor..." göstergesi. AI
 * MİMARİSİ (useAiChat/AiSessionService/Provider) HİÇ DEĞİŞMEDİ —
 * sadece bu dosyanın render/etkileşim katmanı yeniden tasarlandı.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAiChat } from "./hooks/useAiChat";
import { addNetworkStatusListener, isOnline } from "../../native/network";
import type { ScreenContext } from "./context/IContextEngine.interface";

interface AiChatScreenProps {
  screenContext?: ScreenContext;
  onBack: () => void;
  onViewSettings: () => void;
  /** bkz. Sprint 10.7 (AI Diagnostic Build). SADECE bu true iken "AI Teşhis Bilgisi" butonu görünür — Release kullanıcıları bunu hiç görmez. */
  debugMode?: boolean;
  onViewDiagnostics?: () => void;
}

/** CSS'teki `.ai-chat__textarea`'nın `max-height`'iyle BİREBİR eşleşmeli (~10 satır). */
const TEXTAREA_MAX_HEIGHT_PX = 240;

<<<<<<< HEAD
export function AiChatScreen({ screenContext, onBack, onViewSettings, debugMode, onViewDiagnostics }: AiChatScreenProps) {
=======
export function AiChatScreen({ screenContext, onBack, onViewSettings }: AiChatScreenProps) {
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
  const { t } = useTranslation();
  const { messages, status, errorCode, sendMessage } = useAiChat(screenContext);
  const [inputValue, setInputValue] = useState("");
  const [online, setOnline] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // bkz. Sprint 7.2 — uzun bir konuşmada yeni gelen cevap listenin
  // altında kalıp GÖRÜNMEYEBİLİR. Her yeni mesajda (kullanıcı VEYA
  // model) en alta otomatik kaydırıyoruz.
  const latestMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    isOnline().then(setOnline);
    return addNetworkStatusListener(setOnline);
  }, []);

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    // Sprint 7.3 — otomatik büyüme: önce "auto"ya sıfırlanır (küçülme
    // ihtimali için — kullanıcı metni SİLERSE textarea da küçülmeli),
    // sonra GERÇEK içerik yüksekliğine (`scrollHeight`) göre, ~10
    // satır sınırına kadar büyütülür.
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim() || status === "sending") return;
    const query = inputValue;
    setInputValue("");
    // Textarea'yı görsel olarak da varsayılan (4 satır) yüksekliğe döndür.
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(query);
  };

  const visibleMessages = messages.filter((m) => m.role !== "tool");
  const isSending = status === "sending";

  return (
    <main className="status-screen ai-chat-screen">
      <h1 className="status-screen__title">{t("aiChat.screenTitle")}</h1>

      {!online ? <p className="status-card__value">{t("aiChat.offlineNotice")}</p> : null}

      {status === "loading" ? <p className="status-card__value">{t("common.loading")}</p> : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}</p>
        </div>
      ) : null}

      <div className="ai-chat__messages" aria-live="polite" aria-relevant="additions">
        {visibleMessages.map((m, index) => {
          const isLast = index === visibleMessages.length - 1 && !isSending;
          return (
            <div
              key={m.id}
              ref={isLast ? latestMessageRef : undefined}
              className={`ai-chat__bubble ai-chat__bubble--${m.role === "user" ? "user" : "model"}`}
            >
              <span className="ai-chat__bubble-label">
                {m.role === "user" ? t("aiChat.userLabel") : t("aiChat.assistantLabel")}
              </span>
              {m.content}
            </div>
          );
        })}

        {isSending ? (
          <div ref={latestMessageRef} className="ai-chat__bubble ai-chat__bubble--model ai-chat__bubble--loading">
            <span className="ai-chat__spinner" aria-hidden="true" />
            {t("aiChat.thinkingLabel")}
          </div>
        ) : null}
      </div>

      <form className="ai-chat__composer" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="ai-chat__textarea"
          rows={4}
          aria-label={t("aiChat.inputLabel")}
          placeholder={t("aiChat.inputPlaceholder")}
          value={inputValue}
          onChange={handleTextareaChange}
          disabled={!online || isSending}
        />
        <button
          type="submit"
          className="lock-screen__button"
          disabled={!online || isSending || !inputValue.trim()}
        >
          {t("aiChat.sendButton")}
        </button>
      </form>

      <button type="button" className="lock-screen__button" onClick={onViewSettings} style={{ marginTop: 8 }}>
        {t("aiChat.settingsLinkLabel")}
      </button>

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

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
