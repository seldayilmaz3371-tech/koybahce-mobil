# Observation Domain Review — Modül 3 Kodlama Öncesi

**Durum:** Onay bekliyor — Sprint 3.1 bu belge onaylanmadan başlamayacak
**Tarih:** 2026-07-15
**Kapsam:** Sadece tasarım. Kod yok.

---

## 1) Gözlem Nedir?

Bir **Gözlem (Observation)**, çiftçinin bir parsel veya belirli bir ağaç hakkında sahada kaydettiği, zaman damgalı bir not/bulgudur — isteğe bağlı olarak bir veya daha fazla fotoğrafla desteklenir. Amaç: her ağacın **yıllar boyunca birikimli, kronolojik bir dijital sağlık geçmişini** oluşturmak (Modül 3 Hedefi'nde tanımlandığı gibi).

## 2) Gözlem Tipleri Neler Olmalı?

**Öneri (onayına sunuluyor, kesin karar değil):** `observation_type` — enum-kod (ADR 0017 kuralına uygun):

| Kod | Anlamı |
|---|---|
| `general` | Genel, sınıflandırılmamış not |
| `health_concern` | Hastalık/zararlı belirtisi |
| `growth_stage` | Gelişim/büyüme durumu |
| `weather_impact` | Hava koşulu etkisi (don, dolu, aşırı yağış vb.) |
| `other` | Diğer |

**Dürüstlük notu:** Bu kategoriler, web projesinin belgelenmiş bir alan listesinden değil, genel tarımsal gözlem pratiğinden türetildi — web projesi denetiminde (Modül 2 öncesi) bu spesifik kategoriler doğrulanmadı. **Senin saha deneyimin bu listeyi değiştirebilir/genişletebilir** — bu yüzden kesin karar olarak değil, öneri olarak sunuluyor.

**Bilinçli olarak eklenmedi:** `irrigation_note`, `fertilization_note` gibi tipler — çünkü Database Master Schema'da **Sulama/Gübreleme/İlaçlama için ayrı, yapılandırılmış bir `treatments` tablosu zaten planlı** (Modül 4/5). Gözlem tiplerinin bunlarla örtüşmesi, aynı bilgiyi iki farklı yerde tutma riski yaratırdı (Kural 8).

## 3) Hangileri Zorunlu, Hangileri İsteğe Bağlı?

| Alan | Zorunlu mu? | Gerekçe |
|---|---|---|
| `parcel_id` | ✅ Zorunlu | Her gözlem en az bir parsele bağlı olmalı |
| `tree_id` | ❌ İsteğe bağlı (nullable) | Parsel geneli bir gözlem olabilir ("bu hafta tüm parselde yaprak dökümü başladı") |
| `observation_type` | ✅ Zorunlu | Yapılandırılmış veri, AI için değerli (Soru 7) |
| `note` | ❌ İsteğe bağlı (nullable) | **Önemli tasarım kararı aşağıda** |
| `observed_at` | ✅ Zorunlu | Kronolojik geçmişin temeli |

**`note` neden isteğe bağlı:** Bir çiftçi, sadece bir fotoğraf çekip not yazmadan hızlıca kaydetmek isteyebilir (saha koşullarında — Kural 15). Şema seviyesinde `note` nullable, ama **UI seviyesinde** en az birinin (not VEYA fotoğraf) dolu olması gerektiği doğrulanmalı — bu, Sprint 3.3'te (Form/Validation) ele alınacak bir UI kuralı, şema kuralı değil.

## 4) Aynı Ağaca Yıllar Boyunca Binlerce Kayıt Eklenirse Yapı Hâlâ Doğru Olur mu?

**Depolama/sorgu performansı: Evet, sorun değil.** SQLite, doğru indekslerle (Database Master Schema'da zaten planlı: `idx_observations_tree_id`, `idx_observations_parcel_id`, `idx_observations_observed_at`) yüz binlerce satırda bile hızlı kalır — bu, Modül 2'nin Performans Değerlendirmesinde zaten kanıtlanmış bir SQLite gerçeği.

**🔴 Gerçek, gerekli değişiklik önerisi:** Ağaç modülünde (Sprint 2.4) **bilinçli olarak sayfalama eklenmemişti** — gerekçe "bir parselde 50'den fazla ağaç istisnai" idi. **Bu gerekçe Gözlem için GEÇERLİ DEĞİL.** Bir ağaca yılda 20-50 gözlem eklenirse, 10 yılda 200-500 kayıt birikir — bu, `useParcels`'teki gibi **gerçek sayfalamayı gerektiren** bir ölçek. 

**Öneri:** `useObservations`, Ağaç'ın DEĞİL, **Parsel'in** `hasMore`/`loadMore` desenini miras almalı — `ORDER BY observed_at DESC` (en yeni önce) + `LIMIT`/`OFFSET`. Bu, yeni bir mimari değil, zaten var olan iki desenden (Parsel'in sayfalamalı, Ağaç'ın sayfalamasız) **doğru olanın seçilmesi**.

## 5) Fotoğraf İlişkisi Nasıl Olmalı?

Database Master Schema'da bu **bilinçli olarak açık bırakılmıştı** (iki seçenek: A- ikili nullable FK, B- her fotoğraf bir gözleme bağlı). **Senin Sprint 3.6→3.8 sıralaman bu kararı zaten netleştiriyor:** Sprint 3.8 başlığı "Observation → Photo İlişkisi, bir gözleme çoklu fotoğraf desteği" — bu, **Seçenek B**'yi (her fotoğraf bir gözleme bağlı, `photos.observation_id NOT NULL`, `tree_id`/`parcel_id` FK'si YOK) işaret ediyor.

**Öneri:** Seçenek B ile kesinleştir. Gerekçe:
- Tek bir ilişki yolu — `tree_id`/`observation_id` ikili nullable FK'sının getirdiği "hangisi dolu olmalı" belirsizliği ortadan kalkar (Kural 4, gereksiz karmaşıklık).
- "Sadece hızlı bir fotoğraf" isteyen kullanıcı senaryosu, minimal bir Gözlem kaydı (not boş, sadece fotoğraf) oluşturarak karşılanır — bu, zaten "dijital sağlık geçmişi" hedefiyle tutarlı (her fotoğraf, zaman çizelgesinde bir an olarak kayıtlı kalır).

**Bunun onayına ihtiyacım var** — bu, Sprint 3.6'nın şema tasarımını doğrudan etkiliyor.

## 6) AI İçin Hangi Alanlar Gerçekten Değerli?

- `observation_type` — yapılandırılmış, AI'ın "son 30 günde 3 `health_concern` kaydı" gibi örüntü tanıması için kritik
- `observed_at` — zaman serisi analizi (AI Master Architecture Bölüm 11, Fotoğraf Analizi ile birleşecek)
- `note` — serbest metin, AI okuyabilir ama asla AI tarafından üretilip geri yazılmaz (AI Master Architecture Bölüm 1, kullanıcı onayı ilkesi)
- `tree_id`/`parcel_id` — bağlam kapsamı

## 7) Gereksiz Alanlar Var mı?

Öneri listesinde **fazlalık görmüyorum**. Bilinçli olarak EKLEMEDİĞİM (gereksiz olurdu):
- Önem derecesi/öncelik puanı (subjektif, kullanıcıya ekstra karar yükü — ihtiyaç kanıtlanmadan eklenmez)
- Hava durumu otomatik verisi (harici API entegrasyonu, Kural 17 ile çelişir — bugün yok)

## 8) Eksik Alanlar Var mı?

**Değerlendirildi ama EKLENMEDİ (kayda geçiyorum, karar senin):** "Çözüldü/Açık" durumu (ör. bir `health_concern` gözleminin daha sonra çözüldüğünü işaretlemek). Bu, gerçek bir saha ihtiyacı olabilir ama bugünkü hedef ("geçmiş" — bir görev takip sistemi değil) için gerekli değil. **YAGNI gereği eklenmiyor**, ama şema (nullable sütun ekleme) buna kapalı değil.

## 9) Bugün Eklenmeyecek Ama Gelecekte Gerekebilecek Alanlar

| Alan | Neden bugün yok |
|---|---|
| `latitude`/`longitude` | **Açıkça talimatınla ertelendi** — GPS otomatik konum, saha kullanımı öncesi ayrı bir özellik |
| Hava durumu anlık verisi | Harici servis bağımlılığı, bugün karar verilmedi |
| Çözüldü/Açık durumu | Soru 8'de tartışıldı |
| Önem derecesi | Soru 7'de tartışıldı |

**Bu alanların hiçbiri şemayı bugün değiştirmiyor — hepsi, ADR 0005'in "sadece ekleme" migration desenine göre, ileride sancısız eklenebilir.**

## 10) Veri Modeli 5-10 Yıl Değişmeden Kullanılabilir mi?

**Evet, çekirdek şekliyle.** Gerekçe: `id`/`parcel_id`/`tree_id`/`observation_type`/`note`/`observed_at`/`is_active`/`created_at`/`updated_at` — bu 9 alan, Parsel/Ağaç'ta zaten 10+ yıl önce (bu projenin ömrü boyunca) değişmeyeceği kanıtlanmış aynı desenin bir uzantısı. Yeni ihtiyaçlar (GPS, hava durumu, çözüldü-durumu) **yeni sütunlar** olarak eklenir, mevcut yapı bozulmaz.

---

## Önerilen Şema (Onay Bekliyor — Kod Yazılmadı)

```sql
-- PLANLANAN — Sprint 3.1'de, onaydan sonra uygulanacak
CREATE TABLE observations (
  id TEXT PRIMARY KEY NOT NULL,
  parcel_id TEXT NOT NULL REFERENCES parcels(id) ON DELETE RESTRICT,
  tree_id TEXT REFERENCES trees(id) ON DELETE RESTRICT, -- nullable
  observation_type TEXT NOT NULL CHECK (observation_type IN
    ('general','health_concern','growth_stage','weather_impact','other')),
  note TEXT, -- nullable
  observed_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_observations_parcel_id ON observations(parcel_id);
CREATE INDEX idx_observations_tree_id ON observations(tree_id);
CREATE INDEX idx_observations_observed_at ON observations(observed_at);

-- Sprint 3.6/3.8 için — Soru 5'teki Seçenek B onaylanırsa:
CREATE TABLE photos (
  id TEXT PRIMARY KEY NOT NULL,
  observation_id TEXT NOT NULL REFERENCES observations(id) ON DELETE RESTRICT,
  file_path TEXT NOT NULL,
  taken_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_photos_observation_id ON photos(observation_id);
```

---

## Senden Onay Beklenen 2 Nokta

1. **Gözlem tipi kategorileri** (Soru 2) — önerilen 5 kategori senin saha deneyimine uyuyor mu?
2. **Fotoğraf ilişkisi** (Soru 5) — Seçenek B (her fotoğraf bir gözleme bağlı) onaylanıyor mu?

Bu ikisi dışında, tasarım kararlarının tümü mevcut mimariyle (Database Master Schema, Repository Contract Matrix, ADR 0005/0017) tam uyumlu — yeni bir mimari değil, var olan desenlerin doğru uygulanması.
