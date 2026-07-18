# Sprint 9.1 — Fotoğraf Altyapısı Mimari Analizi

**Tarih:** 2026-07-18 · **Kural:** Kod yazmadan önce zorunlu analiz — kod okunmadan karar verilmedi.

---

## 🔴 KRİTİK BULGU — Baştan Belirtilmesi Gereken

Sprint 9.1'in talep ettiği **"Fotoğraf modülünün temel altyapısı"**, **Modül 3'ten (Sprint 3.6-3.7) beri zaten tam ve olgun bir şekilde mevcut**. Bu bir varsayım değil — aşağıda her madde gerçek dosyalardan kanıtla gösteriliyor.

---

## Talep Edilen 7 Öncelik — Gerçek Durum Karşılaştırması

### 1. "Mevcut mimariyi incele" ✅ Yapıldı (bu belge)

### 2. "Roadmap ve ADR'leri tekrar oku" ✅ Yapıldı
`docs/roadmap/01-current-state-and-roadmap.md` Bölüm 2.4'ün kendi notu: *"Fotoğraf Analizi ... Bağımlılıklar: AI Altyapısı (Modül 6, TAMAMLANDI), **Fotoğraf modülü (Modül 3, TAMAMLANDI)**."* — Roadmap'in kendisi zaten Fotoğraf modülünün bitmiş olduğunu kaydetmişti.

### 3. "Fotoğraf modülü için Repository Pattern'e uygun mimari oluştur" — **Zaten mevcut**

`src/modules/photos/data/photo.repository.interface.ts` + `photo.repository.ts`:
```ts
export interface IPhotoRepository {
  listByObservation(observationId: string): Promise<Photo[]>;
  getById(id: string): Promise<Photo | null>;
  create(input: NewPhotoInput): Promise<Photo>;
  deactivate(id: string): Promise<void>;
}
```
`BaseRepository`'den türetilmiş, diğer tüm repository'lerle (Parcel/Tree/Observation/Maintenance/Harvest) **birebir aynı desende**.

### 4. "Parcel→Tree→Observation zincirini bozmadan fotoğraf kayıt altyapısı" — **Zaten mevcut, hiç bozulmadı**

`photos` tablosu (Şema Sürüm 3'ten beri): `observation_id TEXT NOT NULL REFERENCES observations(id)`. Zincir: Parcel → Tree → Observation → Photo. Bu sprintte bu zincire **dokunulmadı, dokunulması da gerekmiyor**.

### 5. "Fotoğrafların cihazda yerel saklanacağı yapıyı Capacitor Filesystem ile bütünleştir" — **Zaten mevcut, derin düşünülmüş**

`src/native/filesystem.ts` — `persistPhotoFile()`:
- Kameranın döndürdüğü **geçici** URI'yi, **kalıcı** `Directory.Data`'ya kopyalıyor (resmi tip tanımlarından doğrulanmış).
- **Gerçek bir GitHub issue'sunun (#1835) savunması** kod içinde belgeli: Android'de `mkdir`'in eksik ara klasörleri oluşturmadığı bulgusuna karşı `recursive: true` + idempotent hata yutma.
- Dosya adı `photo.id`'den TÜRETİLİYOR (backlog madde 11 — "kimlik her zaman `id`, asla `file_path` değil" ilkesiyle tutarlı).

### 6. "SQLite kayıt modeli ile dosya sistemi ilişkisini kur" — **Zaten mevcut**

`Photo.filePath` — kalıcı dosyanın yolu, SQLite'ta saklanıyor. `Photo.id` — asıl kimlik, ilişkiler bunun üzerinden kuruluyor (`file_path` ASLA bir ilişki anahtarı olarak kullanılmıyor — bu, kodun kendi yorumunda AÇIKÇA yazıyor).

### 7. "Gelecekteki AI Analizi, kronolojik karşılaştırma, hastalık analizi için uygun veri modeli hazırla" — **Kısmen zaten var, kalan kısım TASARIM belgesi olarak sunuluyor (aşağıya bkz.)**

`photo.repository.ts`'in kendi yorumu: *"...ORDER BY taken_at ASC ... gelecekteki AI karşılaştırması (**Kronolojik Analiz İlkesi**) için de bu sıralama uygun."* — kronolojik sıralama zaten AI analizi düşünülerek tasarlanmıştı.

**Gerçekten eksik olan tek şey:** AI analiz SONUCUNUN (risk puanı, teşhis, öneri) nereye kaydedileceği — bu, AŞAĞIDA bir tasarım belgesi olarak ele alınıyor, **kod yazılmadan**.

---

## Sonuç

Bu sprintte **hiçbir kod yazılmadı** — çünkü kod öncesi analiz, talep edilen altyapının **zaten var olduğunu** kanıtladı. Kullanıcının kendi yasağı ("gereksiz migration/repository/abstraction oluşturma") ile tutarlı: **var olan, iyi tasarlanmış bir altyapıyı gereksiz yere yeniden inşa etmek, bu yasağın ruhuna aykırı olurdu.**

Sprint 9.1'in gerçek katkısı: (1) bu analiz raporu, (2) AI Fotoğraf Analizi'nin gelecekteki veri modeli için bir **tasarım belgesi** (`docs/photo-ai-analysis-data-model-design.md`).
