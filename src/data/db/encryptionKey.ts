/**
 * Veritabanı Şifreleme Anahtarı Yönetimi
 * ========================================
 *
 * MİMARİ KARAR (bkz. docs/adr/0004-veri-tabani-sifreleme.md):
 * SQLite veritabanı SQLCipher ile şifreli açılır. Şifreleme parolası:
 *
 *   1. Uygulamanın ilk açılışında, kriptografik olarak güvenli rastgele
 *      256 bit'lik bir değer olarak ÜRETİLİR (Web Crypto API — ekstra
 *      bir kütüphane gerektirmez, tarayıcı/WebView motorunda yerleşiktir).
 *   2. Bu değer, Android KeyStore korumalı güvenli depoya (secureStorage.ts)
 *      yazılır — düz metin olarak hiçbir yerde (kod, log, dosya) tutulmaz.
 *   3. Sonraki her açılışta aynı depodan okunur.
 *
 * NEDEN KENDİMİZ ÜRETİYORUZ, KULLANICIYA SORMUYORUZ?
 * Kural 15 gereği uygulama saha koşullarında (eldivenle, tek elle) hızlı
 * kullanılmalı. Kullanıcıya ayrı bir "veritabanı şifresi" sormak hem
 * kullanılabilirliği bozar hem de unutulma riski taşır. Şifreleme
 * burada "kullanıcıdan gizli bir sır" değil, "cihaz çalınırsa/kaybolursa
 * ham dosyanın okunabilir olmaması" için bir savunma katmanıdır. Erişim
 * kontrolü zaten ayrı bir mekanizmayla (biyometrik kilit ekranı)
 * sağlanıyor.
 */

import { secureStorage, SecureStorageKey } from "../../native/secureStorage";

/** Üretilecek anahtarın bit uzunluğu. 256 bit, SQLCipher için önerilen güçtür. */
const KEY_LENGTH_BYTES = 32; // 256 bit

/**
 * Web Crypto API kullanarak kriptografik olarak güvenli rastgele bir
 * onaltılık (hex) string üretir. `Math.random()` KULLANILMAZ — o
 * kriptografik olarak güvenli değildir ve şifreleme anahtarı üretimi
 * için asla kullanılmamalıdır.
 */
function generateRandomPassphrase(): string {
  const randomBytes = new Uint8Array(KEY_LENGTH_BYTES);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Veritabanı şifreleme parolasını döndürür. Daha önce üretilmemişse
 * (uygulamanın ilk çalıştırılması), yeni bir parola üretip güvenli
 * depoya yazar ve onu döndürür. Bu fonksiyon idempotenttir: birden
 * fazla çağrılsa bile hep aynı parolayı döndürür.
 */
export async function getOrCreateDatabaseEncryptionKey(): Promise<string> {
  const existing = await secureStorage.get(SecureStorageKey.DATABASE_ENCRYPTION_KEY);
  if (existing !== null) {
    return existing;
  }

  const newPassphrase = generateRandomPassphrase();
  await secureStorage.set(SecureStorageKey.DATABASE_ENCRYPTION_KEY, newPassphrase);
  return newPassphrase;
}
