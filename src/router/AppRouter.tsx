/**
 * AppRouter
 * ===========
 * bkz. Sprint 4.0 mimari analizi + onayı (2026-07-15).
 *
 * MİMARİ KARAR: `HashRouter` — `BrowserRouter` DEĞİL. `BrowserRouter`,
 * `pushState` tabanlı yolların sunucu/asset-katmanında "SPA fallback"
 * desteğini gerektirir; Capacitor'ın yerel WebView asset sunucusunun
 * bunu garantili desteklediğine dair doğrulanmış bir kanıt yok.
 * `HashRouter` (`#/parcels/...`) hiçbir sunucu-taraflı yönlendirmeye
 * ihtiyaç duymadan, statik dosya sunumuyla %100 çalışır — WebView'da
 * adres çubuğu görünmediği için `#` kullanıcıya hiç görünmez.
 *
 * KAPSAM (Sprint 4.0 onayı — Seçenek A, Sprint 4.3'te Finans eklendi):
 * TÜM üst-düzey rotalar bağlı (Parsel/Ağaç/Finans/Referans/Gözlem/
 * Fotoğraf) — hiçbir çalışan akış geçici olarak bozulmasın diye.
 * Screen bileşenlerinin KENDİ iç view-state'i (liste/oluştur/düzenle)
 * HİÇ DEĞİŞMEDİ — bu dosya sadece üst-düzey "hangi ekran" kararını ve
 * bu ekranlara geçen `onBack`/`onViewX` callback'lerini `navigate(...)`'e
 * bağlıyor.
 *
 * `navigate(-1)`, HER `onBack` için tutarlı şekilde kullanılıyor —
 * bu, gerçek dünya Capacitor+react-router kullanımlarında doğrulanmış
 * bir desen (araştırma: Medium/Ionic blog örnekleri) ve biz TÜM
 * navigasyonu kendi `navigate()` çağrılarımızla kontrol ettiğimiz
 * için (dış link yok), her zaman "geldiğimiz yere" doğru döner.
 */

import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from "react-router";
import { ParcelsScreen } from "../modules/parcels/ParcelsScreen";
import { TreesScreen } from "../modules/trees/TreesScreen";
import { ObservationScreen } from "../modules/observations/ObservationScreen";
import { PhotoGalleryScreen } from "../modules/photos/PhotoGalleryScreen";
import { PhotoAnalysisScreen } from "../modules/photoAnalysis/PhotoAnalysisScreen";
import { photoRepository } from "../modules/photos/data/photo.repository";
import { useAiSettings } from "../modules/ai/hooks/useAiSettings";
import type { Photo } from "../modules/photos/domain/photo.types";
import { useBackButtonFallback } from "./BackButtonHandler";
import { FinanceScreen } from "../modules/finance/FinanceScreen";
import { MaintenanceScreen } from "../modules/maintenance/MaintenanceScreen";
import { HarvestScreen } from "../modules/harvest/HarvestScreen";
import { BulkOperationsScreen } from "../modules/bulkOperations/BulkOperationsScreen";
import { DashboardScreen } from "../modules/dashboard/DashboardScreen";
import { SettingsScreen } from "../modules/settings/SettingsScreen";
import { DataManagementScreen } from "../modules/dataManagement/DataManagementScreen";
import { LanguageSettingsScreen } from "../modules/settings/LanguageSettingsScreen";
import { useTreeForRoute } from "./useTreeForRoute";
import { ROUTE_PATTERNS, buildPath } from "./routes";

