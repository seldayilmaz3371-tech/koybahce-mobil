/**
 * Rota Tanımları — Tek Kaynak
 * =============================
 * bkz. Sprint 4.0 onayı (2026-07-15). İsimlendirme, bugünkü ekranlara
 * değil DOMAIN mimarisine göre tasarlandı — gelecekteki Finans/Bakım/
 * Hasat/Dashboard/Ayarlar modülleri, `/trees/:treeId/finance` gibi
 * doğal alt-rotalar ekleyebilecek, yeniden tasarım gerekmeyecek.
 *
 * PATTERNS: React Router `<Route path="...">` için (`:param` yer
 * tutucularıyla). buildPath: `navigate(...)` çağrıları için gerçek
 * yol üreten fonksiyonlar.
 */

export const ROUTE_PATTERNS = {
  parcels: "/parcels",
  parcelTrees: "/parcels/:parcelId/trees",
  parcelFinance: "/parcels/:parcelId/finance",
  parcelMaintenance: "/parcels/:parcelId/maintenance",
  parcelHarvest: "/parcels/:parcelId/harvest",
  parcelAiChat: "/parcels/:parcelId/ai",
  referenceTrees: "/reference-trees",
  treeObservations: "/trees/:treeId/observations",
  treeMaintenance: "/trees/:treeId/maintenance",
  treeHarvest: "/trees/:treeId/harvest",
  treeAiChat: "/trees/:treeId/ai",
  observationPhotos: "/observations/:observationId/photos",
  aiChat: "/ai/chat",
  settings: "/settings",
  aiSettings: "/settings/ai",
} as const;

export const buildPath = {
  parcels: () => "/parcels",
  parcelTrees: (parcelId: string) => `/parcels/${parcelId}/trees`,
  parcelFinance: (parcelId: string) => `/parcels/${parcelId}/finance`,
  parcelMaintenance: (parcelId: string) => `/parcels/${parcelId}/maintenance`,
  parcelHarvest: (parcelId: string) => `/parcels/${parcelId}/harvest`,
  parcelAiChat: (parcelId: string) => `/parcels/${parcelId}/ai`,
  referenceTrees: () => "/reference-trees",
  treeObservations: (treeId: string) => `/trees/${treeId}/observations`,
  treeMaintenance: (treeId: string) => `/trees/${treeId}/maintenance`,
  treeHarvest: (treeId: string) => `/trees/${treeId}/harvest`,
  treeAiChat: (treeId: string) => `/trees/${treeId}/ai`,
  observationPhotos: (observationId: string) => `/observations/${observationId}/photos`,
  aiChat: () => "/ai/chat",
  settings: () => "/settings",
  aiSettings: () => "/settings/ai",
} as const;

/**
 * GELECEKTEKİ MODÜLLER İÇİN AYRILMIŞ İSİM ALANI (Sprint 4.0 onayı) —
 * bugün hiçbir <Route>'a bağlı değil, hiçbir ekran yok. Sadece
 * isimlendirme tutarlılığı için burada belgeleniyor; gelecekteki
 * modüller bu isimlerle başlayacak.
 *
 * `finance` BURADAN KALDIRILDI (Sprint 4.3), `settings` BURADAN
 * KALDIRILDI (Sprint 7.1), `harvest` BURADAN KALDIRILDI (Sprint 8.3)
 * — üçü de artık GERÇEK birer rota. `harvest: "/harvest"` (eski,
 * bağlamsız placeholder) GERÇEK deseni (`parcelHarvest`/`treeHarvest`,
 * Bakım/Finans/AI ile TUTARLI) yansıtmıyordu — bilinçli olarak
 * değiştirildi, "keyfi" bir değişiklik değil.
 */
export const FUTURE_ROUTE_NAMES = {
  parcelDetail: "/parcels/:parcelId",
  treeDetail: "/trees/:treeId",
  observationDetail: "/observations/:observationId",
  dashboard: "/dashboard",
} as const;
