/**
 * Bakım Repository — İmplementasyon
 * ======================================
 * `IMaintenanceRepository` sözleşmesini uygular.
 *
 * REVİZYON 4 (Blueprint onayı) — AUDIT LOG: `update()`, `status`
 * alanının değiştiğini tespit ederse `maintenance_status_log`'a
 * otomatik bir satır ekler — TEK transaction içinde
 * (`runInTransaction()`, ADR 0023 uyumlu `execute()` deseniyle). Bu
 * davranış UI katmanından HİÇBİR ZAMAN tetiklenmez, çağıran taraf
 * (Hook/Screen) sadece `update(id, {status: "completed"})` çağırır,
 * log kaydı kendiliğinden oluşur.
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type {
  IMaintenanceRepository,
  MaintenanceListOptions,
} from "./maintenance.repository.interface";
import type {
  MaintenanceRecord,
  MaintenanceRecordUpdateInput,
  NewMaintenanceRecordInput,
} from "../domain/maintenance.types";
import { MaintenanceStatus } from "../domain/maintenance.types";

interface MaintenanceRecordRow {
  id: string;
  parcel_id: string;
  tree_id: string | null;
  maintenance_type: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_LIST_LIMIT = 50;

function mapRowToMaintenanceRecord(row: MaintenanceRecordRow): MaintenanceRecord {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    treeId: row.tree_id,
    maintenanceType: row.maintenance_type as MaintenanceRecord["maintenanceType"],
    status: row.status as MaintenanceRecord["status"],
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UPDATABLE_COLUMN_MAP: Record<keyof MaintenanceRecordUpdateInput, string> = {
  maintenanceType: "maintenance_type",
  status: "status",
  scheduledDate: "scheduled_date",
  completedDate: "completed_date",
  notes: "notes",
};

/** `listByParcel`/`listByTree`'nin ortak WHERE/parametre inşası (Kural 8 — kod tekrarından kaçınma). */
function buildListClause(
  scopeColumn: "parcel_id" | "tree_id",
  scopeValue: string,
  options: MaintenanceListOptions
): { whereClause: string; values: unknown[] } {
  const activeOnly = options.activeOnly ?? true;
  const conditions = [`${scopeColumn} = ?`];
  const values: unknown[] = [scopeValue];

  if (activeOnly) {
    conditions.push("is_active = 1");
  }
  if (options.maintenanceType) {
    conditions.push("maintenance_type = ?");
    values.push(options.maintenanceType);
  }
  if (options.fromDate) {
    conditions.push("COALESCE(completed_date, scheduled_date) >= ?");
    values.push(options.fromDate);
  }
  if (options.toDate) {
    conditions.push("COALESCE(completed_date, scheduled_date) <= ?");
    values.push(options.toDate);
  }

  return { whereClause: conditions.join(" AND "), values };
}

class MaintenanceRepository extends BaseRepository implements IMaintenanceRepository {
  protected readonly tableName = "maintenance_records";

  async listByParcel(parcelId: string, options: MaintenanceListOptions = {}): Promise<MaintenanceRecord[]> {
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const { whereClause, values } = buildListClause("parcel_id", parcelId, options);

    const rows = await this.query<MaintenanceRecordRow>(
      `SELECT * FROM maintenance_records WHERE ${whereClause}
       ORDER BY COALESCE(completed_date, scheduled_date) DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return rows.map(mapRowToMaintenanceRecord);
  }

  async listByTree(treeId: string, options: MaintenanceListOptions = {}): Promise<MaintenanceRecord[]> {
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const { whereClause, values } = buildListClause("tree_id", treeId, options);

    const rows = await this.query<MaintenanceRecordRow>(
      `SELECT * FROM maintenance_records WHERE ${whereClause}
       ORDER BY COALESCE(completed_date, scheduled_date) DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return rows.map(mapRowToMaintenanceRecord);
  }

  async getById(id: string): Promise<MaintenanceRecord | null> {
    const row = await this.queryOne<MaintenanceRecordRow>(
      `SELECT * FROM maintenance_records WHERE id = ?`,
      [id]
    );
    return row ? mapRowToMaintenanceRecord(row) : null;
  }

  async create(input: NewMaintenanceRecordInput): Promise<MaintenanceRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: MaintenanceRecord = {
      id,
      parcelId: input.parcelId,
      treeId: input.treeId ?? null,
      maintenanceType: input.maintenanceType,
      status: input.status ?? MaintenanceStatus.Completed,
      scheduledDate: input.scheduledDate ?? null,
      completedDate: input.completedDate ?? null,
      notes: input.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO maintenance_records
         (id, parcel_id, tree_id, maintenance_type, status, scheduled_date, completed_date, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        record.id,
        record.parcelId,
        record.treeId,
        record.maintenanceType,
        record.status,
        record.scheduledDate,
        record.completedDate,
        record.notes,
        record.createdAt,
        record.updatedAt,
      ]
    );

    return record;
  }

  async update(id: string, changes: MaintenanceRecordUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof MaintenanceRecordUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    const statusIsChanging = "status" in changes;

    if (!statusIsChanging) {
      await this.applyUpdate(id, keys, changes);
      return;
    }

    // REVİZYON 4: status değişiyor — güncelleme + log kaydı TEK
    // transaction içinde, atomik (ya ikisi de olur ya hiçbiri).
    await this.runInTransaction(async () => {
      const current = await this.getById(id);
      const previousStatus = current?.status ?? null;

      await this.applyUpdate(id, keys, changes);

      const logId = crypto.randomUUID();
      await this.execute(
        `INSERT INTO maintenance_status_log
           (id, maintenance_record_id, previous_status, new_status, changed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [logId, id, previousStatus, changes.status, new Date().toISOString()]
      );
    });
  }

  /** `update()`'in ortak UPDATE ifadesi inşası — hem transaction'lı hem transaction'sız yoldan çağrılıyor. */
  private async applyUpdate(
    id: string,
    keys: (keyof MaintenanceRecordUpdateInput)[],
    changes: MaintenanceRecordUpdateInput
  ): Promise<void> {
    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => changes[key]);

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(`UPDATE maintenance_records SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE maintenance_records SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const maintenanceRepository: IMaintenanceRepository = new MaintenanceRepository();
