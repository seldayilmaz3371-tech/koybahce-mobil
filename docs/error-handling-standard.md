# Belge 3 — Error Handling Standard

**Durum:** Onay bekliyor · **Tarih:** 2026-07-15
**Çelişmediği belgeler:** Engineering Protocol Bölüm 19 (Erişilebilirlik), AI Master Architecture Bölüm 13

---

## Amaç

Hata yönetimini tüm katmanlarda tutarlı, öngörülebilir ve kullanıcı dostu hale getirmek — ayrıca **gerçek bir bulguyu** dürüstçe belgelemek: mevcut kod, aşağıda tanımlanan standarda henüz tam uymuyor.

## Kapsam

UI, Hooks, Repository, SQLite, Native Plugin, beklenmeyen hatalar, doğrulama hataları — tüm katmanlar.

---

## 🔴 Gerçek Bulgu — Mevcut Kod, Bu Standarda Henüz Uymuyor

`useParcels` hook'u, `error.message` (ham, çevrilmemiş, İngilizce/teknik JS hata mesajı) değerini `errorMessage` state'ine koyuyor; `ParcelsScreen` bunu **doğrudan** kullanıcıya gösteriyor. Bu belge, "hata mesajları her zaman çeviri anahtarına eşlenir" standardını tanımladığı için, mevcut kod bu standardı **henüz karşılamıyor**.

**Bu bir çelişki değil, önceden hiç resmi bir standart olmadığı için oluşan bir boşluktur.** Bugün kod değiştirmiyorum (talimat gereği) — bu, **teknik borç olarak resmen kayda geçiyor** ve Ağaç modülü kod aşamasında (ya da ayrı bir "Parsel düzeltme" adımında) ele alınmalı.

---

## Tasarım Kararları — Katman Katman

| Katman | Ne Olur | Nasıl Yakalanır | Kullanıcıya Ne Gösterilir |
|---|---|---|---|
| **SQLite/Native Plugin** | Ham teknik hata (ör. `"UNIQUE constraint failed"`, `BiometryError`) | Repository veya native sarmalayıcı (`biometricAuth.ts` deseni) tarafından | **Asla doğrudan gösterilmez** |
| **Repository** | DB kısıtı ihlali → exception yukarı fırlatılır (Belge 2) | Hook, `try/catch` ile yakalar | — |
| **Hooks** | Repository hatasını yakalar | `catch (error) { setErrorMessage(...) }` (mevcut desen) | Hook, **error code'a eşler** (aşağıda), ham mesajı değil |
| **UI** | Hook'tan gelen error code'u alır | — | `t('errors.' + code)` ile çevrilmiş, kullanıcı dostu metin |
| **Validation (UI)** | Form-seviyesi kural ihlali (ör. boş ad) | Form kendi içinde yakalar (mevcut `ParcelForm` deseni) | Zaten çeviri anahtarından (`parcel.nameRequired`) — bu kısım **zaten standarda uygun** |
| **Beklenmeyen (Unexpected) Hata** | Öngörülmemiş bir JS hatası | En üst seviyede genel bir yakalayıcı (bugün yok — aşağıda not) | Genel "beklenmeyen bir hata oluştu" mesajı + `logger.error()` (ADR 0019) |

### Loglama

Her katmanda yakalanan hata, `src/core/logger.ts` (ADR 0019 — henüz kurulmadı, teknik borç olarak zaten kayıtlı) üzerinden loglanır. Kalıcı/harici loglama yok (Kural 17).

### Offline Durumda Ne Olur

SQLite tamamen yerel olduğu için "offline" kavramı DB hatalarını etkilemez — her zaman "yerel"dir. Ağ gerektiren tek gelecek bileşenler (AI, hava durumu) için ayrı bir `NETWORK_xxx` hata ailesi önerilir (aşağıda) — bugün kod yok.

### Gelecekteki AI Modülleri Nasıl Davranır

AI Master Architecture Bölüm 13 ile tutarlı: AI hataları (API limiti, ağ kesintisi, geçersiz yanıt) kullanıcıya **genel, teknik detay sızdırmayan** mesajlarla gösterilir (ör. "AI şu an kullanılamıyor, lütfen tekrar deneyin") — asla ham API hata gövdesi gösterilmez.

