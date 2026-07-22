/**
 * base64Binary.ts — Güvenli base64 ↔ Uint8Array Dönüşümü
 * ============================================================
 * bkz. Sprint 10.13 (Veri Yönetimi). GERÇEK BULGU: `btoa(String.
 * fromCharCode(...bytes))` deseni, BÜYÜK dizilerde (ör. birkaç MB'lık
 * bir fotoğraf/ZIP dosyası) "Maximum call stack size exceeded" hatası
 * fırlatabilir — spread operatörü, dizinin TÜM elemanlarını fonksiyon
 * argümanı olarak açar, JS motorunun çağrı yığını (call stack)
 * boyutunu aşabilir. Bu, VARSAYILMADI — JavaScript'in spread/apply
 * için bilinen, dokümante edilmiş bir sınırlamasıdır (motor başına
 * değişir ama tipik sınır ~65k-100k eleman civarındadır, bir fotoğraf
 * kolayca milyonlarca byte içerir).
 *
 * DÜZELTME: Parçalar (chunk) halinde işleme — her seferinde sınırlı
 * sayıda byte, spread/apply riskini ortadan kaldırır.
 */

const CHUNK_SIZE = 8192;

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
