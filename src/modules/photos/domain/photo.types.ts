/**
 * Fotoğraf Domain Tipleri
 * ==========================
 * bkz. Sprint 3.6 Veri Modeli Doğrulaması (onaylandı 2026-07-15).
 *
 * KİMLİK NOTU (backlog madde 11): `id` her zaman kalıcı kimliktir —
 * `filePath` sadece dosyanın o anki fiziksel konumu, asla bir
 * ilişki/referans anahtarı olarak kullanılmaz.
 *
 * GÜNCELLENEMEZ (bilinçli, Repository Contract Matrix'ten sapma):
 * Photo'nun hiçbir kullanıcı-düzenlenebilir alanı yok — bu yüzden
 * `PhotoUpdateInput` tipi YOK, sadece `NewPhotoInput` var.
 */

export interface Photo {
  id: string;
  observationId: string;
  filePath: string;
  /** Fotoğrafın çekildiği an. Öncelik sırası: EXIF (Sprint 3.7) > uygulama kayıt anı > created_at (bkz. backlog madde 13). */
  takenAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewPhotoInput {
  observationId: string;
  filePath: string;
  /** Verilmezse, oluşturma anında otomatik atanır (bkz. backlog madde 13, öncelik sırası madde 2). */
  takenAt?: string;
}
