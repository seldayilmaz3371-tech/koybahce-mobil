/**
 * AiChatScreen
 * ===============
 * bkz. ADR 0024. Bölüm 8 (Offline-First AI) — çevrimdışıyken sohbet
 * gönderme devre dışı bırakılır, geçmiş konuşma (bu oturumda) yine de
 * görüntülenebilir.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAiChat } from "./hooks/useAiChat";
import { addNetworkStatusListener, isOnline } from "../../native/network";
import type { ScreenContext } from "./context/IContextEngine.interface";

interface AiChatScreenProps {
  screenContext?: ScreenContext;
  onBack: () => void;
  onViewSettings: () => void;
}

export function AiChatScreen({ screenContext, onBack, onViewSettings }: AiChatScreenProps) {
  const { t } = useTranslation();
  const { messages, status, errorCode, sendMessage } = useAiChat(screenContext);
  const [inputValue, setInputValue] = useState("");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    isOnline().then(setOnline);
    return addNetworkStatusListener(setOnline);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim() || status === "sending") return;
    const query = inputValue;
    setInputValue("");
    await sendMessage(query);
  };

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("aiChat.screenTitle")}</h1>

      {!online ? <p className="status-card__value">{t("aiChat.offlineNotice")}</p> : null}

      {status === "loading" ? <p className="status-card__value">{t("common.loading")}</p> : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{t(`errors.${errorCode}`, { defaultValue: t("errors.SYS_001") })}</p>
        </div>
      ) : null}

      <ul className="parcel-list">
        {messages
          .filter((m) => m.role !== "tool")
          .map((m) => (
            <li key={m.id}>
              <span className="parcel-list__name">
                {m.role === "user" ? t("aiChat.userLabel") : t("aiChat.assistantLabel")}
              </span>
              <span className="parcel-list__meta">{m.content}</span>
            </li>
          ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          aria-label={t("aiChat.inputLabel")}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!online || status === "sending"}
        />
        <button
          type="submit"
          className="lock-screen__button"
          disabled={!online || status === "sending" || !inputValue.trim()}
        >
          {t("aiChat.sendButton")}
        </button>
      </form>

      <button type="button" className="lock-screen__button" onClick={onViewSettings} style={{ marginTop: 8 }}>
        {t("aiChat.settingsLinkLabel")}
      </button>

      <button type="button" className="lock-screen__button" onClick={onBack} style={{ marginTop: 8 }}>
        {t("common.back")}
      </button>
    </main>
  );
}
