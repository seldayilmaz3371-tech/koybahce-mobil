/**
 * Güvenli Anahtar/Değer Deposu — İnce Sarmalayıcı Katmanı
 * ==========================================================
 *
 * NEDEN BU DOSYA VAR?
 * Uygulamanın geri kalanı `@aparajita/capacitor-secure-storage` paketini
 * hiçbir zaman doğrudan import etmez. Bunun yerine sadece bu dosyadaki
 * `secureStorage` nesnesini kullanır. Böylece:
 *
 *   1. İleride bu eklentiyi değiştirmek gerekirse (ör. bakımı durursa),
 *      değişiklik tek bir dosyada kalır — tüm uygulamayı taramaya gerek
 *      kalmaz (Kural 12: kod tekrarından kaçınma / tek sorumluluk).
 *   2. Anahtar isimleri burada merkezi olarak tanımlanır, farklı
 *      modüllerin birbirinden habersiz aynı anahtarı farklı şekilde
 *      kullanmasının önüne geçilir.
 *   3. Eklentinin ham hata tipi (StorageError) uygulamanın geri kalanına
 *      sızmaz; çağıranlar sade bir Promise<string | null> ile çalışır.
 *
 * GÜVENLİK MODELİ (Android):
 * @aparajita/capacitor-secure-storage, veriyi Android KeyStore'da üretilen
 * bir gizli anahtarla şifreler ve uygulamaya özel bir depoda saklar.
 * Uygulama silindiğinde bu veri de silinir. Bu depoya erişim, biyometrik
 * doğrulama GEREKTİRMEZ (arka planda sessizce okunabilir) — bu bilinçli
 * bir tasarım: veritabanı şifreleme anahtarı gibi değerlerin her
 * okunuşunda kullanıcıya parmak izi sorulması saha kullanılabilirliğini
 * ciddi şekilde bozar. Kullanıcı deneyimi seviyesindeki erişim kontrolü
 * zaten uygulama açılışındaki kilit ekranı (bkz. biometricAuth.ts)
 * tarafından sağlanıyor.
 */

import { SecureStorage } from "@aparajita/capacitor-secure-storage";

/**
 * Bu depoda saklanan tüm anahtarların merkezi listesi. Yeni bir gizli
 * değer saklamak istediğinizde buraya bir sabit ekleyin — kod tabanının
 * herhangi bir yerinde ham string anahtar adı yazılmamalıdır.
 */
export const SecureStorageKey = {
  /** SQLite veritabanını şifrelemek için kullanılan, cihazda bir kez üretilen rastgele parola. */
  DATABASE_ENCRYPTION_KEY: "db_encryption_key",
  /** Kullanıcının kendi girdiği Google Gemini API anahtarı (yalnızca AI özellikleri tetiklendiğinde kullanılır). */
  GEMINI_API_KEY: "gemini_api_key",
} as const;

export type SecureStorageKeyName =
  (typeof SecureStorageKey)[keyof typeof SecureStorageKey];

/**
 * Verilen anahtar altında güvenli olarak saklanmış string değeri okur.
 * Anahtar hiç ayarlanmamışsa `null` döner — eklentinin kendi davranışı
 * zaten bu şekildedir, ekstra bir try/catch'e gerek yoktur.
 *
 * `convertDate: false` veriyoruz çünkü sakladığımız tüm değerler düz
 * string (parola, API anahtarı); eklentinin ISO tarih dönüştürme
 * mantığının araya girmesini istemiyoruz.
 */
async function getSecureValue(key: SecureStorageKeyName): Promise<string | null> {
  const value = await SecureStorage.get(key, false);
  if (value === null) return null;
  if (typeof value !== "string") {
    // Bu depoya bu katman dışından hiçbir zaman string olmayan bir değer
    // yazılmamalı. Böyle bir durumla karşılaşmak veri bozulmasının
    // habercisi olabileceğinden sessizce yutmuyoruz.
    throw new Error(
      `Güvenli depoda beklenmeyen veri tipi bulundu (anahtar: '${key}'). Beklenen: string.`
    );
  }
  return value;
}

/** Verilen anahtar altında bir string değeri güvenli şekilde yazar (varsa üzerine yazar). */
async function setSecureValue(key: SecureStorageKeyName, value: string): Promise<void> {
  await SecureStorage.set(key, value, false);
}

/** Verilen anahtarı depodan siler. Anahtar zaten yoksa bu bir hata sayılmaz. */
async function removeSecureValue(key: SecureStorageKeyName): Promise<void> {
  await SecureStorage.remove(key);
}

export const secureStorage = {
  get: getSecureValue,
  set: setSecureValue,
  remove: removeSecureValue,
};
