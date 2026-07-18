/**
 * Hasat Repository — İmplementasyon
 * =====================================
 * `IHarvestRepository` sözleşmesini uygular. Bakım/Finans'ın
 * kanıtlanmış dual-scope desenini tekrarlar — audit-log YOK (bkz.
 * `harvest.repository.interface.ts`'in gerekçesi).
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type { IHarvestRepository, HarvestListOptions } from "./harvest.repository.interface";
import type {
  HarvestRecord,
  HarvestRecordUpdateInput,
  NewHarvestRecordInput,
} from "../domain/harvest.types";

interface HarvestRecordRow {
  id: string;
  parcel_id: string;
  tree_id: string | null;
  harvest_date: string;
  quantity_kg: number;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_LIST_LIMIT = 50;

function mapRowToHarvestRecord(row: HarvestRecordRow): HarvestRecord {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    treeId: row.tree_id,
    harvestDate: row.harvest_date,
    quantityKg: row.quantity_kg,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UPDATABLE_COLUMN_MAP: Record<keyof HarvestRecordUpdateInput, string> = {
  treeId: "tree_id",
  harvestDate: "harvest_date",
  quantityKg: "quantity_kg",
  notes: "notes",
  isActive: "is_active",
};

/** `listByParcel`/`listByTree`'nin ortak WHERE/parametre inşası (Kural 8). */
function buildListClause(
  scopeColumn: "parcel_id" | "tree_id",
  scopeValue: string,
  options: HarvestListOptions
): { whereClause: string; values: unknown[] } {
  const activeOnly = options.activeOnly ?? true;
  const conditions = [`${scopeColumn} = ?`];
  const values: unknown[] = [scopeValue];

  if (activeOnly) {
    conditions.push("is_active = 1");
  }
  if (options.fromDate) {
    conditions.push("harvest_date >= ?");
    values.push(options.fromDate);
  }
  if (options.toDate) {
    conditions.push("harvest_date <= ?");
    values.push(options.toDate);
  }

  return { whereClause: conditions.join(" AND "), values };
}

class HarvestRepository extends BaseRepository implements IHarvestRepository {
  protected readonly tableName = "harvest_records";

  private async listByScope(
    scopeColumn: "parcel_id" | "tree_id",
    scopeValue: string,
    options: HarvestListOptions = {}
  ): Promise<HarvestRecord[]> {
    const { whereClause, values } = buildListClause(scopeColumn, scopeValue, options);
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    const rows = await this.query<HarvestRecordRow>(
      `SELECT * FROM harvest_records WHERE ${whereClause} ORDER BY harvest_date DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return rows.map(mapRowToHarvestRecord);
  }

  async listByParcel(parcelId: string, options: HarvestListOptions = {}): Promise<HarvestRecord[]> {
    return this.listByScope("parcel_id", parcelId, options);
  }

  async listByTree(treeId: string, options: HarvestListOptions = {}): Promise<HarvestRecord[]> {
    return this.listByScope("tree_id", treeId, options);
  }

  async getById(id: string): Promise<HarvestRecord | null> {
    const row = await this.queryOne<HarvestRecordRow>(`SELECT * FROM harvest_records WHERE id = ?`, [id]);
    return row ? mapRowToHarvestRecord(row) : null;
  }

  async create(input: NewHarvestRecordInput): Promise<HarvestRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: HarvestRecord = {
      id,
      parcelId: input.parcelId,
      treeId: input.treeId ?? null,
      harvestDate: input.harvestDate,
      quantityKg: input.quantityKg,
      notes: input.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO harvest_records (id, parcel_id, tree_id, harvest_date, quantity_kg, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        record.id,
        record.parcelId,
        record.treeId,
        record.harvestDate,
        record.quantityKg,
        record.notes,
        record.createdAt,
        record.updatedAt,
      ]
    );

    return record;
  }

  async update(id: string, changes: HarvestRecordUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof HarvestRecordUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => {
      const value = changes[key];
      return key === "isActive" ? (value ? 1 : 0) : value;
    });

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(`UPDATE harvest_records SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE harvest_records SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const harvestRepository: IHarvestRepository = new HarvestRepository();