---

## Error Code Standardı

Format: `PREFIX_NNN` (3 haneli, sıfır dolgulu).

| Prefix | Anlamı | Örnekler |
|---|---|---|
| `VAL` | Doğrulama (form/iş kuralı) | `VAL_001` zorunlu alan boş, `VAL_002` sayısal alan geçersiz/negatif |
| `DB` | Genel veritabanı/repository hatası | `DB_001` bağlantı kurulamadı, `DB_002` migration başarısız, `DB_003` CHECK kısıtı ihlali |
| `PARCEL` | Parsel'e özgü | `PARCEL_001` parsel bulunamadı |
| `TREE` | Ağaç'a özgü | `TREE_001` ağaç bulunamadı, `TREE_002` var olmayan parsele bağlanma girişimi (FK ihlali) |
| `NATIVE` | Native eklenti hatası | `NATIVE_001` biyometrik doğrulama başarısız (mevcut `BiometryErrorType` ile eşlenir) |
| `NETWORK` | Ağ gerektiren işlemler (gelecek) | `NETWORK_001` bağlantı yok, `NETWORK_002` zaman aşımı |
| `AI` | AI katmanı (gelecek, Modül 6-7) | `AI_001` sağlayıcı kullanılamıyor, `AI_002` kota aşıldı |
| `SYS` | Beklenmeyen/sistem hatası | `SYS_001` yakalanmamış istisna |

**Uygulama notu (bugün kod yazılmıyor):** Bu kodların gerçek TypeScript sabitleri olarak tanımlanması (`src/core/errorCodes.ts` gibi) ve hook'ların ham `error.message` yerine bu kodları kullanması, **Ağaç modülü kod aşamasının bir parçası olarak** ele alınmalı — mevcut Parsel kodundaki boşluğu da o zaman kapatmak mantıklı (tek seferde, dağınık değil — Kural 11).

---

## Alternatifler

| Alternatif | Neden Reddedilmedi/Reddedildi |
|---|---|
| Hata kodu yerine sadece çeviri anahtarı adının kendisini hata tanımlayıcısı yapmak (ör. `errors.parcelNotFound`) | Reddedildi — sayısal kodlar (`PARCEL_001`) log/destek iletişiminde (ör. kullanıcı "TREE_002 hatası aldım" diyebilir) çeviri anahtarından daha kısa/net referans sağlar |
| Üçüncü parti hata izleme servisi (Sentry vb.) | Reddedildi — Kural 17 (harici servis bağımlılığı minimum), ADR 0019 ile tutarlı |

## Neden Bu Karar Seçildi

Basit, okunabilir, harici bağımlılık gerektirmeyen, mevcut mimariyle (repository→hook→UI zinciri) doğal olarak uyumlu bir standart.

## Riskler

| Risk | Seviye |
|---|---|
| Mevcut Parsel kodunun standarda henüz uymaması | **Orta — bilinen, kayıtlı teknik borç** |
| Error code'ların merkezi bir yerde tanımlanmaması durumunda dağınıklık riski | Düşük — bugün belgelendiği için önlenebilir |

## Gelecekte Değişebilecek Noktalar

- `NETWORK_xxx` ve `AI_xxx` aileleri, ilgili modüller kodlandığında somutlaşacak.
- Genel bir "yakalanmamış hata" sınır bileşeni (React Error Boundary) bugün yok — ileride eklenebilir (YAGNI, bugün gerçek bir olay yaşanmadı).

## Sonuç

Standart tanımlandı. **Mevcut kod bu standarda tam uymuyor** — bu dürüstçe belgelendi, teknik borç olarak işaretlendi, bugün düzeltilmiyor (talimat: kod yazma). Ağaç modülü kod aşamasında hem yeni kod bu standarda uygun yazılmalı hem de Parsel'deki boşluk kapatılmalı.

---

## Uygulama Planı (2026-07-15 Eklendi) — Henüz Uygulanmıyor

### Error Code Namespace Yapısı

