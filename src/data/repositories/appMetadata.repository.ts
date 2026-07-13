/**
 * Uygulama Meta Verisi Repository'si
 * =====================================
 * `app_metadata` tablosu üzerinde çalışır (bkz. migrations/schema.ts v1).
 * Şu an tek kullanım amacı: Modül 1'in gerçekten çalıştığını uçtan uca
 * doğrulamak (veritabanına yazıp okuyabiliyor muyuz?) ve ilk kurulum
 * zamanını kalıcı olarak kaydetmek. İleriki modüller kendi meta
 * verilerini de bu tablo üzerinden okuyup yazabilir.
 */

import { BaseRepository } from "./base.repository";

interface AppMetadataRow {
  key: string;
  value: string;
  updated_at: string;
}

const FIRST_LAUNCH_KEY = "first_launch_at";

class AppMetadataRepository extends BaseRepository {
  protected readonly tableName = "app_metadata";

  async get(key: string): Promise<string | null> {
    const row = await this.queryOne<AppMetadataRow>(
      `SELECT key, value, updated_at FROM app_metadata WHERE key = ?`,
      [key]
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.execute(
      `INSERT INTO app_metadata (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, new Date().toISOString()]
    );
  }

  /**
   * İlk kurulum zaten kaydedilmemişse şimdiki zamanı kaydeder ve
   * kaydedilen değeri döndürür; zaten kaydedilmişse mevcut değeri
   * değiştirmeden döndürür. Modül 1'in kalıcılığını (uygulama yeniden
   * başlatıldığında verinin kaybolmadığını) doğrulamak için kullanılır.
   */
  async recordFirstLaunchIfNeeded(): Promise<string> {
    const existing = await this.get(FIRST_LAUNCH_KEY);
    if (existing !== null) {
      return existing;
    }
    const now = new Date().toISOString();
    await this.set(FIRST_LAUNCH_KEY, now);
    return now;
  }
}

export const appMetadataRepository = new AppMetadataRepository();