/**
 * Sprint 7.1 — Bundle Optimizasyonu (kullanıcı onayı, teknik analiz
 * raporu doğrultusunda).
 *
 * `@google/genai` SADECE `GeminiProvider.ts`'te import ediliyor
 * (doğrulandı, Sprint 7.1 analizi) — bu ekranları `React.lazy` ile
 * yüklemek, `@google/genai`'yi ana bundle'dan AYIRIYOR. AI ekranlarını
 * HİÇ açmayan kullanıcılar için ana bundle Sprint 6 ÖNCESİ seviyeye
 * (~389kB) geri dönüyor — GERÇEK ölçüm için `npm run build` çıktısına
 * bakılmalı.
 *
 * `React.lazy`, projede İLK KEZ kullanılıyor — named export'ları
 * `.then()` ile `default`'a çeviren standart React deseni.
 */
const AiChatScreenLazy = lazy(() =>
  import("../modules/ai/AiChatScreen").then((m) => ({ default: m.AiChatScreen }))
);
const AiSettingsScreenLazy = lazy(() =>
  import("../modules/ai/AiSettingsScreen").then((m) => ({ default: m.AiSettingsScreen }))
);
/** bkz. Sprint 10.7 (AI Diagnostic Build) — AYNI lazy-loading deseni, ana bundle'a dahil olmasın diye. */
const AiDiagnosticScreenLazy = lazy(() =>
  import("../modules/ai/AiDiagnosticScreen").then((m) => ({ default: m.AiDiagnosticScreen }))
);

/**
 * `bootstrapAi()`'nin çağrıldığı TEK yer — Sprint 6'da `App.tsx`'te
 * (her kullanıcı için, açılışta senkron) çağrılıyordu; bu, bundle
 * optimizasyonunu ANLAMSIZ kılardı. `bootstrapAi()` kendi içinde
 * idempotent (`bootstrapped` bayrağı) — birden fazla AI route
 * wrapper'ının bunu çağırması GÜVENLİ.
 *
 * 🔴 GERÇEK BULGU (build çıktısı incelenirken YAKALANDI, varsayılmadı):
 * İlk denemede `import { bootstrapAi } from "../modules/ai/bootstrapAi"`
 * STATİK olarak dosyanın BAŞINDA yazılmıştı — bu, `bootstrapAi()`
 * FONKSİYONUNUN çağrılması ertelense bile, `bootstrapAi.ts` MODÜLÜNÜN
 * (ve onun statik import ettiği `GeminiProvider.ts`/`@google/genai`'nin)
 * `AppRouter.tsx` ile BİRLİKTE ana bundle'a dahil olmasına neden
 * oluyordu (JS modül sisteminin doğası — `import` ifadesi modülü HER
 * ZAMAN yükler, fonksiyonun çağrılıp çağrılmadığına BAKMAKSIZIN).
 * Gerçek `npm run build` çıktısı bunu KANITLADI: ana bundle hâlâ
 * ~744kB idi. Düzeltme: `bootstrapAi` modülünün KENDİSİ de dinamik
 * `import()` ile, SADECE bir AI route wrapper GERÇEKTEN mount
 * olduğunda yükleniyor.
 */
function useAiBootstrap(): void {
  useEffect(() => {
    import("../modules/ai/bootstrapAi").then((m) => m.bootstrapAi());
  }, []);
}

function AiLoadingFallback() {
  const { t } = useTranslation();
  return (
    <main className="status-screen">
      <p className="status-card__value">{t("common.loading")}</p>
    </main>
  );
}

function ParcelsScreenRoute() {
  const navigate = useNavigate();
  return (
    <ParcelsScreen
      onViewTrees={(parcel) => navigate(buildPath.parcelTrees(parcel.id))}
      onViewReferenceTrees={() => navigate(buildPath.referenceTrees())}
      onViewFinance={(parcel) => navigate(buildPath.parcelFinance(parcel.id))}
      onViewMaintenance={(parcel) => navigate(buildPath.parcelMaintenance(parcel.id))}
      onViewHarvest={(parcel) => navigate(buildPath.parcelHarvest(parcel.id))}
      onViewBulkOperations={(parcel) => navigate(buildPath.parcelBulkOperations(parcel.id))}
      onViewAiChat={() => navigate(buildPath.aiChat())}
      onViewParcelAiChat={(parcel) => navigate(buildPath.parcelAiChat(parcel.id))}
      onViewSettings={() => navigate(buildPath.settings())}
      onViewDashboard={() => navigate(buildPath.dashboard())}
    />
  );
}

