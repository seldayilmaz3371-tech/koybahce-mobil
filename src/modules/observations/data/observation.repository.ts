/**
 * Gözlem Repository — İmplementasyon
 * =======================================
 * `IObservationRepository` sözleşmesini uygular. Parsel/Ağaç
 * repository'leriyle aynı desen: satır↔domain dönüşümü izole,
 * parametreli sorgular, soft-delete.
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type {
  IObservationRepository,
  ObservationListOptions,
} from "./observation.repository.interface";
import type {
  NewObservationInput,
  Observation,
  ObservationUpdateInput,
} from "../domain/observation.types";

interface ObservationRow {
  id: string;
  parcel_id: string;
  tree_id: string | null;
  observation_type: string;
  note: string | null;
  observed_at: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/** Domain Review'da onaylanan sayfalama deseni — Parsel'inkiyle aynı (Ağaç'ınki değil). */
const DEFAULT_LIST_LIMIT = 50;

function mapRowToObservation(row: ObservationRow): Observation {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    treeId: row.tree_id,
    observationType: row.observation_type as Observation["observationType"],
    note: row.note,
    observedAt: row.observed_at,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UPDATABLE_COLUMN_MAP: Record<keyof ObservationUpdateInput, string> = {
  observationType: "observation_type",
  note: "note",
  observedAt: "observed_at",
};

class ObservationRepository extends BaseRepository implements IObservationRepository {
  protected readonly tableName = "observations";

  async listByTree(treeId: string, options: ObservationListOptions = {}): Promise<Observation[]> {
    const activeOnly = options.activeOnly ?? true;
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const whereActive = activeOnly ? "AND is_active = 1" : "";

    const rows = await this.query<ObservationRow>(
      `SELECT * FROM observations WHERE tree_id = ? ${whereActive} ORDER BY observed_at DESC LIMIT ? OFFSET ?`,
      [treeId, limit, offset]
    );
    return rows.map(mapRowToObservation);
  }

  async listByParcel(parcelId: string, options: ObservationListOptions = {}): Promise<Observation[]> {
    const activeOnly = options.activeOnly ?? true;
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const whereActive = activeOnly ? "AND is_active = 1" : "";

    // Sadece parsel geneli (tree_id IS NULL) — bir ağacın gözlemleri
    // burada TEKRARLANMAZ (bkz. interface'teki mimari not).
    const rows = await this.query<ObservationRow>(
      `SELECT * FROM observations WHERE parcel_id = ? AND tree_id IS NULL ${whereActive} ORDER BY observed_at DESC LIMIT ? OFFSET ?`,
      [parcelId, limit, offset]
    );
    return rows.map(mapRowToObservation);
  }

  async getById(id: string): Promise<Observation | null> {
    const row = await this.queryOne<ObservationRow>(`SELECT * FROM observations WHERE id = ?`, [id]);
    return row ? mapRowToObservation(row) : null;
  }

  async create(input: NewObservationInput): Promise<Observation> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const observation: Observation = {
      id,
      parcelId: input.parcelId,
      treeId: input.treeId ?? null,
      observationType: input.observationType,
      note: input.note ?? null,
      observedAt: input.observedAt,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO observations
         (id, parcel_id, tree_id, observation_type, note, observed_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        observation.id,
        observation.parcelId,
        observation.treeId,
        observation.observationType,
        observation.note,
        observation.observedAt,
        observation.createdAt,
        observation.updatedAt,
      ]
    );

    return observation;
  }

  async update(id: string, changes: ObservationUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof ObservationUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => changes[key]);

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(
      `UPDATE observations SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE observations SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const observationRepository: IObservationRepository = new ObservationRepository();
