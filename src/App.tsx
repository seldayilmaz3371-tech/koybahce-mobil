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
 *
 * GLOBALIZATION POLICY: Bu dosyada hiçbir kullanıcıya görünen metin
 * doğrudan yazılmaz — tümü useTranslation() üzerinden
 * src/i18n/locales/*.json dosyalarından gelir.
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { LockScreen } from "./modules/auth/LockScreen";
import { getDatabase, getRuntimePlatform } from "./data/db/connection";
import { appMetadataRepository } from "./data/repositories/appMetadata.repository";
import { CURRENT_SCHEMA_VERSION } from "./data/db/migrations/schema";
import { ParcelsScreen } from "./modules/parcels/ParcelsScreen";
import { TreesScreen } from "./modules/trees/TreesScreen";
import { ObservationScreen } from "./modules/observations/ObservationScreen";
import type { Tree } from "./modules/trees/domain/tree.types";

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

/**
 * Üst düzey navigasyon durumu (Sprint 2.5'te başladı, Sprint 3.5'te
 * genişledi). Bilerek bir router kütüphanesi YOK — Modül 1'den beri
 * süregelen basit "view state" deseni.
 *
 * `trees-for-parcel` SADECE `parcelId` taşıyor (tam `Parcel` nesnesi
 * DEĞİL) — çünkü TreesScreen zaten sadece bunu kullanıyordu (gereksiz
 * veri taşınmıyordu, Kural 26: sadece gerekli olanı değiştir/taşı).
 * Bu sadeleştirme, `observations-for-tree`'den geri dönerken (Tree
 * nesnesi zaten `parcelId` içeriyor) tutarlı bir şekilde yeniden
 * kullanılabilmesini sağlıyor.
 */
type AppView =
  | { screen: "parcels" }
  | { screen: "trees-for-parcel"; parcelId: string }
  | { screen: "reference-trees" }
  | { screen: "observations-for-tree"; tree: Tree };

function App() {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(false);
  const [infrastructure, setInfrastructure] = useState<InfrastructureStatus>({
    phase: "idle",
  });
  const [view, setView] = useState<AppView>({ screen: "parcels" });

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

  // Modül 1 donduruldu (bkz. docs/module-status.md) — tanılama
  // ekranının görevi bitti. Veritabanı hazır olduğunda artık gerçek
  // uygulama navigasyonu gösteriliyor.
  if (infrastructure.phase === "ready") {
    if (view.screen === "observations-for-tree") {
      return (
        <ObservationScreen
          scope={{ mode: "tree", treeId: view.tree.id }}
          parcelId={view.tree.parcelId}
          contextLabel={`${view.tree.treeNumber} — ${view.tree.variety}`}
          onBack={() => setView({ screen: "trees-for-parcel", parcelId: view.tree.parcelId })}
        />
      );
    }
    if (view.screen === "trees-for-parcel") {
      return (
        <TreesScreen
          mode={{ mode: "parcel", parcelId: view.parcelId }}
          onBack={() => setView({ screen: "parcels" })}
          onViewObservations={(tree) => setView({ screen: "observations-for-tree", tree })}
        />
      );
    }
    if (view.screen === "reference-trees") {
      return (
        <TreesScreen
          mode={{ mode: "reference" }}
          onBack={() => setView({ screen: "parcels" })}
          onViewObservations={(tree) => setView({ screen: "observations-for-tree", tree })}
        />
      );
    }
    return (
      <ParcelsScreen
        onViewTrees={(parcel) => setView({ screen: "trees-for-parcel", parcelId: parcel.id })}
        onViewReferenceTrees={() => setView({ screen: "reference-trees" })}
      />
    );
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