function TreesScreenRoute() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();

  if (!parcelId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <TreesScreen
      mode={{ mode: "parcel", parcelId }}
      onBack={() => navigate(-1)}
      onViewObservations={(tree) => navigate(buildPath.treeObservations(tree.id))}
      onViewMaintenance={(tree) => navigate(buildPath.treeMaintenance(tree.id))}
      onViewHarvest={(tree) => navigate(buildPath.treeHarvest(tree.id))}
      onViewAiChat={(tree) => navigate(buildPath.treeAiChat(tree.id))}
    />
  );
}

/**
 * `FinanceScreen` sadece `parcelId`'ye ihtiyaç duyuyor (rotadan
 * doğrudan geliyor) — `TreesScreenRoute` kadar basit, `Observation
 * ScreenRoute`'un aksine hiçbir async veri çekme gerekmiyor.
 */
function FinanceScreenRoute() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();

  if (!parcelId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <FinanceScreen
      scope={{ mode: "parcel", parcelId }}
      parcelId={parcelId}
      onBack={() => navigate(-1)}
    />
  );
}

/**
 * `MaintenanceScreen` sadece `parcelId`'ye ihtiyaç duyuyor (rotadan
 * doğrudan geliyor) — `FinanceScreenRoute` ile birebir aynı basitlik.
 */
function MaintenanceScreenRoute() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();

  if (!parcelId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <MaintenanceScreen
      scope={{ mode: "parcel", parcelId }}
      parcelId={parcelId}
      onBack={() => navigate(-1)}
    />
  );
}

function HarvestScreenRoute() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();

  if (!parcelId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <HarvestScreen
      scope={{ mode: "parcel", parcelId }}
      parcelId={parcelId}
      onBack={() => navigate(-1)}
    />
  );
}

function BulkOperationsScreenRoute() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();

  if (!parcelId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return <BulkOperationsScreen parcelId={parcelId} onBack={() => navigate(-1)} />;
}

function ReferenceTreesScreenRoute() {
  const navigate = useNavigate();
  return (
    <TreesScreen
      mode={{ mode: "reference" }}
      onBack={() => navigate(-1)}
      onViewObservations={(tree) => navigate(buildPath.treeObservations(tree.id))}
      onViewMaintenance={(tree) => navigate(buildPath.treeMaintenance(tree.id))}
      onViewHarvest={(tree) => navigate(buildPath.treeHarvest(tree.id))}
      onViewAiChat={(tree) => navigate(buildPath.treeAiChat(tree.id))}
    />
  );
}

/**
 * `ObservationScreen`'in `parcelId`/`contextLabel` prop'ları için
 * `Tree` nesnesi ZORUNLU (bkz. App.tsx'in eski `observations-for-tree`
 * durumu — orada tam `Tree` nesnesi zaten elde vardı; rotada sadece
 * `treeId` var, bu yüzden burada AYNI veriyi tek bir sorguyla
 * yeniden elde ediyoruz — repository katmanına dokunmadan).
 *
 * MİMARİ İSTİSNA (Modül 4 Bağımsız Denetimi'nde bulundu, Sprint
 * 4.3.1'de değerlendirilip BİLİNÇLİ OLARAK KORUNDU — bkz.
 * docs/engineering-protocol.md Bölüm 21): Bu, `treeRepository`'ye
 * Hook katmanını atlayıp DOĞRUDAN erişen tek yer. Gerekçe: mevcut
 * `useTrees` liste-odaklı, tekil "id'ye göre getir" modu yok; bunun
 * için yeni bir soyutlama eklemek YAGNI ihlali olurdu.
 */
