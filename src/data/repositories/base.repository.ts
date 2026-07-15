/**
 * Temel Repository Sınıfı
 * ==========================
 *
 * NEDEN BU SINIF VAR?
 * Her iş modülü (Parseller, Ağaçlar, Gözlemler, ...) kendi repository
 * sınıfını bu sınıftan türetecek. Böylece:
 *
 *   - SQL çalıştırma, satır dönüştürme gibi tekrar eden kod tek bir
 *     yerde durur (Kural 12: kod tekrarından kaçınma).
 *   - Yeni bir modül eklemek, sadece bu sınıfı genişletip kendi
 *     tablosuna özgü metodları yazmak kadar basit hale gelir
 *     (Kural 13: genişletilebilir mimari).
 *
 * Bu dosya, web projesindeki `server/repositories/base.repository.ts`
 * dosyasının kavramsal karşılığıdır — ancak orada JSON dosyasında bellek
 * içi dizi filtreleme yapılırken, burada gerçek SQL çalıştırılıyor.
 * Bu, Android'e özgü bir yeniden tasarımdır, doğrudan kod taşıması değildir.
 */

import { getDatabase } from "../db/connection";
import type { DatabaseExecutor } from "../db/databaseExecutor";

type ExecutorProvider = () => Promise<DatabaseExecutor>;

/**
 * Repository katmanının veritabanına ERİŞTİĞİ TEK NOKTA. Üretimde
 * varsayılan olarak `getDatabase` (gerçek, şifreli Capacitor SQLite
 * bağlantısı) kullanılır — bu, uygulama çalışırken hiçbir zaman
 * değişmez. Sadece testler `setDatabaseExecutorProviderForTesting()`
 * ile bunu `better-sqlite3` tabanlı bir yürütücüyle değiştirir.
 */
let executorProvider: ExecutorProvider = getDatabase;

/** SADECE TESTLER İÇİN: repository katmanının hangi veritabanı yürütücüsünü kullanacağını değiştirir. */
export function setDatabaseExecutorProviderForTesting(provider: ExecutorProvider): void {
  executorProvider = provider;
}

/** SADECE TESTLER İÇİN: üretim sağlayıcısına (gerçek Capacitor bağlantısı) geri döner. */
export function resetDatabaseExecutorProviderForTesting(): void {
  executorProvider = getDatabase;
}

export abstract class BaseRepository {
  /**
   * Alt sınıfların yönettiği tablonun adı. Hata mesajlarında ve
   * tanılamada kullanılır.
   */
  protected abstract readonly tableName: string;

  /**
   * Bu repository instance'ının şu an açık, dıştan yönetilen bir
   * transaction içinde olup olmadığını izler (Sprint 3.10.1 kök neden
   * düzeltmesi). `execute()`, bu bayrağa göre native `run()`'a doğru
   * `transaction` parametresini geçirir — aksi halde her `execute()`
   * çağrısı kendi native transaction'ını açmaya çalışıp "Already in
   * transaction" hatasına yol açardı (gerçek Android cihazda bulundu).
   */
  private inTransaction = false;

  /**
   * Parametreli bir SELECT sorgusu çalıştırır ve satırları verilen tipte
   * döndürür. Değerler her zaman `values` dizisiyle (`?` yer
   * tutucularıyla) geçilmelidir — asla string birleştirme ile SQL
   * oluşturulmamalıdır (SQL enjeksiyonuna karşı temel savunma).
   */
  protected async query<TRow>(sql: string, values: unknown[] = []): Promise<TRow[]> {
    const db = await executorProvider();
    const result = await db.query(sql, values);
    return (result.values ?? []) as TRow[];
  }

  /**
   * Tek bir satır bekleyen sorgular için kısayol. Sonuç boşsa `null`
   * döner; birden fazla satır dönerse ilkini alır (çağıran kod, sorgunun
   * tek satır garanti ettiğinden emin olmalıdır — ör. `WHERE id = ?`).
   */
  protected async queryOne<TRow>(sql: string, values: unknown[] = []): Promise<TRow | null> {
    const rows = await this.query<TRow>(sql, values);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * INSERT/UPDATE/DELETE gibi veri değiştiren ifadeleri çalıştırır.
   * Etkilenen satır sayısını ve (varsa) yeni oluşturulan satırın id'sini
   * döndürür.
   *
   * `transaction` parametresi native `run()`'a AÇIKÇA geçiriliyor
   * (Sprint 3.10.1 kök neden düzeltmesi): `runInTransaction()` içinde
   * çağrılıyorsak (`this.inTransaction === true`) `false` — native
   * kendi transaction'ını AÇMAZ, dıştaki transaction'a katılır. Tek
   * başına çağrılıyorsak `true` — native kendi transaction'ını açıp
   * kapatır (önceki, tek-INSERT davranışıyla birebir aynı).
   */
  protected async execute(
    sql: string,
    values: unknown[] = []
  ): Promise<{ changes: number; lastId?: number }> {
    const db = await executorProvider();
    const result = await db.run(sql, values, !this.inTransaction);
    return {
      changes: result.changes?.changes ?? 0,
      lastId: result.changes?.lastId,
    };
  }

  /**
   * Birden fazla yazma işlemini tek bir işlem (transaction) içinde
   * çalıştırır: ya hepsi başarılı olur ya da hiçbiri kalıcı olmaz. Veri
   * bütünlüğü gerektiren çok adımlı işlemler (ör. bir hasat kaydı
   * eklerken aynı anda stok düşmek) için kullanılır.
   *
   * `this.inTransaction` bayrağı, `work()` çalışırken `true` tutulur —
   * bu sayede `work()` içindeki her `execute()` çağrısı native'e kendi
   * transaction'ını AÇMAMASI gerektiğini doğru şekilde bildirir
   * (Sprint 3.10.1). Bayrak, başarı/hata fark etmeksizin `finally`
   * içinde sıfırlanır — bir hata durumunda bile repository'nin
   * "kilitli" kalmaması için.
   */
  protected async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const db = await executorProvider();
    await db.beginTransaction();
    this.inTransaction = true;
    try {
      const result = await work();
      await db.commitTransaction();
      return result;
    } catch (error) {
      await db.rollbackTransaction();
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }
}
