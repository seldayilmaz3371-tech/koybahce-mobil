# Beta Sürüm Numaralandırma Önerileri

**Tarih:** 2026-07-17 · **Durum:** ÖNERİ — hiçbir dosya değiştirilmedi, kullanıcı onayı bekliyor
**Kaynak:** Gerçek proje dosyaları incelenerek hazırlandı (varsayılmadı).

## Mevcut Gerçek Durum

| Alan | Şu Anki Değer | Ne Zamandan Beri |
|---|---|---|
| `android/app/build.gradle` → `versionCode` | `1` | Modül 1'den beri hiç değişmedi |
| `android/app/build.gradle` → `versionName` | `"1.0"` | Modül 1'den beri hiç değişmedi |
| `package.json` → `version` | `"0.0.0"` | Proje başından beri hiç değişmedi |
| Git Tag | **Hiç yok** | `docs/git-tag-v0.2.0.md`/`v0.3.0.md` önerileri vardı ama **hiç uygulanmadı** (`git tag -l` boş) |

## Öneri 1 — `versionCode`

**Öneri: `2`**

Gerekçe: Android'in kendi kuralı — `versionCode` sadece **monoton artan bir tam sayı** olmalı (anlamı Google Play/kullanıcı için önemli değil, SADECE her yayının bir öncekinden büyük olması gerekiyor). Bugüne kadar hiç gerçek bir yayın yapılmadığı için `1`den `2`ye geçmek yeterli ve doğru.

## Öneri 2 — `versionName` / `package.json` version

**İki seçenek sunuyorum, kararı sana bırakıyorum:**

### Seçenek A — SemVer Ön-Sürüm Deseni (önerim)
`0.1.0-beta.1`

Gerekçe: Proje henüz hiçbir gerçek kullanıcıya ulaşmadı, SemVer geleneği `0.x.y`'yi "henüz kararlı/stabil değil" için ayırır. `1.0.0`, planlanan TÜM modüller (Hasat/Hava Durumu/Harita/Fotoğraf Analizi/Sesli Asistan vb.) tamamlanmadan kullanılırsa **erken bir sinyal** verir. `0.1.0-beta.1`, "ilk gerçek beta yayını" anlamını en doğru taşır.

### Seçenek B — Mevcut Modül-Bazlı Desenin Devamı
`0.6.0` (Modül 6'nın tamamlandığını yansıtarak, `docs/git-tag-v0.2.0.md`/`v0.3.0.md`'nin izinden)

Gerekçe: Tutarlılık — proje şimdiye kadar "her modül kapanışında bir minor sürüm" deseni öngörmüştü (uygulanmamış olsa da). Ama bu, "Beta" kavramını AÇIKÇA taşımıyor.

**Not:** Android'in `versionName`'i **herhangi bir string** olabilir (SemVer'e uymak ZORUNDA değil) — `package.json`'daki `version` alanı ise npm'in kendi SemVer kısıtına tabi (ön-sürüm etiketleri `-beta.1` gibi desteklenir).

## Öneri 3 — Git Tag

**Öneri: `v0.1.0-beta.1`** (Seçenek A ile tutarlı) **veya `v0.6.0-beta.1`** (Seçenek B ile tutarlı)

Gerekçe: Git tag'in, `versionName` ile **birebir aynı** olması, karışıklığı önler (üç farklı yerde üç farklı sayı olması, ileride "hangisi doğru?" sorusuna yol açabilir).

## Öneri 4 — İlk Beta Sürüm Adı (Kullanıcıya Görünen)

**Üç seçenek:**

1. **"Bahçem Mobile Beta 1"** — en sade, açıklayıcı.
2. **"Zeytin"** — projenin teması (zeytin yetiştiriciliği) ile uyumlu, Android'in kendi geleneğine (kod adlı sürümler) benzer.
3. **"Bahçem Mobile — İlk Saha Denemesi"** — amacı (gerçek çiftçilerle ilk test) doğrudan yansıtan bir isim.

## Özet Tablo (Karar Bekliyor)

| Alan | Öneri |
|---|---|
| `versionCode` | `2` |
| `versionName` / `package.json` | `0.1.0-beta.1` (Seçenek A) **veya** `0.6.0` (Seçenek B) |
| Git Tag | Yukarıdakiyle eşleşen `v...` formatı |
| Beta Adı | "Bahçem Mobile Beta 1" / "Zeytin" / "İlk Saha Denemesi" |

**Hiçbir dosyaya dokunulmadı** — bu belge, kararını verdikten sonra uygulanacak bir öneri listesidir.
