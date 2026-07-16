/**
 * Uygulama Yaşam Döngüsü — İnce Sarmalayıcı
 * =============================================
 * bkz. Sprint 4.3.1 (Modül 4 Bağımsız Denetimi'nde bulunan P1 güvenlik
 * bulgusu — uygulama arka plandan öne alındığında yeniden kilitlenmiyordu).
 *
 * API DOĞRULAMASI (varsayılmadı — @capacitor/app'in resmi tip
 * tanımlarından kontrol edildi): `AppState { isActive: boolean }`,
 * `addListener('appStateChange', ...)`. Android'de bu olay, Capacitor'ın
 * Activity `onResume`/`onStop` metodları çağrıldığında tetikleniyor —
 * yani hem "warm start" (arka plandan geri dönüş) hem "arka plana
 * geçiş" TEK bir olayla yakalanıyor.
 *
 * KAPSAM DIŞI (bilinçli): "process kill" senaryosu (Android, uygulama
 * sürecini tamamen sonlandırırsa) burada ELE ALINMIYOR çünkü zaten
 * ele alınmasına GEREK YOK — süreç öldüğünde TÜM React state'i
 * (App.tsx'teki `unlocked` dahil) sıfırdan başlıyor, `useState(false)`
 * varsayılanı zaten güvenli. Bu, kod YAZMADAN önce doğrulanan bir
 * mimari gerçek, varsayım değil.
 */

import { App } from "@capacitor/app";

/**
 * Uygulama arka plana alındığında (`isActive: false`) veya öne
 * geldiğinde (`isActive: true`) `onStateChange` çağrılır.
 */
export function addAppStateChangeListener(onStateChange: (isActive: boolean) => void): () => void {
  const listenerPromise = App.addListener("appStateChange", ({ isActive }) => {
    onStateChange(isActive);
  });

  return () => {
    listenerPromise.then((listener) => listener.remove());
  };
}