Tek, merkezi bir dosya: `src/core/errors/errorCodes.ts`. Domain başına ayrı dosyalara **bölünmüyor** (bugün ~20-30 kod bekleniyor, bu ölçekte bölmek gereksiz dolaylılık olurdu — i18n çeviri dosyaları için belirlediğimiz "200 satır/6 domain" bölme eşiğiyle (ADR 0012) tutarlı bir gelecekteki tetikleyici burada da geçerli olacak).

### 🔴 Kesin Teknik Karar: `enum` DEĞİL, `as const` Nesnesi — Bu Bir Tercih Değil, Zorunluluk

Projenin `tsconfig.app.json`'ında **`"erasableSyntaxOnly": true`** ayarı var (doğrulandı, dosyadan okundu). Bu TypeScript derleyici seçeneği, gerçek (`enum`, `const enum`) gibi çalışma zamanında kod üreten "saf olmayan" söz dizimini **derleme hatası olarak reddeder**. Yani burada "enum mu const object mi" bir stil tercihi değil — **`enum` kullanmak projeyi derlenemez hale getirir.**

```typescript
// src/core/errors/errorCodes.ts — PLANLANAN ŞEKİL
export const ErrorCode = {
  VAL_001: "VAL_001", // Zorunlu alan boş
  VAL_002: "VAL_002", // Sayısal alan geçersiz/negatif
  DB_001: "DB_001",   // Bağlantı kurulamadı
  DB_002: "DB_002",   // Migration başarısız
  DB_003: "DB_003",   // CHECK kısıtı ihlali
  PARCEL_001: "PARCEL_001",
  TREE_001: "TREE_001",
  TREE_002: "TREE_002",
  NATIVE_001: "NATIVE_001",
  SYS_001: "SYS_001",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
```

Bu, projede zaten kurulu bir desenle **birebir tutarlı**: `LocalPreferenceKey`, `SecureStorageKey` (Modül 1) zaten aynı `as const` desenini kullanıyor — yeni bir desen icat edilmiyor, var olan tekrarlanıyor (Kural 12).

### Dosya Organizasyonu

```
src/core/errors/
├── errorCodes.ts       # Yukarıdaki sabit liste
├── AppError.ts          # Error alt sınıfı: { code: ErrorCodeValue, cause?: unknown }
└── mapSqliteError.ts     # Ham SQLite hata mesajını (ör. "CHECK constraint failed") en yakın ErrorCode'a eşler
```

### Katman Katman Uygulama

| Katman | Sorumluluk |
|---|---|
| **Repository** | Ham hatayı **olduğu gibi** fırlatır — kendi sınıflandırmasını yapmaz (Belge 2 kararıyla tutarlı: repository, çeviri/UI kavramlarını bilmez) |
| **Hook** | `catch` bloğunda `mapSqliteError(error)` çağırır, ham hatayı bir `ErrorCodeValue`'ya çevirir, state'e **kodu** koyar (`errorCode`, artık ham `error.message` değil) |
| **UI** | `t('errors.' + errorCode)` ile çevrilmiş metni gösterir |
| **AI (gelecek)** | Kendi `AI_xxx` kodlarını üretir, aynı `t('errors.' + code)` deseniyle gösterilir |

### i18n Entegrasyonu

Çeviri dosyalarına yeni bir `errors` namespace'i eklenecek:
```json
"errors": {
  "VAL_001": "Bu alan zorunludur.",
  "PARCEL_001": "Parsel bulunamadı.",
  "SYS_001": "Beklenmeyen bir hata oluştu."
}
```
Mevcut çeviri denetim script'i (Modül 2'de kurulan Python taraması), bu namespace'i de otomatik kapsayacak — yeni bir araç gerekmez.

### İlk Uygulanacağı Modül

**Ağaç modülü kod aşamasının bir parçası olarak, TreeRepository ile AYNI ANDA.** Gerekçe: bu altyapı (errorCodes.ts, AppError, mapSqliteError) bir kez kurulacak; kurulurken hem yeni Ağaç kodu hem de mevcut Parsel kodu (useParcels/ParcelsScreen) aynı geçişte bu standarda taşınacak — dağınık, iki ayrı zamana yayılmış bir düzeltme yerine (Kural 11).

