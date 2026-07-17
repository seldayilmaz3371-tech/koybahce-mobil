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
  referenceTrees: "/reference-trees",
  treeObservations: "/trees/:treeId/observations",
  treeMaintenance: "/trees/:treeId/maintenance",
  observationPhotos: "/observations/:observationId/photos",
} as const;

export const buildPath = {
  parcels: () => "/parcels",
  parcelTrees: (parcelId: string) => `/parcels/${parcelId}/trees`,
  parcelFinance: (parcelId: string) => `/parcels/${parcelId}/finance`,
  parcelMaintenance: (parcelId: string) => `/parcels/${parcelId}/maintenance`,
  referenceTrees: () => "/reference-trees",
  treeObservations: (treeId: string) => `/trees/${treeId}/observations`,
  treeMaintenance: (treeId: string) => `/trees/${treeId}/maintenance`,
  observationPhotos: (observationId: string) => `/observations/${observationId}/photos`,
} as const;

/**
 * GELECEKTEKİ MODÜLLER İÇİN AYRILMIŞ İSİM ALANI (Sprint 4.0 onayı) —
 * bugün hiçbir <Route>'a bağlı değil, hiçbir ekran yok. Sadece
 * isimlendirme tutarlılığı için burada belgeleniyor; gelecekteki
 * modüller bu isimlerle başlayacak.
 *
 * `finance` BURADAN KALDIRILDI (Sprint 4.3) — artık gerçek bir rota
 * (`ROUTE_PATTERNS.parcelFinance`), düz `/finance` DEĞİL, `/trees`
 * ile tutarlı `/parcels/:parcelId/finance` deseninde.
 */
export const FUTURE_ROUTE_NAMES = {
  parcelDetail: "/parcels/:parcelId",
  treeDetail: "/trees/:treeId",
  observationDetail: "/observations/:observationId",
  harvest: "/harvest",
  dashboard: "/dashboard",
  settings: "/settings",
} as const;
