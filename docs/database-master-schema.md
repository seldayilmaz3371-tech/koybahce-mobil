# Bahçem Mobile — Database Master Schema

**Durum:** Onay bekliyor
**Tarih:** 2026-07-15
**İlgili:** `docs/erd.mermaid`, ADR 0005 (Migration), ADR 0016 (Modül 2 Veri Modeli), ADR 0017 (Enum Kuralı)

Bu belge, projenin **uzun yıllar kullanılacak** ana veri modelinin tek kaynağıdır. İki kategori var:
- **[UYGULANDI]** — Bugün gerçekten SQLite'ta var, `src/data/db/migrations/schema.ts`'te kayıtlı.
- **[PLANLANAN]** — Henüz oluşturulmadı. Şekli burada belgeleniyor ki gelecekte eklenirken bugünkü mimariyi bozmasın (YAGNI ihlali değil — sadece dokümantasyon, hiçbir kolon/tablo şimdiden oluşturulmuyor).

---

## Genel Kurallar (Tüm Tablolar İçin Bağlayıcı)

1. **Soft Delete standardı:** Her iş varlığı tablosunda `is_active INTEGER NOT NULL DEFAULT 1`. Fiziksel `DELETE` **hiçbir zaman** kullanılmaz — tek istisna aşağıda (AI Konuşma Geçmişi Temizleme).
2. **Zaman damgaları:** `created_at`, `updated_at` — her ikisi de `TEXT NOT NULL`, ISO 8601 formatında (`new Date().toISOString()`). SQLite'ın native tarih tipi yok, bu proje genelinde tutarlı bir kural.
3. **Birincil anahtarlar:** Her tabloda `id TEXT PRIMARY KEY` — istemci tarafında `crypto.randomUUID()` ile üretilir (otomatik artan INTEGER değil). Gerekçe: offline-first mimaride, gelecekte çoklu cihaz senkronizasyonu (ADR 0011 dipnotu, spekülatif) söz konusu olursa, istemci tarafı UUID çakışma riski taşımaz; otomatik artan ID'ler farklı cihazlarda çakışırdı.
4. **Enum-kod kuralı (ADR 0017):** Sabit seçenek kümesi içeren her sütun İngilizce kod saklar, `CHECK` kısıtıyla desteklenir, görüntü metni her zaman i18next'ten gelir.
5. **Cascade davranışı:** Tüm yabancı anahtarlar `ON DELETE RESTRICT` — bu, "gerçek silme hiç yapılmaz" felsefesiyle tutarlı bir güvenlik ağı: bir ebeveyn kayıt, bağlı çocuk kayıtları varken (teorik olarak) fiziksel silinmeye çalışılırsa SQLite bunu reddeder.
6. **Soft-delete cascade YOK (bilinçli karar):** Bir parsel pasife alındığında (`is_active=0`), ona bağlı ağaçlar **otomatik pasife alınmaz**. Gerekçe: kullanıcı yanlışlıkla bir parseli pasife alırsa, ağaç verisi etkilenmeden kalır — geri alma (parseli tekrar aktif etme) tüm alt verinin sağlam kalmasını garanti eder. UI katmanı zaten pasif bir parselin ağaçlarına normal navigasyonla ulaşılmasını engeller (parsel listede görünmediği için).

---

## [UYGULANDI] Sürüm 1 — Altyapı

```sql
CREATE TABLE app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
Amaç: tekil anahtar/değer çiftleri (ör. ilk kurulum zamanı). Index gerekmez (PK zaten aranan alan).

## [UYGULANDI] Sürüm 2 — Parseller ve Ağaçlar

```sql
CREATE TABLE parcels (
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
);

CREATE TABLE trees (
  id TEXT PRIMARY KEY NOT NULL,
  parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
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
);

