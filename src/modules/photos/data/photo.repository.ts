/**
 * Fotoğraf Repository — İmplementasyon
 * =========================================
 * `IPhotoRepository` sözleşmesini uygular. Diğer repository'lerle
 * aynı desen: satır↔domain dönüşümü izole, parametreli sorgular,
 * soft-delete.
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type { IPhotoRepository } from "./photo.repository.interface";
import type { NewPhotoInput, Photo } from "../domain/photo.types";

interface PhotoRow {
  id: string;
  observation_id: string;
  file_path: string;
  taken_at: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function mapRowToPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    observationId: row.observation_id,
    filePath: row.file_path,
    takenAt: row.taken_at,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class PhotoRepository extends BaseRepository implements IPhotoRepository {
  protected readonly tableName = "photos";

  async listByObservation(observationId: string): Promise<Photo[]> {
    // ASC (eski→yeni) — DESC (Observation'daki gibi) DEĞİL: bir
    // gözleme bağlı fotoğraflar tipik olarak tek bir kısa çekim
    // oturumunun parçası, kronolojik akışta (çekim sırasıyla)
    // görüntülenmesi daha doğal ve gelecekteki AI karşılaştırması
    // (Kronolojik Analiz İlkesi) için de bu sıralama uygun.
    const rows = await this.query<PhotoRow>(
      `SELECT * FROM photos WHERE observation_id = ? AND is_active = 1 ORDER BY taken_at ASC`,
      [observationId]
    );
    return rows.map(mapRowToPhoto);
  }

  /** bkz. `IPhotoRepository.listAll()`'ın belgesi — SADECE tam yedekleme akışı için. */
  async listAll(): Promise<Photo[]> {
    const rows = await this.query<PhotoRow>(`SELECT * FROM photos WHERE is_active = 1 ORDER BY created_at ASC`);
    return rows.map(mapRowToPhoto);
  }

  async getById(id: string): Promise<Photo | null> {
    const row = await this.queryOne<PhotoRow>(`SELECT * FROM photos WHERE id = ?`, [id]);
    return row ? mapRowToPhoto(row) : null;
  }

  async create(input: NewPhotoInput): Promise<Photo> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const photo: Photo = {
      id,
      observationId: input.observationId,
      filePath: input.filePath,
      // Öncelik sırası madde 2 (backlog #13): EXIF henüz yok
      // (Sprint 3.7), bu yüzden verilmezse uygulama kayıt anı kullanılır.
      takenAt: input.takenAt ?? now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO photos
         (id, observation_id, file_path, taken_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [photo.id, photo.observationId, photo.filePath, photo.takenAt, photo.createdAt, photo.updatedAt]
    );

    return photo;
  }

  async deactivate(id: string): Promise<void> {
    await this.execute(`UPDATE photos SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }
}

export const photoRepository: IPhotoRepository = new PhotoRepository();
