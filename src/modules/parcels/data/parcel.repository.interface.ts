/**
 * Parsel Repository Sözleşmesi
 * ===============================
 * bkz. docs/adr/0016-modul2-veri-modeli.md
 *
 * Bu dosya sadece SÖZLEŞMEYİ tanımlar, implementasyonu içermez —
 * `parcel.repository.ts` bu arayüzü uygular. Ayrı tutulmasının
 * gerekçesi: gelecekte repository testleri (ADR 0018) yazılırken,
 * gerçek implementasyonun DAVRANIŞININ bu sözleşmeye uyduğunu
 * doğrulamak; ayrıca UI katmanının (hook'lar) somut sınıfa değil
 * sözleşmeye bağımlı olabilmesi.
 */

import type { NewParcelInput, Parcel, ParcelUpdateInput } from "../domain/parcel.types";

export interface ParcelListOptions {
  /** Varsayılan true — pasife alınmış (soft-delete) parseller listelenmez. */
  activeOnly?: boolean;
  /**
   * Sayfa başına kayıt sayısı. Varsayılan ve performans eşiği için
   * bkz. Modül 2 Performans Değerlendirmesi (sohbet kaydı, Bölüm 11):
   * 50 kayıttan sonra sayfalama devreye girer.
   */
  limit?: number;
  offset?: number;
}

export interface IParcelRepository {
  list(options?: ParcelListOptions): Promise<Parcel[]>;
  getById(id: string): Promise<Parcel | null>;
  create(input: NewParcelInput): Promise<Parcel>;
  update(id: string, changes: ParcelUpdateInput): Promise<void>;
  deactivate(id: string): Promise<void>;
}
