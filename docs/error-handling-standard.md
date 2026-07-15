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
