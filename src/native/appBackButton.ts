/**
 * Android Geri Tuşu — İnce Sarmalayıcı Katmanı
 * =================================================
 * bkz. docs/database-master-schema.md ve Sprint 2.6 (Modül 2 Gözden
 * Geçirmede bulunan teknik borç, gerçek cihaz testiyle doğrulandı).
 *
 * MİMARİ KARAR: `App.addListener('backButton', ...)` kaydedilince,
 * Android'in varsayılan geri tuşu davranışı TAMAMEN devre dışı kalır
 * (resmi tip tanımlarında doğrulandı: "@capacitor/app" — çıkış için
 * `exitApp()`'in açıkça çağrılması gerekiyor). Bu yüzden HER ekranın
 * kendi geri tuşu davranışını kendisi yönetmesi gerekiyor.
 *
 * YENİ BİR NAVİGASYON/STATE YÖNETİMİ KATMANI EKLENMEDİ (Development
 * Manifest kısıtı): Bu sarmalayıcı, her ekranın KENDİ mevcut yerel
 * view-state'ine (zaten var olan `useState`) göre davranacak şekilde,
 * o ekranın içinde kullanılıyor — App.tsx'in üst düzey navigasyonu
 * veya ekranların kendi iç state yönetimi hiç değişmedi.
 */

import { App } from "@capacitor/app";

/**
 * Geri tuşuna basıldığında `onBackButton` çağrılır. Dönen fonksiyon,
 * dinleyiciyi kaldırır — çağıran taraf bunu `useEffect`'in temizleme
 * (cleanup) fonksiyonunda kullanmalıdır.
 */
export function addBackButtonListener(onBackButton: () => void): () => void {
  const listenerPromise = App.addListener("backButton", () => {
    onBackButton();
  });

  return () => {
    listenerPromise.then((listener) => listener.remove());
  };
}

/** Uygulamayı tamamen kapatır — SADECE "artık geri gidilecek bir yer yok" durumunda çağrılmalıdır. */
export async function exitApp(): Promise<void> {
  await App.exitApp();
}
