# Sprint 10.3 — Filtre Sistemi, İşlem Şablonları, Favori İşlemler: Mimari Analiz

**Tarih:** 2026-07-18 · **Kural:** Kod yazmadan önce zorunlu analiz.

---

## Madde 3 — Filtre Sistemi (Aktif/Pasif/Hasta/Sağlıklı/Genç/Yaşlı)

### 🔴 Kritik Bulgu — Veri Modeli Bunu Desteklemiyor

`Tree` domain'i (`src/modules/trees/domain/tree.types.ts`) gerçekten okundu:

```ts
export interface Tree {
  id: string; parcelId: string; treeNumber: string; variety: string;
  plantingYear: number | null; latitude: number | null; longitude: number | null;
  isReferenceTree: boolean; notes: string | null; isActive: boolean;
  createdAt: string; updatedAt: string;
}
```

**"Hasta"/"Sağlıklı" için hiçbir alan yok.** `isActive`, kullanıcının kastettiği "pasif ağaç" (ör. "artık üretim yapmayan" veya "hastalıklı") anlamına GELMİYOR — bu, soft-delete bayrağı (Kural: silinen ağaçlar `isActive: false` olur). Bunu "pasif durum filtresi" olarak KULLANMAK yanlış bir anlam taşırdı.

### Kullanıcının Kendi Talimatı: "Eğer veri modeli desteklemiyorsa uygun filtreleri öner"

| İstenen Filtre | Gerçek Durum | Önerilen Alternatif |
|---|---|---|
| **Aktif/Pasif** | `isActive` var ama YANLIŞ anlam taşır (silinmiş/silinmemiş) | Kullanılmamalı — "aktif" zaten TÜM listelenen ağaçlar (silinenler hiç görünmüyor) |
| **Hasta/Sağlıklı** | Hiç alan yok | **Dolaylı türetme:** Bir ağacın **son gözlemi** `health_concern` tipindeyse "dikkat gerektiren" olarak işaretlenebilir — bu, GERÇEK bir veri (Observation geçmişi) kullanır, UYDURMA değildir. Ancak bu, HER ağaç için `observationRepository.listByTree()` sorgusu gerektirir (N+1 — Dashboard'ın Sprint 8.4'te bulduğu AYNI mimari sınır) |
| **Genç/Yaşlı** | `plantingYear` VAR | **Gerçek, hesaplanabilir:** `currentYear - plantingYear` ile yaş hesaplanabilir, bir eşik (ör. 5 yıl altı "genç") tanımlanabilir — **YENİ bir veri alanı GEREKMİYOR**, sadece runtime hesaplama |

### Öneri (Bu Sprintte UYGULANMADI)

1. **Genç/Yaşlı filtresi** — gerçek veri (`plantingYear`) zaten var, **düşük risk**, gelecek bir sprintte kolayca eklenebilir.
2. **Hasta/Sağlıklı filtresi** — Observation geçmişinden türetilebilir ama **N+1 sorgu maliyeti** var (500 ağaçlık bir parselde 500 ayrı sorgu anlamına gelebilir) — Dashboard'daki gibi `Promise.all` ile paralel çalıştırılabilir, ama gerçek performans etkisi ÖLÇÜLMELİ.
3. **Aktif/Pasif** — **önerilmiyor**, kavramsal karışıklık yaratır.

**Bu sprintte HİÇBİR filtre kodu yazılmadı** — mevcut arama kutusu (Madde 2), 500 ağaçlık bir listede belirli bir ağacı bulma ihtiyacının büyük kısmını ZATEN karşılıyor.

---

## Madde 6 — İşlem Şablonları

### Tasarım (Gerçek, Uygulanabilir — Ama Bu Sprintte KODLANMADI)

Bir şablon: `{ id: string, name: string, steps: Array<{ kind: "observation"; observationType } | { kind: "maintenance"; maintenanceType }> }`.

**Saklama:** `localPreferences` üzerinden **JSON dizisi** olarak — Madde 4'ün ("Son Kullanılan İşlem") KANITLADIĞI gibi, bu basit, ilişkisel olmayan veri için SQLite migration GEREKMEZ.

**Uygulama akışı:** Kullanıcı bir şablonu seçtiğinde, `BulkOperationsScreen`'in Ardışık İşlem Sihirbazı (Madde 5) mekanizması **TEKRAR KULLANILARAK**, şablondaki HER adım sırayla (aynı ağaç seçimiyle) uygulanabilir — **yeni bir "sıralı çalıştırma motoru" İCAT ETMEDEN**, mevcut `carriedTreeIds` deseninin bir döngüsü.

### 🔴 Neden Bu Sprintte Kodlanmadı

Bu, GERÇEKTEN uygulanabilir bir tasarım ama **şablon OLUŞTURMA UI'ı** (isim girme, adım ekleme/çıkarma/sıralama) **kendi başına önemli bir UI karmaşıklığı** taşıyor — bu sprintte zaten teslim edilen kapsam (arama, son kullanılan, ardışık sihirbaz, undo güvenliği, navigasyon) göz önüne alındığında, **kaliteden ödün vermeden** bunu da eklemek gerçekçi değildi. Kullanıcının kendi ilkesiyle tutarlı bir karar: "Amaç sadece çalışan bir ekran yapmak değil" — aceleyle eklenen bir şablon UI'ı, bu ilkeye aykırı olurdu.

**Öneri:** Ayrı bir sprint (Sprint 10.4 veya sonrası).

---

## Madde 7 — Favori İşlemler

### Gerçek Bir Bulgu: Madde 4 ile Kavramsal Çakışma

"Son Kullanılan İşlem" (Madde 4, bu sprintte uygulandı) ile "Favori İşlemler" (Madde 7) **aynı ihtiyacın iki farklı çözümü** olabilir:
- Son Kullanılan: **tek** bir değer, en son ne yapıldığını hatırlar.
- Favoriler: **birden fazla** işlem, kullanım SIKLIĞINA göre sıralanır.

### Tasarım (Uygulanmadı)

`localPreferences`'e bir **kullanım sayacı** JSON nesnesi (`{ irrigation: 12, fertilization: 3, ... }`) eklenerek, menüde en sık kullanılan 2-3 işlem üste çıkarılabilir — **Madde 4'ün mekanizmasının doğal bir genişlemesi**, yeni bir mimari kategori DEĞİL.

### 🔴 Neden Bu Sprintte Kodlanmadı

Aynı gerekçe — kapsam disiplini. Ayrıca, Madde 4 (Son Kullanılan) **zaten** "kullanıcı sürekli aynı işlemi yapıyorsa hızlı erişim" ihtiyacının **büyük kısmını** karşılıyor — Favoriler'in **ek değeri** (birden fazla işlemi göstermek), gerçek kullanıcı geri bildirimi olmadan **spekülatif** kalıyor (YAGNI).

**Öneri:** Beta kullanıcı geri bildirimi toplandıktan SONRA, gerçek bir ihtiyaç kanıtlanırsa değerlendirilmeli.

---

## Sonuç

Bu üç madde için **hiçbir kod yazılmadı** — ama HİÇBİRİ görmezden gelinmedi. Madde 3 için gerçek bir veri modeli sınırı bulundu ve alternatifler sunuldu. Madde 6-7 için gerçek, uygulanabilir tasarımlar yapıldı ama **kapsam disiplini** gereği ertelendi — kullanıcının kendi ilkesiyle ("amaç sadece çalışan bir ekran yapmak değil") tutarlı bir karar.
