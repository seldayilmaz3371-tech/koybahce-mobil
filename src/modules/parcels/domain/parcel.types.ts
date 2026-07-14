/**
 * Parsel Domain Tipleri
 * =======================
 * bkz. docs/adr/0016-modul2-veri-modeli.md (şema kararı),
 * docs/adr/0017-enum-veri-saklama-kurali.md (CropType'ın neden
 * İngilizce kod olduğu — çeviri her zaman i18next'ten gelir, veri
 * değeri olarak asla görüntü metni saklanmaz).
 */

/**
 * Sabit mahsul türü kümesi. Veritabanında bu İngilizce kodlar saklanır;
 * ekranda gösterilecek metin `parcel.cropType.<kod>` çeviri anahtarından
 * gelir (ör. `parcel.cropType.olive` → "Zeytin" / "Olive").
 */
export type CropType = "olive" | "vegetable" | "fruit";

export interface Parcel {
  id: string;
  name: string;
  cropType: CropType;
  latitude: number | null;
  longitude: number | null;
  areaDekar: number;
  /** Serbest metin — kullanıcının kendi dilinde yazdığı ham veri, çeviri gerektirmez. */
  soilType: string | null;
  /** Serbest metin — kullanıcının kendi dilinde yazdığı ham veri, çeviri gerektirmez. */
  irrigationType: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Yeni bir parsel oluştururken gereken alanlar — sistem tarafından üretilenler (id, tarihler) hariç. */
export interface NewParcelInput {
  name: string;
  cropType: CropType;
  latitude?: number | null;
  longitude?: number | null;
  areaDekar: number;
  soilType?: string | null;
  irrigationType?: string | null;
  notes?: string | null;
}

export type ParcelUpdateInput = Partial<NewParcelInput>;
