/**
 * App — Kök Bileşen
 * ====================
 * Sprint 4.0 ile KÜÇÜLTÜLDÜ (Router Migration onayı, 2026-07-15):
 * Eskiden burada yaşayan tüm üst-düzey ekran seçim mantığı (AppView
 * union'ı + setView çağrıları) `src/router/AppRouter.tsx`'e taşındı.
 *
 * Bu bileşenin tek görevi (DEĞİŞMEDİ):
 *   1. Kilit ekranını göstermek (biyometrik/PIN doğrulama).
 *   2. Doğrulama başarılı olduktan sonra veritabanı bağlantısını kurmak
 *      ve şemanın gerçekten uygulandığını doğrulamak.
 *   3. Altyapı hazır olduğunda `<AppRouter />`'ı render etmek.
 *
 * GLOBALIZATION POLICY: Bu dosyada hiçbir kullanıcıya görünen metin
 * doğrudan yazılmaz — tümü useTranslation() üzerinden
 * src/i18n/locales/*.json dosyalarından gelir.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LockScreen } from "./modules/auth/LockScreen";
import { getDatabase, getRuntimePlatform } from "./data/db/connection";
import { appMetadataRepository } from "./data/repositories/appMetadata.repository";
import { CURRENT_SCHEMA_VERSION } from "./data/db/migrations/schema";
import { AppRouter } from "./router/AppRouter";
import { addAppStateChangeListener } from "./native/appLifecycle";

type InfrastructureStatus =
  | { phase: "idle" }
  | { phase: "initializing" }
  | {
      phase: "ready";
      platform: string;
      firstLaunchAt: string;
      schemaVersion: number;
    }
  | { phase: "failed"; message: string };

function App() {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(false);
  const [infrastructure, setInfrastructure] = useState<InfrastructureStatus>({
    phase: "idle",
  });

  // GÜVENLİK DÜZELTMESİ (Sprint 4.3.1 — Modül 4 Bağımsız Denetimi'nde
  // bulunan gerçek P1 bulgusu): uygulama arka plana alınıp öne
  // geldiğinde (Android Activity onStop/onResume) kullanıcı yeniden
  // kilit ekranıyla karşılaşmalı. Sadece `unlocked === true` iken
  // dinliyoruz — zaten kilitliyken (LockScreen açıkken) gereksiz bir
  // "zaten kilitli" durumuna yeniden geçiş yapmaya çalışmıyoruz.
  //
  // "process kill" senaryosu BİLEREK burada ele ALINMIYOR — süreç
  // öldüğünde tüm React state sıfırdan başlıyor, `useState(false)`
  // varsayılanı zaten güvenli (bkz. native/appLifecycle.ts notu).
  useEffect(() => {
    if (!unlocked) return;
    return addAppStateChangeListener((isActive) => {
      if (!isActive) {
        setUnlocked(false);
      }
    });
  }, [unlocked]);

  const initializeInfrastructure = useCallback(async () => {
    setInfrastructure({ phase: "initializing" });
    try {
      // Bağlantıyı açar (yoksa kurar, şifreleme anahtarını hazırlar,
      // şema yükseltmelerini uygular).
      await getDatabase();

      // Veritabanına gerçekten yazıp okuyabildiğimizi doğrular — bu,
      // sadece "bağlantı açıldı" değil, "şema doğru kuruldu ve
      // kalıcı" bilgisini de verir.
      const firstLaunchAt = await appMetadataRepository.recordFirstLaunchIfNeeded();

      setInfrastructure({
        phase: "ready",
        platform: getRuntimePlatform(),
        firstLaunchAt,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setInfrastructure({ phase: "failed", message });
    }
  }, []);

  const handleUnlocked = useCallback(() => {
    setUnlocked(true);
    initializeInfrastructure();
  }, [initializeInfrastructure]);

  if (!unlocked) {
    return <LockScreen onUnlocked={handleUnlocked} />;
  }

  if (infrastructure.phase === "ready") {
    return <AppRouter />;
  }

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("diagnostics.title")}</h1>

      {infrastructure.phase === "initializing" || infrastructure.phase === "idle" ? (
        <div className="status-card">
          <p className="status-card__value">{t("diagnostics.preparingDatabase")}</p>
        </div>
      ) : null}

      {infrastructure.phase === "failed" ? (
        <div className="status-card status-card--error">
          <p className="status-card__label">{t("diagnostics.errorLabel")}</p>
          <p className="status-card__value">{infrastructure.message}</p>
          <button
            type="button"
            className="lock-screen__button"
            style={{ marginTop: 12 }}
            onClick={initializeInfrastructure}
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}
    </main>
  );
}

export default App;
