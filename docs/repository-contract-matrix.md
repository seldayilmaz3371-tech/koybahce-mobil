# Belge 2 — Repository Contract Matrix

**Durum:** Onay bekliyor · **Tarih:** 2026-07-15
**Çelişmediği belgeler:** ADR 0016 (Modül 2 Veri Modeli), `base.repository.ts` (Modül 1)

---

## Amaç

Tüm repository katmanlarının (bugün: `ParcelRepository`, `TreeRepository`; gelecekte: `ObservationRepository`, `FinanceRepository`, `InventoryRepository`, `PhotoRepository`, `TreatmentRepository`) **aynı davranış sözleşmesine** uymasını sağlamak — böylece bir geliştirici (veya AI Tool Calling katmanı) hangi repository'yi kullanırsa kullansın, aynı beklentilerle çalışabilir.

## Kapsam

`BaseRepository`'den türeyen tüm sınıflar ve onların `*.repository.interface.ts` sözleşmeleri.

---

## Tasarım Kararları — Standart Metod Seti

| Metod | Durum | Davranış |
|---|---|---|
| `create(input)` | ✅ Mevcut standart | `Promise<T>`. Başarısızlıkta (ör. `CHECK` ihlali) **exception fırlatır**, sessizce başarısız olmaz. |
| `getById(id)` | ✅ Mevcut standart (**isim netleştirmesi aşağıda**) | `Promise<T \| null>`. Kayıt yoksa `null` döner, **exception fırlatmaz**. |
| `update(id, changes)` | ✅ Mevcut standart | `Promise<void>`. Kayıt yoksa **sessizce 0 satır etkiler, exception fırlatmaz** (aşağıda gerekçe). |
| `deactivate(id)` [softDelete] | ✅ Mevcut standart | `Promise<void>`. `is_active=0` yapar. Fiziksel silme değildir. |
| `restore(id)` | 🔴 **Teknik borç — henüz implement edilmedi** | `Promise<void>`. `is_active=1`'e geri döndürür. Bugün ne `ParcelRepository` ne `TreeRepository`'de yok. |
| `list(options)` | ✅ Mevcut standart | `Promise<T[]>`. Arama/sıralama/sayfalama `options` içinde (aşağıda netleştirme). |
| `count(options?)` | 🔴 **Teknik borç — henüz genel olarak yok** | Sadece `TreeRepository.countByParcel()` özel bir örneği var. Genel bir `count()` bugün yok. |

### İsim Netleştirmesi: `findById` vs `getById`

