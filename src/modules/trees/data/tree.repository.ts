/**
 * Ağaç Repository — İmplementasyon
 * =====================================
 * `ITreeRepository` sözleşmesini uygular (bkz.
 * tree.repository.interface.ts). Tasarım, `ParcelRepository` ile
 * bilerek tutarlı tutuldu (aynı desen: satır↔domain dönüşümü izole,
 * parametreli sorgular, soft-delete) — Kural 12.
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type { ITreeRepository } from "./tree.repository.interface";
import type {
  BulkCreateTreesInput,
  NewTreeInput,
  Tree,
  TreeUpdateInput,
} from "../domain/tree.types";
import { TreeNumberConflictError } from "../domain/tree.types";

interface TreeRow {
  id: string;
  parcel_id: string;
  tree_number: string;
  variety: string;
  planting_year: number | null;
  latitude: number | null;
  longitude: number | null;
  is_reference_tree: number;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function mapRowToTree(row: TreeRow): Tree {
  return {
    id: row.id,
    parcelId: row.parcel_id,
    treeNumber: row.tree_number,
    variety: row.variety,
    plantingYear: row.planting_year,
    latitude: row.latitude,
    longitude: row.longitude,
    isReferenceTree: row.is_reference_tree === 1,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** `update()` için: domain alan adından SQL sütun adına eşleme (`parcelId` kasıtlı olarak yok — bir ağacın parseli değiştirilemez, bkz. TreeUpdateInput tanımı). */
const UPDATABLE_COLUMN_MAP: Record<keyof TreeUpdateInput, string> = {
  treeNumber: "tree_number",
  variety: "variety",
  plantingYear: "planting_year",
  latitude: "latitude",
  longitude: "longitude",
  isReferenceTree: "is_reference_tree",
  notes: "notes",
};

/** `isReferenceTree` gibi boolean alanları SQLite'ın 0/1 INTEGER'ına çevirir, diğerlerini olduğu gibi bırakır. */
function toSqlValue(key: keyof TreeUpdateInput, value: unknown): unknown {
  if (key === "isReferenceTree") {
    return value ? 1 : 0;
  }
  return value;
}

class TreeRepository extends BaseRepository implements ITreeRepository {
  protected readonly tableName = "trees";

  async listByParcel(parcelId: string): Promise<Tree[]> {
    const rows = await this.query<TreeRow>(
      `SELECT * FROM trees WHERE parcel_id = ? AND is_active = 1 ORDER BY tree_number COLLATE NOCASE`,
      [parcelId]
    );
    return rows.map(mapRowToTree);
  }

  async listReferenceTrees(): Promise<Tree[]> {
    const rows = await this.query<TreeRow>(
      `SELECT * FROM trees WHERE is_reference_tree = 1 AND is_active = 1 ORDER BY tree_number COLLATE NOCASE`
    );
    return rows.map(mapRowToTree);
  }

  async getById(id: string): Promise<Tree | null> {
    const row = await this.queryOne<TreeRow>(`SELECT * FROM trees WHERE id = ?`, [id]);
    return row ? mapRowToTree(row) : null;
  }

  async create(input: NewTreeInput): Promise<Tree> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const tree: Tree = {
      id,
      parcelId: input.parcelId,
      treeNumber: input.treeNumber,
      variety: input.variety,
      plantingYear: input.plantingYear ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      isReferenceTree: input.isReferenceTree ?? false,
      notes: input.notes ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO trees
         (id, parcel_id, tree_number, variety, planting_year, latitude, longitude, is_reference_tree, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        tree.id,
        tree.parcelId,
        tree.treeNumber,
        tree.variety,
        tree.plantingYear,
        tree.latitude,
        tree.longitude,
        tree.isReferenceTree ? 1 : 0,
        tree.notes,
        tree.createdAt,
        tree.updatedAt,
      ]
    );

    return tree;
  }

  /**
   * Toplu ağaç oluşturma (Sprint 3.10). İki aşama:
   *   1. ÖN KONTROL — önerilen aralıktaki numaralardan halihazırda
   *      aktif olanları tespit eder. Çakışma varsa hiçbir INSERT
   *      denenmeden `TreeNumberConflictError` fırlatılır (ham SQLite
   *      hatasına güvenilmiyor — Sprint 3.10 onayı madde 2).
   *   2. `runInTransaction()` — TÜM ağaçlar tek işlemde oluşturulur;
   *      herhangi bir adım başarısız olursa hiçbiri kalıcı olmaz
   *      (Sprint 3.10 Veri Bütünlüğü gereksinimi).
   *
   * Üretilen her `Tree`, `create()` ile oluşturulanla TAMAMEN AYNI
   * veri modeline sahiptir — özel bir "toplu oluşturuldu" işareti YOK
   * (Dijital Bahçe Hafızası ilkesi, Sprint 3.10 onayı).
   */
  async createMany(input: BulkCreateTreesInput): Promise<Tree[]> {
    const candidateNumbers = Array.from({ length: input.count }, (_, i) =>
      String(input.startNumber + i)
    );

    // Aday numaraları tek bir sorguyla (parametreli IN yerine JS'te
    // filtreleme — SQLite'ın değişken sayısı sınırından bilerek
    // kaçınmak için, bir parselin aktif ağaç sayısı zaten sınırlı).
    const existingRows = await this.query<{ tree_number: string }>(
      `SELECT tree_number FROM trees WHERE parcel_id = ? AND is_active = 1`,
      [input.parcelId]
    );
    const existingNumbers = new Set(existingRows.map((r) => r.tree_number));
    const conflicts = candidateNumbers.filter((n) => existingNumbers.has(n));
    if (conflicts.length > 0) {
      throw new TreeNumberConflictError(conflicts);
    }

    return this.runInTransaction(async () => {
      const created: Tree[] = [];
      for (const treeNumber of candidateNumbers) {
        created.push(
          await this.create({
            parcelId: input.parcelId,
            treeNumber,
            variety: input.variety ?? "",
            isReferenceTree: input.isReferenceTree ?? false,
          })
        );
      }
      return created;
    });
  }

  async update(id: string, changes: TreeUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof TreeUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => toSqlValue(key, changes[key]));

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.execute(`UPDATE trees SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE trees SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }

  async countByParcel(parcelId: string): Promise<number> {
    const row = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM trees WHERE parcel_id = ? AND is_active = 1`,
      [parcelId]
    );
    return row?.count ?? 0;
  }
}

export const treeRepository: ITreeRepository = new TreeRepository();
