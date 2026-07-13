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

export abstract class BaseRepository {
  /**
   * Alt sınıfların yönettiği tablonun adı. Hata mesajlarında ve
   * tanılamada kullanılır.
   */
  protected abstract readonly tableName: string;

  /**
   * Parametreli bir SELECT sorgusu çalıştırır ve satırları verilen tipte
   * döndürür. Değerler her zaman `values` dizisiyle (`?` yer
   * tutucularıyla) geçilmelidir — asla string birleştirme ile SQL
   * oluşturulmamalıdır (SQL enjeksiyonuna karşı temel savunma).
   */
  protected async query<TRow>(sql: string, values: unknown[] = []): Promise<TRow[]> {
    const db = await getDatabase();
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
   */
  protected async execute(
    sql: string,
    values: unknown[] = []
  ): Promise<{ changes: number; lastId?: number }> {
    const db = await getDatabase();
    const result = await db.run(sql, values);
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
   */
  protected async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const db = await getDatabase();
    await db.beginTransaction();
    try {
      const result = await work();
      await db.commitTransaction();
      return result;
    } catch (error) {
      await db.rollbackTransaction();
      throw error;
    }
  }
}