Mevcut kod tabanı `getById` ismini kullanıyor (ADR 0016'dan beri). Bu belge **mevcut kararla çelişmemek için** `getById`'yi resmi standart ilan eder — "findById" kavramsal bir eş anlamlıdır, gerçek kod ismi değildir.

### `search()`: Ayrı Bir Metod Değil

Mevcut kararla (Modül 2, `ParcelRepository.list({ search })`) tutarlı olarak: **arama, `list()`'in bir parametresidir, ayrı bir `search()` metodu değildir.** Yeni bir repository ayrı bir `search()` metodu eklerse, bu standarttan sapma sayılır.

---

## Transaction Davranışı

`BaseRepository.runInTransaction()` (Modül 1'den beri mevcut) — çok adımlı, atomik olması gereken işlemler için (ör. gelecekte: bir hasat kaydı eklerken aynı anda stoktan düşmek). Tek tablo üzerindeki basit CRUD işlemleri transaction'a sarılmaz (gereksiz — SQLite'ın kendi ifade-seviyesi atomikliği yeterli).

## Duplicate Davranışı

Repository, kendi "zaten var mı" kontrolünü **yazmaz**. Veritabanı seviyesi kısıtlar (`UNIQUE` index) varsa, SQLite'ın hatası olduğu gibi yukarı fırlatılır. Gerekçe: DB seviyesinde zaten garanti edilen bir şeyi uygulama kodunda tekrarlamak Kural 8'i (kod tekrarı) ihlal eder.

## Null Davranışı

- `getById`: kayıt yok → `null`.
- `list`: sonuç yok → boş dizi `[]` (asla `null`).
- `update`/`deactivate`: hedef kayıt yok → sessizce başarılı sayılır (aşağıda gerekçe).

**Gerekçe (update/deactivate sessizliği):** "Kayıt zaten silinmiş/pasif" ile "başarılı update" arasında UI seviyesinde ayrım yapmak nadiren gerçek bir ihtiyaçtır; her çağıran kodun bunu ayrıca kontrol etmesini zorunlu kılmak gereksiz karmaşıklık olurdu (YAGNI). Bu, mevcut `ParcelRepository` davranışıyla zaten tutarlı.

## Validation Sorumluluğu

| Doğrulama türü | Sorumlu katman |
|---|---|
| İş kuralı / UX (ör. "ad boş olamaz", "alan pozitif olmalı") | **UI/Form katmanı** (mevcut `ParcelForm` deseni) |
| Veri bütünlüğü (tip, enum-kod, FK, `NOT NULL`) | **Repository/DB katmanı** (SQL `CHECK`/`NOT NULL`/FK kısıtları) |

Repository, kendi JS tarafında **iş kuralı doğrulaması yazmaz** — bu UI'ın işi. Repository sadece DB'nin zaten uyguladığı kısıtları saydam şekilde yansıtır (hata fırlatarak).

## Repository Sorumluluğu vs UI Sorumluluğu

Repository: **hiçbir zaman** React state bilmez, **hiçbir zaman** çeviri (`t()`) çağırmaz, **hiçbir zaman** UI'a özel formatlama yapmaz. Sadece domain nesneleri döner/kabul eder. UI/Hook katmanı: kullanıcı deneyimini, hata mesajı çevirisini, yükleme durumlarını yönetir.

## Hata Fırlatma Standardı: Exception, Result Değil

**Karar:** Repository katmanı bir `Result<T, Error>` sarmalayıcısı **kullanmaz** — doğrudan `Promise` reddi/`throw` kullanır. Bu, mevcut kod tabanında (`ParcelRepository`, `useParcels`'in `try/catch` deseni) zaten uygulanan yaklaşımdır ve TypeScript/JS ekosisteminde daha idiomatiktir. Yeni bir "Result" deseni eklemek, mevcut mimariyle **çelişir** ve bu belgenin kapsamında önerilmiyor.

Hata kodları için bkz. Belge 3 (Error Handling Standard).

---

## Alternatifler

| Alternatif | Neden Reddedildi |
|---|---|
| `Result<T, E>` (Rust/fp-ts tarzı either) | Mevcut kod tabanıyla çelişir, öğrenme eğrisi ekler (Kural 20 ile gerilim — proje sahibi de öğreniyor, idiomatik JS daha erişilebilir) |
| Her repository'nin kendi doğrulama mantığını yazması | Kural 8 ihlali — DB zaten bunu yapıyor |
| `findById` isminin kod tabanında da değiştirilmesi | Mevcut kararla (ADR 0016) çelişir, gereksiz churn |

## Neden Bu Karar Seçildi

Mevcut, çalışan, test edilmiş desenin (`ParcelRepository`) **resmileştirilmesi** — yeni bir mimari yön değil, var olanın belgelenmesi.

## Riskler

| Risk | Seviye |
|---|---|
| `restore()` eksikliği — kullanıcı yanlışlıkla pasife aldığı bir kaydı geri getiremiyor (UI'da da yok) | **Orta — gerçek bir kullanıcı ihtiyacı, ilerideki bir modülde ele alınmalı** |
| Genel `count()` eksikliği | Düşük — şimdiye kadar ihtiyaç duyulmadı |

## Gelecekte Değişebilecek Noktalar

- `restore()` implement edildiğinde bu belge "✅ Mevcut standart" olarak güncellenecek.
- Transaction gerektiren ilk gerçek çok-tablolu işlem (ör. Finans↔Stok) geldiğinde `runInTransaction` kullanım örneği eklenecek.

## Sonuç

Mevcut `ParcelRepository`/`TreeRepository` deseni, gelecekteki tüm repository'ler için doğru referans standarttır. Tek gerçek eksik: `restore()` — teknik borç olarak kayda geçti, bugün kod yazılmıyor.
