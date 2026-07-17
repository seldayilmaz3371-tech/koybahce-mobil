/**
 * Bakım Planı Repository — İmplementasyon
 * ============================================
 * `IMaintenancePlanRepository` sözleşmesini uygular.
 *
 * `MaintenanceRepository`'nin aksine, burada `runInTransaction()`
 * KULLANILMIYOR — planların bir durum makinesi (audit log) yok, her
 * yazma işlemi zaten tek bir SQL ifadesi (Kural 4, gereksiz karmaşıklık
 * eklenmiyor).
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type {
  IMaintenancePlanRepository,
  MaintenancePlanListOptions,
} from "./maintenancePlan.repository.interface";
import type {
  MaintenancePlan,
  MaintenancePlanUpdateInput,
  NewMaintenancePlanInput,
} from "../domain/maintenance.types";

interface MaintenancePlanRow {
  id: string;
  parcel_id: string;
  tree_id: string | null;
  maintenance_type: string;
  interval_days: number;
  next_due_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_LIST_LIMIT = 50;

function mapRowToMaintenancePlan(row: MaintenancePlanRow): MaintenancePlan {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    treeId: row.tree_id,
    maintenanceType: row.maintenance_type as MaintenancePlan["maintenanceType"],
    intervalDays: row.interval_days,
    nextDueDate: row.next_due_date,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UPDATABLE_COLUMN_MAP: Record<keyof MaintenancePlanUpdateInput, string> = {
  maintenanceType: "maintenance_type",
  intervalDays: "interval_days",
  nextDueDate: "next_due_date",
};

/**
 * `listByParcel`/`listByTree`'nin ortak WHERE/parametre inşası (Kural
 * 8 — kod tekrarından kaçınma; `MaintenanceRepository`'nin
 * `buildListClause`'uyla AYNI desen).
 *
 * `dueStatus` — "bugün" (`referenceDate`) referans alınarak SQL'de
 * karşılaştırma: `overdue` → bugünden ÖNCE, `today` → bugün İÇİNDE
 * (gün başı-sonu aralığı), `upcoming` → yarından SONRA (dahil).
 * "Yarın" hesaplaması, `referenceDate`'in KENDİSİNDEN türetiliyor —
 * repository `new Date()` (şu anki gerçek zaman) hiç ÇAĞIRMIYOR,
 * tamamen VERİLEN referans tarihe göre deterministik (Kural 30).
 */
function buildListClause(
  scopeColumn: "parcel_id" | "tree_id",
  scopeValue: string,
  options: MaintenancePlanListOptions
): { whereClause: string; values: unknown[] } {
  const activeOnly = options.activeOnly ?? true;
  const conditions = [`${scopeColumn} = ?`];
  const values: unknown[] = [scopeValue];

  if (activeOnly) {
    conditions.push("is_active = 1");
  }

  if (options.dueStatus && options.referenceDate) {
    const todayStart = `${options.referenceDate}T00:00:00.000Z`;
    const tomorrow = new Date(`${options.referenceDate}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStart = tomorrow.toISOString();

    if (options.dueStatus === "overdue") {
      conditions.push("next_due_date < ?");
      values.push(todayStart);
    } else if (options.dueStatus === "today") {
      conditions.push("next_due_date >= ? AND next_due_date < ?");
      values.push(todayStart, tomorrowStart);
    } else {
      // "upcoming" — yarından itibaren (dahil).
      conditions.push("next_due_date >= ?");
      values.push(tomorrowStart);
    }
  }

  return { whereClause: conditions.join(" AND "), values };
}

class MaintenancePlanRepository extends BaseRepository implements IMaintenancePlanRepository {
  protected readonly tableName = "maintenance_plans";

  async listByParcel(parcelId: string, options: MaintenancePlanListOptions = {}): Promise<MaintenancePlan[]> {
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const { whereClause, values } = buildListClause("parcel_id", parcelId, options);

    const rows = await this.query<MaintenancePlanRow>(
      `SELECT * FROM maintenance_plans WHERE ${whereClause}
       ORDER BY next_due_date ASC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return rows.map(mapRowToMaintenancePlan);
  }

  async listByTree(treeId: string, options: MaintenancePlanListOptions = {}): Promise<MaintenancePlan[]> {
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const { whereClause, values } = buildListClause("tree_id", treeId, options);

    const rows = await this.query<MaintenancePlanRow>(
      `SELECT * FROM maintenance_plans WHERE ${whereClause}
       ORDER BY next_due_date ASC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return rows.map(mapRowToMaintenancePlan);
  }

  async getById(id: string): Promise<MaintenancePlan | null> {
    const row = await this.queryOne<MaintenancePlanRow>(`SELECT * FROM maintenance_plans WHERE id = ?`, [id]);
    return row ? mapRowToMaintenancePlan(row) : null;
  }

  async create(input: NewMaintenancePlanInput): Promise<MaintenancePlan> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const plan: MaintenancePlan = {
      id,
      parcelId: input.parcelId,
      treeId: input.treeId ?? null,
      maintenanceType: input.maintenanceType,
      intervalDays: input.intervalDays,
      nextDueDate: input.nextDueDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO maintenance_plans
         (id, parcel_id, tree_id, maintenance_type, interval_days, next_due_date, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        plan.id,
        plan.parcelId,
        plan.treeId,
        plan.maintenanceType,
        plan.intervalDays,
        plan.nextDueDate,
        plan.createdAt,
        plan.updatedAt,
      ]
    );

    return plan;
  }

  async update(id: string, changes: MaintenancePlanUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof MaintenancePlanUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => changes[key]);

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(`UPDATE maintenance_plans SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE maintenance_plans SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const maintenancePlanRepository: IMaintenancePlanRepository = new MaintenancePlanRepository();
