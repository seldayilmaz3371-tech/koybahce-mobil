/**
 * Finans Repository — İmplementasyon
 * =======================================
 * `IFinanceRepository` sözleşmesini uygular. Diğer repository'lerle
 * aynı desen: satır↔domain dönüşümü izole, parametreli sorgular,
 * soft-delete, Parsel'in sayfalama deseni (Observation'da onaylanan
 * gerekçeyle aynı — yıllar boyunca birikim).
 *
 * MİMARİ NOT — listByParcel Observation'dan BİLİNÇLİ FARKLI:
 * Observation.listByParcel() SADECE tree_id IS NULL kayıtları
 * döndürür (ağaç gözlemlerini tekrarlamamak için). Finans'ta ise
 * `listByParcel()` TÜM kayıtları (ağaç-özel olanlar DAHİL) döndürür
 * — çünkü bir parselin finansal özeti, doğası gereği o parseldeki
 * TÜM maliyet/gelirin toplamını göstermeli (ağaca özel bir ilaçlama
 * maliyeti de parselin toplam maliyetinin bir parçasıdır).
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type {
  IFinanceRepository,
  FinanceRecordListOptions,
} from "./finance.repository.interface";
import type {
  FinanceRecord,
  NewFinanceRecordInput,
  FinanceRecordUpdateInput,
} from "../domain/finance.types";

interface FinanceRecordRow {
  id: string;
  parcel_id: string;
  tree_id: string | null;
  record_type: string;
  amount_minor: number;
  currency_code: string;
  record_date: string;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_LIST_LIMIT = 50;
const DEFAULT_CURRENCY_CODE = "TRY";

function mapRowToFinanceRecord(row: FinanceRecordRow): FinanceRecord {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    treeId: row.tree_id,
    recordType: row.record_type as FinanceRecord["recordType"],
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    recordDate: row.record_date,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UPDATABLE_COLUMN_MAP: Record<keyof FinanceRecordUpdateInput, string> = {
  recordType: "record_type",
  amountMinor: "amount_minor",
  recordDate: "record_date",
  notes: "notes",
};

class FinanceRepository extends BaseRepository implements IFinanceRepository {
  protected readonly tableName = "finance_records";

  async listByParcel(parcelId: string, options: FinanceRecordListOptions = {}): Promise<FinanceRecord[]> {
    const activeOnly = options.activeOnly ?? true;
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const whereActive = activeOnly ? "AND is_active = 1" : "";

    const rows = await this.query<FinanceRecordRow>(
      `SELECT * FROM finance_records WHERE parcel_id = ? ${whereActive} ORDER BY record_date DESC LIMIT ? OFFSET ?`,
      [parcelId, limit, offset]
    );
    return rows.map(mapRowToFinanceRecord);
  }

  async listByTree(treeId: string, options: FinanceRecordListOptions = {}): Promise<FinanceRecord[]> {
    const activeOnly = options.activeOnly ?? true;
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const whereActive = activeOnly ? "AND is_active = 1" : "";

    const rows = await this.query<FinanceRecordRow>(
      `SELECT * FROM finance_records WHERE tree_id = ? ${whereActive} ORDER BY record_date DESC LIMIT ? OFFSET ?`,
      [treeId, limit, offset]
    );
    return rows.map(mapRowToFinanceRecord);
  }

  async getById(id: string): Promise<FinanceRecord | null> {
    const row = await this.queryOne<FinanceRecordRow>(`SELECT * FROM finance_records WHERE id = ?`, [id]);
    return row ? mapRowToFinanceRecord(row) : null;
  }

  async create(input: NewFinanceRecordInput): Promise<FinanceRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: FinanceRecord = {
      id,
      parcelId: input.parcelId,
      treeId: input.treeId ?? null,
      recordType: input.recordType,
      amountMinor: input.amountMinor,
      // Formda hiç gösterilmiyor — sessizce sabit atanıyor (Modül 4
      // Mimari Onayı madde 4). Çoklu para birimi ihtiyacı doğarsa
      // backlog'dan ele alınacak.
      currencyCode: DEFAULT_CURRENCY_CODE,
      recordDate: input.recordDate,
      notes: input.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO finance_records
         (id, parcel_id, tree_id, record_type, amount_minor, currency_code, record_date, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        record.id,
        record.parcelId,
        record.treeId,
        record.recordType,
        record.amountMinor,
        record.currencyCode,
        record.recordDate,
        record.notes,
        record.createdAt,
        record.updatedAt,
      ]
    );

    return record;
  }

  async update(id: string, changes: FinanceRecordUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof FinanceRecordUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => changes[key]);

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(`UPDATE finance_records SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE finance_records SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const financeRepository: IFinanceRepository = new FinanceRepository();