function ObservationScreenRoute() {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tree = useTreeForRoute(treeId);

  if (!treeId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }
  if (tree === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }
  if (tree === null) {
    // Ağaç bulunamadı (silinmiş/geçersiz id) — güvenli bir noktaya dön.
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <ObservationScreen
      scope={{ mode: "tree", treeId: tree.id }}
      parcelId={tree.parcelId}
      contextLabel={`${tree.treeNumber} — ${tree.variety}`}
      onBack={() => navigate(-1)}
      onViewPhotos={(observation) => navigate(buildPath.observationPhotos(observation.id))}
    />
  );
}

/**
 * `MaintenanceScreen`'in `parcelId` prop'u için `Tree` nesnesi
 * ZORUNLU — rotada sadece `treeId` var. `useTreeForRoute` hook'unu
 * kullanıyor (bkz. `router/useTreeForRoute.ts` — Sprint 7.1'de,
 * "3. tekrar" eşiği aşılınca gerçekleştirilen soyutlama).
 */
function TreeMaintenanceScreenRoute() {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tree = useTreeForRoute(treeId);

  if (!treeId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }
  if (tree === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }
  if (tree === null) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <MaintenanceScreen
      scope={{ mode: "tree", treeId: tree.id }}
      parcelId={tree.parcelId}
      onBack={() => navigate(-1)}
    />
  );
}

/**
 * `HarvestScreen`'in `parcelId` prop'u için `Tree` nesnesi ZORUNLU —
 * rotada sadece `treeId` var. `useTreeForRoute` hook'unu kullanıyor
 * (bkz. `router/useTreeForRoute.ts` — Sprint 7.1'de "3. tekrar" eşiği
 * aşılınca gerçekleştirilen soyutlama; bu, 4. kullanım — YENİ bir
 * soyutlama GEREKMİYOR, mevcut hook zaten hazır).
 */
function TreeHarvestScreenRoute() {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tree = useTreeForRoute(treeId);

  if (!treeId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }
  if (tree === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }
  if (tree === null) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <HarvestScreen
      scope={{ mode: "tree", treeId: tree.id }}
      parcelId={tree.parcelId}
      onBack={() => navigate(-1)}
    />
  );
}

function DashboardScreenRoute() {
  const navigate = useNavigate();
  return <DashboardScreen onBack={() => navigate(-1)} />;
}

function SettingsScreenRoute() {
  const navigate = useNavigate();
  return (
    <SettingsScreen
      onViewAiSettings={() => navigate(buildPath.aiSettings())}
      onViewDataManagement={() => navigate(buildPath.dataManagement())}
      onViewLanguageSettings={() => navigate(buildPath.language())}
    />
  );
}

/** `/settings/language` — Sprint 10.18. `onBack`, diğer Ayarlar alt-ekranlarıyla AYNI ilke (her zaman Ayarlar hub'ına). */
function LanguageSettingsScreenRoute() {
  const navigate = useNavigate();
  return <LanguageSettingsScreen onBack={() => navigate(buildPath.settings())} />;
}

/** `/settings/data-management` — Sprint 10.13. `onBack`, AI Ayarları ile AYNI ilke (her zaman Ayarlar hub'ına). */
function DataManagementScreenRoute() {
  const navigate = useNavigate();
  return <DataManagementScreen onBack={() => navigate(buildPath.settings())} />;
}

/**
 * `/settings/ai` — `/settings`'in ALT sayfası (route hiyerarşisi,
 * kullanıcı kararı 2026-07-17). `onBack`, `navigate(-1)` DEĞİL,
 * her zaman `buildPath.settings()` — bu ekrana Sohbet ekranından
 * ("AI Settings" linki) VEYA Ayarlar hub'ından ulaşılabiliyor, ama
 * "geri" HER İKİ durumda da mantıksal ebeveyne (Ayarlar hub'ı) gitmeli
 * (Android'in "up navigation" ilkesiyle tutarlı, `navigate(-1)`'in
 * geldiğin yere göre TUTARSIZ davranmasından kaçınmak için).
 */
