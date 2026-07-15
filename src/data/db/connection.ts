/**
 * Veritabanı Bağlantı Yöneticisi
 * =================================
 *
 * NEDEN BU DOSYA VAR?
 * `@capacitor-community/sqlite` paketi, uygulamanın geri kalanında
 * hiçbir yerde doğrudan import edilmez — repository katmanı sadece
 * bu dosyadaki `getDatabase()` fonksiyonunu kullanır. Bağlantı açma,
 * şifreleme anahtarı kurulumu ve şema yükseltmesi gibi altyapısal
 * detaylar tamamen burada kapsüllenir (Kural 11: dosya/klasör düzeni,
 * aynı işi yapan kodun dağılmaması).
 *
 * BAĞLANTI YAŞAM DÖNGÜSÜ:
 *   1. `getDatabase()` ilk kez çağrıldığında bağlantı kurulur ve
 *      bir Promise önbelleğe alınır (aynı anda birden fazla çağrı
 *      birden fazla bağlantı açmaya çalışmaz — "tekil başlatma" deseni).
 *   2. Sonraki her çağrı, aynı açık bağlantıyı döndürür.
 *   3. Uygulama arka plana alınıp kapatıldığında (Android tarafından
 *      süreç öldürüldüğünde) bağlantı otomatik olarak kaybolur; bir
 *      sonraki açılışta adım 1 tekrar çalışır.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { getOrCreateDatabaseEncryptionKey } from "./encryptionKey";
import {
  CURRENT_SCHEMA_VERSION,
  DATABASE_NAME,
  SCHEMA_MIGRATIONS,
} from "./migrations/schema";

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

/**
 * Kurulmuş bağlantıyı önbelleğe alan modül seviyesi durum. `null` iken
 * henüz bağlantı kurulmamış demektir; bir Promise iken kurulum devam
 * ediyor veya tamamlanmış demektir.
 */
let connectionPromise: Promise<SQLiteDBConnection> | null = null;

/**
 * Şifreleme parolasını hem güvenli depomuza hem de eklentinin kendi
 * native "secret store"una tanıtır. Eklentinin belgelemesi
 * `setEncryptionSecret()`'in "yalnızca bir kez" çağrılması gerektiğini
 * belirtiyor; bu yüzden önce `isSecretStored()` ile kontrol ediyoruz.
 */
async function ensureEncryptionSecretIsRegistered(passphrase: string): Promise<void> {
  const { result: alreadyStored } = await sqliteConnection.isSecretStored();
  if (!alreadyStored) {
    await sqliteConnection.setEncryptionSecret(passphrase);
  }
}

/**
 * Yeni bir veritabanı bağlantısı kurar: şifreleme anahtarını hazırlar,
 * şema yükseltmelerini kaydeder ve şifreli bağlantıyı açar. Bu fonksiyon
 * sadece `getDatabase()` tarafından, bağlantı önbellekte yokken bir kez
 * çağrılır.
 */
async function establishConnection(): Promise<SQLiteDBConnection> {
  const passphrase = await getOrCreateDatabaseEncryptionKey();
  await ensureEncryptionSecretIsRegistered(passphrase);

  const connectionAlreadyOpen = await sqliteConnection.isConnection(
    DATABASE_NAME,
    false
  );

  if (connectionAlreadyOpen.result) {
    return sqliteConnection.retrieveConnection(DATABASE_NAME, false);
  }

  await sqliteConnection.addUpgradeStatement(DATABASE_NAME, SCHEMA_MIGRATIONS);

  const db = await sqliteConnection.createConnection(
    DATABASE_NAME,
    /* encrypted */ true,
    /* mode */ "secret",
    CURRENT_SCHEMA_VERSION,
    /* readonly */ false
  );

  await db.open();

  // ADR 0022: SQLite foreign key kısıtları her bağlantıda VARSAYILAN
  // OLARAK KAPALI (sqlite.org resmi dokümantasyonunda kesin
  // doğrulandı). Eklentinin bunu otomatik açtığına dair kesin bir
  // kanıt bulunamadı (araştırma 3 kez tekrarlandı) — bu yüzden kendimiz
  // açıkça etkinleştiriyoruz. Bu çağrı risksiz: plugin zaten açıksa
  // no-op, kapalıysa gerçek bir düzeltme.
  await db.execute("PRAGMA foreign_keys = ON;");

  return db;
}

/**
 * Açık, şifreli, güncel şemaya sahip veritabanı bağlantısını döndürür.
 * Uygulama genelinde veritabanına erişmenin TEK yolu budur.
 */
export async function getDatabase(): Promise<SQLiteDBConnection> {
  if (!connectionPromise) {
    connectionPromise = establishConnection().catch((error) => {
      // Kurulum başarısız olursa önbelleği temizliyoruz ki bir sonraki
      // çağrı yeniden denesin — aksi halde başarısız bir Promise
      // sonsuza dek önbellekte kalır ve uygulama asla iyileşemez.
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
}

/**
 * Yalnızca test/geliştirme amaçlı: önbelleği temizler ki bir sonraki
 * `getDatabase()` çağrısı sıfırdan bağlantı kursun. Üretim kodunda
 * kullanılmaz.
 */
export function resetConnectionCacheForTesting(): void {
  connectionPromise = null;
}

/** Uygulamanın hangi platformda çalıştığını raporlar — tanılama/loglama amaçlı. */
export function getRuntimePlatform(): string {
  return Capacitor.getPlatform();
}
