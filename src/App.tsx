/**
 * App — Kök Bileşen
 * ====================
 * Modül 1 kapsamında bu bileşenin tek görevi:
 *   1. Kilit ekranını göstermek (biyometrik/PIN doğrulama).
 *   2. Doğrulama başarılı olduktan sonra veritabanı bağlantısını kurmak
 *      ve şemanın gerçekten uygulandığını doğrulamak.
 *   3. Sonucu, cihazda gözle görülebilir bir "durum ekranı" olarak
 *      göstermek — bu ekran, test planındaki adımların karşılığıdır.
 *
 * İş modülleri (Parseller, Gözlemler, ...) geldiğinde bu durum ekranı
 * kaldırılıp yerine gerçek uygulama gezinmesi (navigation) gelecek.
 */

import { useCallback, useState } from "react";
import { LockScreen } from "./modules/auth/LockScreen";
import { getDatabase, getRuntimePlatform } from "./data/db/connection";
import { appMetadataRepository } from "./data/repositories/appMetadata.repository";
import { CURRENT_SCHEMA_VERSION } from "./data/db/migrations/schema";

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
  const [unlocked, setUnlocked] = useState(false);
  const [infrastructure, setInfrastructure] = useState<InfrastructureStatus>({
    phase: "idle",
  });

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

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">Modül 1 — Altyapı Durumu</h1>

      {infrastructure.phase === "initializing" || infrastructure.phase === "idle" ? (
        <div className="status-card">
          <p className="status-card__value">Veritabanı hazırlanıyor…</p>
        </div>
      ) : null}

      {infrastructure.phase === "ready" ? (
        <>
          <div className="status-card">
            <p className="status-card__label">Bağlantı Durumu</p>
            <p className="status-card__value">✅ Şifreli veritabanı bağlantısı açık</p>
          </div>
          <div className="status-card">
            <p className="status-card__label">Platform</p>
            <p className="status-card__value">{infrastructure.platform}</p>
          </div>
          <div className="status-card">
            <p className="status-card__label">Şema Sürümü</p>
            <p className="status-card__value">{infrastructure.schemaVersion}</p>
          </div>
          <div className="status-card">
            <p className="status-card__label">İlk Kurulum Zamanı (kalıcı kayıt)</p>
            <p className="status-card__value">{infrastructure.firstLaunchAt}</p>
          </div>
        </>
      ) : null}

      {infrastructure.phase === "failed" ? (
        <div className="status-card status-card--error">
          <p className="status-card__label">Hata</p>
          <p className="status-card__value">{infrastructure.message}</p>
        </div>
      ) : null}
    </main>
  );
}

export default App;
