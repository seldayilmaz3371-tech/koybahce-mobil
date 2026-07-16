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

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from "react-router";
import { ParcelsScreen } from "../modules/parcels/ParcelsScreen";
import { TreesScreen } from "../modules/trees/TreesScreen";
import { ObservationScreen } from "../modules/observations/ObservationScreen";
import { PhotoGalleryScreen } from "../modules/photos/PhotoGalleryScreen";
import { FinanceScreen } from "../modules/finance/FinanceScreen";
import { treeRepository } from "../modules/trees/data/tree.repository";
import type { Tree } from "../modules/trees/domain/tree.types";
import { useBackButtonFallback } from "./BackButtonHandler";
import { ROUTE_PATTERNS, buildPath } from "./routes";

function ParcelsScreenRoute() {
  const navigate = useNavigate();
  return (
    <ParcelsScreen
      onViewTrees={(parcel) => navigate(buildPath.parcelTrees(parcel.id))}
      onViewReferenceTrees={() => navigate(buildPath.referenceTrees())}
      onViewFinance={(parcel) => navigate(buildPath.parcelFinance(parcel.id))}
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

function ReferenceTreesScreenRoute() {
  const navigate = useNavigate();
  return (
    <TreesScreen
      mode={{ mode: "reference" }}
      onBack={() => navigate(-1)}
      onViewObservations={(tree) => navigate(buildPath.treeObservations(tree.id))}
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
  const [tree, setTree] = useState<Tree | null | "loading">("loading");

  useEffect(() => {
    if (!treeId) return;
    let cancelled = false;
    setTree("loading");
    treeRepository.getById(treeId).then((result) => {
      if (!cancelled) setTree(result);
    });
    return () => {
      cancelled = true;
    };
  }, [treeId]);

  useBackButtonFallback(tree === "loading", () => navigate(-1));

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

function PhotoGalleryScreenRoute() {
  const { observationId } = useParams<{ observationId: string }>();
  const navigate = useNavigate();

  if (!observationId) {
    return <Navigate to={buildPath.parcels()} replace />;
  }

  return <PhotoGalleryScreen observationId={observationId} onBack={() => navigate(-1)} />;
}

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTE_PATTERNS.parcels} element={<ParcelsScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelTrees} element={<TreesScreenRoute />} />
        <Route path={ROUTE_PATTERNS.parcelFinance} element={<FinanceScreenRoute />} />
        <Route path={ROUTE_PATTERNS.referenceTrees} element={<ReferenceTreesScreenRoute />} />
        <Route path={ROUTE_PATTERNS.treeObservations} element={<ObservationScreenRoute />} />
        <Route path={ROUTE_PATTERNS.observationPhotos} element={<PhotoGalleryScreenRoute />} />
        <Route path="*" element={<Navigate to={buildPath.parcels()} replace />} />
      </Routes>
    </HashRouter>
  );
}