CREATE INDEX idx_trees_parcel_id ON trees(parcel_id);
CREATE INDEX idx_trees_reference ON trees(is_reference_tree) WHERE is_reference_tree = 1;
```

### 🔴 Gerçek Bulgu — Bu Gözden Geçirmede Tespit Edildi

Mevcut `trees` şemasında **`UNIQUE(parcel_id, tree_number)` kısıtı eksik**. Bugünkü kod (`TreeRepository`) bunu zorlamıyor — teorik olarak aynı parselde iki "Ağaç #1" oluşturulabilir. Bu, veri bütünlüğü açısından gerçek bir eksiklik.

**Öneri:** Sürüm 3'te (Ağaç kod geliştirmesi başladığında) şu migration eklensin:
```sql
CREATE UNIQUE INDEX idx_trees_parcel_number ON trees(parcel_id, tree_number) WHERE is_active = 1;
```
`WHERE is_active = 1` kısmı önemli: pasife alınmış bir ağacın numarası, yeni bir ağaca tekrar verilebilsin (aksi halde "silinmiş" görünen numaralar sonsuza dek rezerve kalırdı). **Bu değişiklik bugün UYGULANMIYOR** — kod yazımı onayı ile birlikte Sürüm 3'e eklenecek.

---

## [PLANLANAN] Sürüm 3+ — Gelecek Modüller (Şekil Belgeleniyor, Oluşturulmuyor)

### Gözlemler (Observation) — Modül 3
```sql
-- PLANLANAN, henüz oluşturulmadı
CREATE TABLE observations (
  id TEXT PRIMARY KEY NOT NULL,
  parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
  tree_id TEXT REFERENCES trees(id) ON DELETE RESTRICT, -- nullable: parsel geneli bir gözlem olabilir
  note TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- Önerilen index'ler:
CREATE INDEX idx_observations_parcel_id ON observations(parcel_id);
CREATE INDEX idx_observations_tree_id ON observations(tree_id);
CREATE INDEX idx_observations_observed_at ON observations(observed_at); -- tarih aralığı sorguları için
```

### Fotoğraflar (Photo) — Modül 3
**Açık tasarım kararı (bilerek erken karar verilmiyor):** Fotoğraf, doğrudan bir ağaca mı yoksa bir gözleme mi bağlanmalı? İki seçenek:
- **A)** `photos.tree_id` (nullable) + `photos.observation_id` (nullable) — ikisinden biri dolu olmalı, esneklik sağlar.
- **B)** Fotoğraf her zaman bir gözleme bağlı, gözlem her zaman parsel/ağaca bağlı (tek yol, daha basit ama daha kısıtlayıcı).

Bu karar, Modül 3 tasarımı başladığında, gerçek kullanıcı senaryosuna (kullanıcı gözlem notu yazmadan sadece fotoğraf mı çekmek istiyor?) göre verilecek — bugün varsayımla kapatılmıyor.

```sql
-- PLANLANAN, tasarım kararı Modül 3'te kesinleşecek
CREATE TABLE photos (
  id TEXT PRIMARY KEY NOT NULL,
  tree_id TEXT REFERENCES trees(id) ON DELETE RESTRICT,
  observation_id TEXT REFERENCES observations(id) ON DELETE RESTRICT,
  file_path TEXT NOT NULL,
  taken_at TEXT NOT NULL,
  exif_latitude REAL,
  exif_longitude REAL,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_photos_tree_id ON photos(tree_id);
```

### AI Fotoğraf Analizi — Modül 6-7
```sql
-- PLANLANAN
CREATE TABLE photo_ai_analyses (
  id TEXT PRIMARY KEY NOT NULL,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE RESTRICT,
  growth_stage TEXT, -- enum-kod (ADR 0017)
  health_status TEXT, -- enum-kod — web projesindeki 'Sağlıklı'/'Riskli' HATASI TEKRARLANMAYACAK
  raw_ai_response TEXT,
  analyzed_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_photo_analysis_photo_id ON photo_ai_analyses(photo_id); -- bir fotoğraf, bir analiz sonucu
```

### Finans Kayıtları — Modül 4
```sql
-- PLANLANAN
CREATE TABLE finance_records (
  id TEXT PRIMARY KEY NOT NULL,
  parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
  tree_id TEXT REFERENCES trees(id) ON DELETE RESTRICT, -- nullable, referans ağaç bazlı hasat takibi
  record_type TEXT NOT NULL CHECK (record_type IN ('cost','harvest','sale')), -- enum-kod
  amount REAL NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'TRY', -- localization, ISO 4217
  record_date TEXT NOT NULL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_finance_parcel_id ON finance_records(parcel_id);
CREATE INDEX idx_finance_record_date ON finance_records(record_date); -- yıl/ay bazlı raporlama için kritik
```

### Stok — Modül 5
```sql
-- PLANLANAN
CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fertilizer','pesticide','equipment','other')), -- enum-kod
  quantity_on_hand REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('kg','l','piece')), -- enum-kod
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE inventory_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase','consumption','adjustment')),
  quantity_delta REAL NOT NULL, -- pozitif: giriş, negatif: çıkış
  transaction_date TEXT NOT NULL
);
CREATE INDEX idx_inventory_tx_item_id ON inventory_transactions(inventory_item_id);
```

### Uygulamalar: Sulama/Gübreleme/İlaçlama — Modül 4/5

**Mimari öneri (bu gözden geçirmenin gerçek bir bulgusu):** Sulama, Gübreleme, İlaçlama için **3 ayrı neredeyse özdeş tablo YERİNE**, tek bir `treatments` tablosu + `treatment_type` enum-kodu öneriliyor:

```sql
-- PLANLANAN — 3 ayrı tablo yerine BİRLEŞİK öneri
CREATE TABLE treatments (
  id TEXT PRIMARY KEY NOT NULL,
  parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
  tree_id TEXT REFERENCES trees(id) ON DELETE RESTRICT, -- nullable
  inventory_item_id TEXT REFERENCES inventory_items(id) ON DELETE RESTRICT, -- nullable
  treatment_type TEXT NOT NULL CHECK (treatment_type IN ('irrigation','fertilization','spraying')),
  quantity_used REAL,
  applied_at TEXT NOT NULL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_treatments_parcel_id ON treatments(parcel_id);
CREATE INDEX idx_treatments_type ON treatments(treatment_type);
```

**Gerekçe:** Kural 8 (kod tekrarından kaçınma) — 3 tablo yerine 1 tablo + enum, tekrar eden repository/migration kodu önlüyor. **Bu, Modül 4/5 tasarımı başladığında yeniden değerlendirilecek** (belki gerçek kullanım, tür-özel alanlar — ör. ilaçlamada "bekleme süresi" gibi — gerektirebilir; o zaman ayrı tablolara bölünebilir). Şimdiden kesin karar verilmiyor, sadece **varsayılan öneri** olarak kayda geçiyor.

### AI Katmanı — Modül 6-7 (AI Master Architecture Bölüm 3 ile Birebir)
```sql
-- PLANLANAN
CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  started_at TEXT NOT NULL,
  language_code TEXT NOT NULL
);

CREATE TABLE ai_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL, -- orijinal yazıldığı dilde, ÇEVİRİ YAPILMAZ (AI Architecture Bölüm 17)
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);

CREATE TABLE ai_facts (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE RESTRICT, -- nullable
  parcel_id TEXT REFERENCES parcels(id) ON DELETE RESTRICT, -- nullable
  content TEXT NOT NULL,
  approved_at TEXT NOT NULL -- kullanıcı onay zaman damgası — AI kendiliğinden yazamaz (AI Architecture Bölüm 1)
);
```

**🔵 İSTİSNA — Soft Delete Kuralına Aykırı, Bilinçli:** Kullanıcı "sohbet geçmişini temizle" dediğinde, `ai_conversations`/`ai_messages` için **gerçek `DELETE`** kullanılacak (soft-delete değil). Gerekçe: Bu, kullanıcının açık bir gizlilik/"unut" talebidir — verinin `is_active=0` ile "gizlenmiş ama hâlâ orada" durması, kullanıcının niyetiyle çelişir (AI Master Architecture Bölüm 13, gizlilik ilkeleri). Bu istisna, genel kuraldan (Kural 1) sapmanın **tek meşru gerekçeli örneği**.

### Farm (Çiftlik) — Spekülatif, Muhtemelen Hiç Gerekmeyecek
```sql
-- SPEKÜLATİF — bugün gerçek bir ihtiyaç yok
CREATE TABLE farms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);
-- parcels tablosuna eklenecek: farm_id TEXT REFERENCES farms(id)
```
**Değerlendirme:** AI Master Architecture Bölüm 16'da zaten belirtildiği gibi, çoklu çiftlik desteği **en büyük mimari değişikliği** gerektiren madde. Bugün tek-çiftlik varsayımı (örtük) yeterli. Bu tablo muhtemelen **yıllarca hiç oluşturulmayabilir** — sadece kullanıcı gerçekten ikinci bir çiftlik yönetmek isterse gündeme gelir.

### Reports — Muhtemelen Hiç Tablo Olmayacak
**Gerçek mimari bulgu:** "Raporlar" muhtemelen kendi tablosunu gerektirmez — mevcut verilerin (Finans, Gözlem, Stok) üzerinde SQL sorgularıyla üretilen **görünümlerdir** (ör. "bu ay toplam maliyet" bir `SELECT SUM(...)`, kalıcı bir tablo değil). Bu satır, gelecekte birinin yanlışlıkla bir "reports" tablosu oluşturmaya çalışmasını önlemek için bilerek buraya not düşüldü.

### Sync — Tamamen Spekülatif, Şimdilik Ele Alınmıyor
Mevcut mimari (ADR 0001) kasıtlı olarak **tek cihaz, sunucu yok**. "Sync" kavramı, ancak çoklu cihaz/bulut senkronizasyonu gibi büyük bir gelecek yön değişikliği kararı alınırsa gündeme gelir — bu, kendi ayrı ADR'ini gerektirecek kadar büyük bir karardır. Bugün hiçbir şema önerisi bile sunulmuyor (spekülasyon, bu aşamada faydadan çok kafa karışıklığı yaratır).

---

## Performans — İndeks Stratejisi Özeti

| İlke | Gerekçe |
|---|---|
| Her yabancı anahtar (FK) sütununda index | JOIN ve `WHERE parent_id = ?` sorguları için zorunlu |
| Tarih sütunlarında index (`observed_at`, `record_date`) | Raporlama/aralık sorguları (`WHERE date BETWEEN ...`) için |
| Enum-kod sütunlarında **kısmi** index (ör. `is_reference_tree`) | Sadece azınlık değeri (`=1`) sorgulanıyorsa `WHERE` koşullu index, tam tablo index'inden daha küçük/hızlı |
| Sayfalama (`LIMIT`/`OFFSET`) | Binlerce kayıtta bile sorun değil (yerel SQLite, indeksli) — Modül 2 Performans Değerlendirmesinde zaten doğrulandı |

---

## Değişmezlik Taahhüdü

Bu şema onaylandıktan sonra:
- **[UYGULANDI]** bölümündeki tablolar, ADR 0005 kuralınca (dağıtılmış migration asla düzenlenmez) sadece **yeni migration'larla genişletilebilir**, asla geriye dönük değiştirilmez.
- **[PLANLANAN]** bölümü, ilgili modül tasarımı başladığında **gerçek kullanıcı senaryosuna göre revize edilebilir** — burada "kesin" değil "varsayılan öneri" statüsündedir.
