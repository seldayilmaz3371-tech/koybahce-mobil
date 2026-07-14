/**
 * Parsel Repository — İmplementasyon
 * =======================================
 * `IParcelRepository` sözleşmesini uygular (bkz.
 * parcel.repository.interface.ts). `BaseRepository`'den türer —
 * SQL çalıştırma, satır tipi dönüştürme gibi altyapı orada.
 *
 * SATIR ↔ DOMAIN DÖNÜŞÜMÜ: SQLite'ta sütun adları snake_case
 * (`crop_type`), domain tipinde camelCase (`cropType`) — bu dosyanın
 * tek sorumluluklarından biri bu dönüşümü izole etmek (Kural 12'nin
 * bir uzantısı: dönüşüm mantığı dağılmasın, tek yerde dursun).
 * SQLite'ta boolean yok — `is_active`/`is_reference_tree` 0/1 INTEGER
 * olarak saklanır, dönüşüm burada yapılır.
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type {
  IParcelRepository,
  ParcelListOptions,
} from "./parcel.repository.interface";
import type { NewParcelInput, Parcel, ParcelUpdateInput } from "../domain/parcel.types";

/** Ham SQLite satırının şekli — dönüşümden önceki hali. */
interface ParcelRow {
  id: string;
  name: string;
  crop_type: string;
  latitude: number | null;
  longitude: number | null;
  area_dekar: number;
  soil_type: string | null;
  irrigation_type: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/**
 * Modül 2 Performans Değerlendirmesinde (sohbet kaydı, Bölüm 11)
 * belirlenen eşik: 50 kayıttan sonra sayfalama devreye girer. Bu,
 * `list()` çağrılırken açıkça bir `limit` verilmezse kullanılan
 * varsayılan üst sınırdır.
 */
const DEFAULT_LIST_LIMIT = 50;

function mapRowToParcel(row: ParcelRow): Parcel {
  return {
    id: row.id,
    name: row.name,
    cropType: row.crop_type as Parcel["cropType"],
    latitude: row.latitude,
    longitude: row.longitude,
    areaDekar: row.area_dekar,
    soilType: row.soil_type,
    irrigationType: row.irrigation_type,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** `update()` için: domain alan adından SQL sütun adına eşleme. */
const UPDATABLE_COLUMN_MAP: Record<keyof ParcelUpdateInput, string> = {
  name: "name",
  cropType: "crop_type",
  latitude: "latitude",
  longitude: "longitude",
  areaDekar: "area_dekar",
  soilType: "soil_type",
  irrigationType: "irrigation_type",
  notes: "notes",
};

class ParcelRepository extends BaseRepository implements IParcelRepository {
  protected readonly tableName = "parcels";

  async list(options: ParcelListOptions = {}): Promise<Parcel[]> {
    const activeOnly = options.activeOnly ?? true;
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    const whereClause = activeOnly ? "WHERE is_active = 1" : "";
    const rows = await this.query<ParcelRow>(
      `SELECT * FROM parcels ${whereClause} ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows.map(mapRowToParcel);
  }

  async getById(id: string): Promise<Parcel | null> {
    const row = await this.queryOne<ParcelRow>(`SELECT * FROM parcels WHERE id = ?`, [id]);
    return row ? mapRowToParcel(row) : null;
  }

  async create(input: NewParcelInput): Promise<Parcel> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const parcel: Parcel = {
      id,
      name: input.name,
      cropType: input.cropType,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      areaDekar: input.areaDekar,
      soilType: input.soilType ?? null,
      irrigationType: input.irrigationType ?? null,
      notes: input.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO parcels
         (id, name, crop_type, latitude, longitude, area_dekar, soil_type, irrigation_type, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        parcel.id,
        parcel.name,
        parcel.cropType,
        parcel.latitude,
        parcel.longitude,
        parcel.areaDekar,
        parcel.soilType,
        parcel.irrigationType,
        parcel.notes,
        parcel.createdAt,
        parcel.updatedAt,
      ]
    );

    return parcel;
  }

  async update(id: string, changes: ParcelUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof ParcelUpdateInput)[];
    if (keys.length === 0) {
      // Değişecek bir şey yok — gereksiz bir SQL çağrısı yapmıyoruz.
      return;
    }

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => changes[key]);

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(
      `UPDATE parcels SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE parcels SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const parcelRepository: IParcelRepository = new ParcelRepository();
