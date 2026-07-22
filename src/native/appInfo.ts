/**
 * Uygulama Sürüm Bilgisi — İnce Sarmalayıcı Katmanı
 * =====================================================
 * bkz. Sprint 10.13 (Veri Yönetimi). GERÇEK BULGU: `package.json`'daki
 * sürüm (`0.1.0-beta.1`), Vite build sürecinde runtime'a hiç
 * aktarılmıyor (hiçbir `define`/`import.meta.env` tanımı yok) — bu
 * yüzden JS kodu bunu doğrudan okuyamaz. `@capacitor/app` (zaten
 * kurulu, `native/appLifecycle.ts`/`appBackButton.ts`'te kullanılıyor)
 * `getInfo()` ile GERÇEK uygulama sürümünü (Android manifestinden,
 * resmi tip tanımlarından doğrulandı: `AppInfo.version: string`) sağlıyor.
 */

import { App } from "@capacitor/app";

/**
 * GERÇEK, native Android manifestinden okunan uygulama sürümünü
 * döner (ör. "0.1.0-beta.1"). Web ortamında (`Capacitor.getPlatform()
 * === "web"`) `App.getInfo()` desteklenmez — bu durumda `null` döner,
 * çağıran taraf bir fallback kullanır.
 */
export async function getAppVersion(): Promise<string | null> {
  try {
    const info = await App.getInfo();
    return info.version;
  } catch {
    // Web ortamı veya eklenti kullanılamıyor — GERÇEK bir hata değil,
    // beklenen bir platform sınırı (established pattern: dosya
    // başlığındaki not).
    return null;
  }
}
