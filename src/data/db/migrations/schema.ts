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
 *
 * v2 — Parseller ve Ağaçlar (Modül 2)
 *   bkz. docs/adr/0016-modul2-veri-modeli.md (şema kararı),
 *   docs/adr/0017-enum-veri-saklama-kurali.md (crop_type'ın neden
 *   İngilizce kod olarak saklandığı).
 *   `tree_count` gibi ayrı bir sayaç YOK — ağaç sayısı her zaman
 *   `trees` tablosundan anlık hesaplanır (bkz. ADR 0016).
 *
 * v3 — Ağaç Numarası Benzersizlik Kısıtı (Modül 2, Sprint 2.1)
 *   bkz. docs/database-master-schema.md ("Gerçek Bulgu" bölümü).
 *   Bir parselde aynı ağaç numarasının iki kez kullanılmasını önler.
 *   `WHERE is_active = 1`: pasife alınmış bir ağacın numarası, yeni
 *   bir ağaca tekrar verilebilir.
 *
 * v4 — Gözlemler (Modül 3, Sprint 3.1)
 *   bkz. docs/observation-domain-review.md (onaylandı 2026-07-15).
 *   `tree_id` nullable: parsel geneli bir gözlem olabilir.
 *   `observation_type`: enum-kod (ADR 0017). `weather_impact` ismi
 *   bilinçli olarak korundu — bkz. docs/modul-3-backlog.md madde 4
 *   (gelecekte 'environment'e yeniden adlandırma değerlendirilecek,
 *   bugün uygulanmıyor).
 */

import type { capSQLiteVersionUpgrade } from "@capacitor-community/sqlite";

export const DATABASE_NAME = "bahcem_mobile";

/**
 * Uygulamanın şu an beklediği en güncel şema sürümü. Yeni bir migration
 * eklendiğinde bu sayı da birlikte artırılmalıdır — `createConnection()`
 * çağrısına bu değer verilir.
 */
export const CURRENT_SCHEMA_VERSION = 4;

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
  {
    toVersion: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS parcels (
         id TEXT PRIMARY KEY NOT NULL,
         name TEXT NOT NULL,
         crop_type TEXT NOT NULL CHECK (crop_type IN ('olive','vegetable','fruit')),
         latitude REAL,
         longitude REAL,
         area_dekar REAL NOT NULL,
         soil_type TEXT,
         irrigation_type TEXT,
         notes TEXT,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL
       );`,
      `CREATE TABLE IF NOT EXISTS trees (
         id TEXT PRIMARY KEY NOT NULL,
         parcel_id TEXT NOT NULL REFERENCES parcels(id),
         tree_number TEXT NOT NULL,
         variety TEXT NOT NULL,
         planting_year INTEGER,
         latitude REAL,
         longitude REAL,
         is_reference_tree INTEGER NOT NULL DEFAULT 0,
         notes TEXT,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL
       );`,
      `CREATE INDEX IF NOT EXISTS idx_trees_parcel_id ON trees(parcel_id);`,
      `CREATE INDEX IF NOT EXISTS idx_trees_reference ON trees(is_reference_tree) WHERE is_reference_tree = 1;`,
    ],
  },
  {
    toVersion: 3,
    statements: [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_trees_parcel_number ON trees(parcel_id, tree_number) WHERE is_active = 1;`,
    ],
  },
  {
    toVersion: 4,
    statements: [
      `CREATE TABLE IF NOT EXISTS observations (
         id TEXT PRIMARY KEY NOT NULL,
         parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
         tree_id TEXT REFERENCES trees(id) ON DELETE RESTRICT,
         observation_type TEXT NOT NULL CHECK (observation_type IN
           ('general','health_concern','growth_stage','weather_impact','other')),
         note TEXT,
         observed_at TEXT NOT NULL,
         is_active INTEGER NOT NULL DEFAULT 1,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL
       );`,
      `CREATE INDEX IF NOT EXISTS idx_observations_parcel_id ON observations(parcel_id);`,
      `CREATE INDEX IF NOT EXISTS idx_observations_tree_id ON observations(tree_id);`,
      `CREATE INDEX IF NOT EXISTS idx_observations_observed_at ON observations(observed_at);`,
    ],
  },
];
