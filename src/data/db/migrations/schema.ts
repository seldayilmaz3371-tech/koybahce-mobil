/**
 * Veritabanı Şema Sürümleri (Migrations)
 * =========================================
 *
 * MİMARİ KARAR (bkz. docs/adr/0005-migration-stratejisi.md):
 * Kendi JavaScript tarafında çalışan bir "migration runner" YAZMIYORUZ.
 * `@capacitor-community/sqlite` eklentisi bunu zaten native katmanda,
 * güvenilir ve atomik şekilde sağlıyor: `addUpgradeStatement()` ile her
 * hedef sürüm için çalıştırılacak ham SQL ifadeleri kaydedilir,
 * `createConnection()` çağrısına verilen `version` numarası ile
 * veritabanının mevcut `user_version`'ından hedefe kadar olan tüm
 * yükseltmeler native tarafta sırayla uygulanır. Bunu JS tarafında
 * yeniden icat etmek (kendi `schema_migrations` tablomuzu tutup kendi
 * runner'ımızı yazmak) zaten var olan, test edilmiş bir mekanizmanın
 * gereksiz bir kopyasını oluşturur — bu Kural 4 (gereksiz karmaşıklık)
 * ve Kural 12'ye (kod tekrarından kaçınma) aykırı olurdu.
 *
 * KURAL: Bu dosyadaki dizi SADECE EKLENİR, asla düzenlenmez veya
 * silinmez. Zaten dağıtılmış bir sürümün SQL'ini değiştirmek, o sürümü
 * çalıştırmış cihazlarla yenilerini farklı şemalara sahip hâle getirir.
 * Bir hata düzeltmek gerekiyorsa, yeni bir `toVersion` girişi eklenir.
 *
 * SÜRÜM KAYITLARI:
 *
 * v1 — İlk şema (Modül 1: Altyapı)
 *   Bu aşamada henüz hiçbir iş modülü (parsel, gözlem, vb.) tablosu
 *   oluşturulmuyor — onlar kendi modülleri geldiğinde ayrı bir
 *   `toVersion` girişiyle eklenecek. v1'de sadece uygulamanın kendi
 *   iç durumunu tutan `app_metadata` tablosu kuruluyor. Bu tablo,
 *   ör. "ilk kurulum ne zaman yapıldı", "uygulama şu an hangi büyük
 *   şema sürümünde" gibi tekil anahtar/değer çiftlerini tutar.
 */

import type { capSQLiteVersionUpgrade } from "@capacitor-community/sqlite";

export const DATABASE_NAME = "bahcem_mobile";

/**
 * Uygulamanın şu an beklediği en güncel şema sürümü. Yeni bir migration
 * eklendiğinde bu sayı da birlikte artırılmalıdır — `createConnection()`
 * çağrısına bu değer verilir.
 */
export const CURRENT_SCHEMA_VERSION = 1;

export const SCHEMA_MIGRATIONS: capSQLiteVersionUpgrade[] = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS app_metadata (
         key TEXT PRIMARY KEY NOT NULL,
         value TEXT NOT NULL,
         updated_at TEXT NOT NULL
       );`,
    ],
  },
];
