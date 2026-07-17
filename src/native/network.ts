/**
 * Ağ Durumu — İnce Sarmalayıcı Katmanı
 * ========================================
 * bkz. `native/biometricAuth.ts`/`camera.ts` ile AYNI desen (Kural
 * 12) — uygulamanın geri kalanı `@capacitor/network`'ü DOĞRUDAN
 * import ETMEZ.
 *
 * Sprint 6'da SADECE AI Sohbet ekranının "şu an çevrimiçi miyim"
 * göstergesi için kullanılıyor (Bölüm 8 — Offline-First AI).
 */

import { Network } from "@capacitor/network";

/** Şu an aktif bir internet bağlantısı var mı? */
export async function isOnline(): Promise<boolean> {
  const status = await Network.getStatus();
  return status.connected;
}

/** Bağlantı durumu değiştiğinde çağrılır. Temizlik fonksiyonu döner. */
export function addNetworkStatusListener(callback: (connected: boolean) => void): () => void {
  let cancelled = false;
  const handlePromise = Network.addListener("networkStatusChange", (status) => {
    if (!cancelled) callback(status.connected);
  });

  return () => {
    cancelled = true;
    handlePromise.then((handle) => handle.remove());
  };
}
