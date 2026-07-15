/**
 * Fotoğraf Repository Sözleşmesi
 * =================================
 * bkz. docs/repository-contract-matrix.md, Sprint 3.6 Veri Modeli
 * Doğrulaması.
 *
 * `update()` BİLEREK YOK — Repository Contract Matrix'in standart
 * setinden bilinçli bir sapma (sessiz değil, burada gerekçeli):
 * Photo'nun hiçbir kullanıcı-düzenlenebilir alanı yok. `file_path`/
 * `observationId`/`takenAt` hiçbiri oluşturulduktan sonra
 * değişmiyor — bir fotoğrafı "düzenlemek" kavramsal olarak yok,
 * sadece silinip yeniden eklenebilir.
 */

import type { NewPhotoInput, Photo } from "../domain/photo.types";

export interface IPhotoRepository {
  /** Bir gözleme bağlı tüm fotoğraflar, kronolojik (taken_at ASC — çekim sırasına göre, en yeni önce DEĞİL). */
  listByObservation(observationId: string): Promise<Photo[]>;
  getById(id: string): Promise<Photo | null>;
  create(input: NewPhotoInput): Promise<Photo>;
  deactivate(id: string): Promise<void>;
}