function AiSettingsScreenRoute() {
  const navigate = useNavigate();
  useAiBootstrap();
  return (
    <Suspense fallback={<AiLoadingFallback />}>
      <AiSettingsScreenLazy onBack={() => navigate(buildPath.settings())} />
    </Suspense>
  );
}

/** `/ai/chat` — GENEL (parsel/ağaç bağımsız) AI Asistan. */
function AiChatScreenRoute() {
  const navigate = useNavigate();
  useAiBootstrap();
  const { settings } = useAiSettings();
  return (
    <Suspense fallback={<AiLoadingFallback />}>
      <AiChatScreenLazy
        onBack={() => navigate(-1)}
        onViewSettings={() => navigate(buildPath.aiSettings())}
        debugMode={settings?.debugMode}
        onViewDiagnostics={() => navigate(buildPath.aiDiagnostics())}
      />
    </Suspense>
  );
}

/** `/parcels/:parcelId/ai` — PARSEL-bağlamlı AI Asistan. */
function ParcelAiChatScreenRoute() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  useAiBootstrap();
  const { settings } = useAiSettings();

  if (!parcelId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <Suspense fallback={<AiLoadingFallback />}>
      <AiChatScreenLazy
        screenContext={{ parcelId }}
        onBack={() => navigate(-1)}
        onViewSettings={() => navigate(buildPath.aiSettings())}
        debugMode={settings?.debugMode}
        onViewDiagnostics={() => navigate(buildPath.aiDiagnostics())}
      />
    </Suspense>
  );
}

/**
 * `/trees/:treeId/ai` — AĞAÇ-bağlamlı AI Asistan. `useTreeForRoute`
 * kullanıyor (bkz. `router/useTreeForRoute.ts`).
 */
function TreeAiChatScreenRoute() {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tree = useTreeForRoute(treeId);
  useAiBootstrap();
  const { settings } = useAiSettings();

  if (!treeId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }
  if (tree === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }
  if (tree === null) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <Suspense fallback={<AiLoadingFallback />}>
      <AiChatScreenLazy
        screenContext={{ parcelId: tree.parcelId, treeId: tree.id }}
        onBack={() => navigate(-1)}
        onViewSettings={() => navigate(buildPath.aiSettings())}
        debugMode={settings?.debugMode}
        onViewDiagnostics={() => navigate(buildPath.aiDiagnostics())}
      />
    </Suspense>
  );
}

function PhotoGalleryScreenRoute() {
  const { observationId } = useParams<{ observationId: string }>();
  const navigate = useNavigate();

  if (!observationId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <PhotoGalleryScreen
      observationId={observationId}
      onBack={() => navigate(-1)}
      onAnalyze={(photo) => navigate(buildPath.photoAnalysis(photo.id))}
    />
  );
}

/**
 * PhotoAnalysisScreenRoute
 * ===========================
 * bkz. Sprint 10.5. `PhotoAnalysisScreen`'in `photo: Photo` (TAM
 * nesne) prop gereksinimini karşılamak için, `photoId`'den GERÇEK
 * fotoğrafı asenkron olarak yükler.
 *
 * KULLANICI KARARI (2026-07-20): `useTreeForRoute`'un KODU BİREBİR
 * KOPYALANMADI — SADECE davranış deseni (loading/null/hazır 3 durumu,
 * `cancelled` flag'iyle race condition koruması, `useBackButtonFallback`
 * ile "loading" sırasında geri tuşu desteği) TAKLİT EDİLDİ. Photo
 * modülü, Tree modülüne HİÇBİR ŞEKİLDE bağımlı değil — `photoRepository`
 * DOĞRUDAN kullanılıyor, `useTreeForRoute`'tan hiçbir import YOK.
 *
 * Bu, GENEL bir "usePhotoForRoute" hook'u olarak SOYUTLANMADI — Photo
 * için bu İLK kullanım (Engineering Protocol Bölüm 21'in "3. tekrar
 * eşiği" ilkesi, Sprint 10.5 mimari analizinde gerekçelendirildi).
 */
function PhotoAnalysisScreenRoute() {
  const { photoId } = useParams<{ photoId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<Photo | null | "loading">("loading");
  const { settings } = useAiSettings();

  useEffect(() => {
    if (!photoId) return;
    let cancelled = false;
    setPhoto("loading");
    photoRepository.getById(photoId).then((result) => {
      if (!cancelled) setPhoto(result);
    });
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  useBackButtonFallback(photo === "loading", () => navigate(-1));

  if (!photoId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  if (photo === "loading") {
    return (
      <main className="status-screen">
        <p className="status-card__value">{t("common.loading")}</p>
      </main>
    );
  }

  if (photo === null) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <PhotoAnalysisScreen
      photo={photo}
      onBack={() => navigate(-1)}
      debugMode={settings?.debugMode}
      onViewDiagnostics={() => navigate(buildPath.aiDiagnostics())}
    />
  );
}

/**
 * `/ai/diagnostics` — AI Diagnostic Build (Sprint 10.7). Route
 * seviyesinde EK bir koruma: `settings.debugMode` false/yüklenmemişse
 * Ana Ekrana yönlendirir — `AiDiagnosticScreen`'in KENDİ `null` render
 * korumasıyla BİRLİKTE iki katmanlı güvenlik (defense in depth).
 */
function AiDiagnosticScreenRoute() {
  const navigate = useNavigate();
  const { settings, status } = useAiSettings();

  if (status === "loading" || status === "idle") {
    return null;
  }
  if (!settings?.debugMode) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return (
    <Suspense fallback={<AiLoadingFallback />}>
      <AiDiagnosticScreenLazy onBack={() => navigate(-1)} debugMode={settings.debugMode} />
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTE_PATTERNS.parcels} element={<ParcelsScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelTrees} element={<TreesScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelFinance} element={<FinanceScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelMaintenance} element={<MaintenanceScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelHarvest} element={<HarvestScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelBulkOperations} element={<BulkOperationsScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelAiChat} element={<ParcelAiChatScreenRoute />} />
        <Route path={ROUTE_PATTERNS.referenceTrees} element={<ReferenceTreesScreenRoute />} />
        <Route path={ROUTE_PATTERNS.treeObservations} element={<ObservationScreenRoute />} />
        <Route path={ROUTE_PATTERNS.treeMaintenance} element={<TreeMaintenanceScreenRoute />} />
        <Route path={ROUTE_PATTERNS.treeHarvest} element={<TreeHarvestScreenRoute />} />
        <Route path={ROUTE_PATTERNS.treeAiChat} element={<TreeAiChatScreenRoute />} />
        <Route path={ROUTE_PATTERNS.observationPhotos} element={<PhotoGalleryScreenRoute />} />
        <Route path={ROUTE_PATTERNS.photoAnalysis} element={<PhotoAnalysisScreenRoute />} />
        <Route path={ROUTE_PATTERNS.aiChat} element={<AiChatScreenRoute />} />
        <Route path={ROUTE_PATTERNS.settings} element={<SettingsScreenRoute />} />
        <Route path={ROUTE_PATTERNS.dashboard} element={<DashboardScreenRoute />} />
        <Route path={ROUTE_PATTERNS.aiSettings} element={<AiSettingsScreenRoute />} />
        <Route path={ROUTE_PATTERNS.dataManagement} element={<DataManagementScreenRoute />} />
        <Route path={ROUTE_PATTERNS.language} element={<LanguageSettingsScreenRoute />} />
        <Route path={ROUTE_PATTERNS.aiDiagnostics} element={<AiDiagnosticScreenRoute />} />
        <Route path="*" element={<Navigate to={buildPath.parcels()} replace />} />
      </Routes>
    </HashRouter>
  );
}
