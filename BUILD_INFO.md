# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
<<<<<<< HEAD
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 10.17 — Sistem Promptuna Gerçek Tarih Eklendi (Gerçek Kök Neden Düzeltmesi) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 810/810 başarılı — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (247 dosya) |
| **Cap Sync** | ✅ Başarılı (11 native plugin, değişmedi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-23 |
| **Git Commit** | `ebce5ca` |

## Kesin Kanıtlanmış Kök Neden

Zincirin (`systemPrompt.ts` → `promptBuilder.ts` → `KeywordContextEngine.ts`) hiçbir yerinde bugünün gerçek tarihi modele verilmiyordu. `maintenance.tool.ts`'in `fromDate`/`toDate` parametreleri mutlak `YYYY-MM-DD` bekliyor — model, "son 30 gün" gibi göreceli ifadeleri mutlak tarihe çevirmek için bu referans noktasına ihtiyaç duyuyordu ama hiç sağlanmıyordu.

## Düzeltme

`buildSystemPrompt()` artık gerçek bugünün tarihini (ISO 8601, test edilebilirlik için `currentDate` parametresiyle) içeriyor, modele göreceli zaman ifadelerini kendisi hesaplaması için açıkça talimatlandırıyor. Regex/parsing katmanı yazılmadı — Gemini'nin kendi doğal dil anlama yeteneği, gerçek bir referans noktasıyla kullanıldı.

## Dürüstlük Notu

"30" (rakam) ile "otuz" (kelime) arasındaki kesin davranış farkını kod tabanından kanıtlayamadım — bu, Gemini'nin kendi iç karar mekanizması. Ama kesin kanıtlanan (referans tarih eksikliği), tüm sayısal zaman ifadelerini aynı kök nedenden etkileyebilir.
=======
| **Module** | Modül 10 — Saha Operasyonları (Toplu İşlemler) |
| **Sprint** | 10.3 |
| **Feature** | Saha UX İyileştirmeleri + Navigasyon + Bağımsız UX Öz-Denetimi |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 607/607 başarılı (+11 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 416.97kB → 429.66kB (+12.69kB, Toplu İşlemler artık navigasyona bağlı) |
| **Lint** | ✅ 0 uyarı/hata (220 dosya, 103 kural) — **2 gerçek uyarı bulundu ve kökten düzeltildi** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (değişmedi) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `86a877c` |
| **ADR** | Yeni ADR yazılmadı — mevcut desenlerin (Preferences, soft-delete) genişletmesi |

## Gerçek Bulgular

1. `BulkOperationsScreen` donanım geri tuşunu **hiç desteklemiyordu** — diğer ekranlarla tutarsızlık, `MaintenanceScreen`'in deseniyle düzeltildi.
2. `useEffect` + boş bağımlılık dizisi deseni **2 gerçek lint uyarısına** yol açtı — kök neden düzeltmesi: `useTreeSelection`'a `initialSelectedIds` parametresi eklendi (lazy initializer), `useEffect` tamamen kaldırıldı.

## Tamamlanan Özellikler (Madde 1-2, 4-5, 8, 10)

Arama kutusu, büyük dokunma hedefleri, Son Kullanılan İşlem (`localPreferences`), Ardışık İşlem Sihirbazı, Undo güvenliği (ayrı onay), navigasyon entegrasyonu.

## Ertelenen Özellikler (Madde 3, 6-7) — Dürüstçe Belgelendi

- **Filtre sistemi:** Veri modeli desteklemiyor (`Tree`'de sağlık/durum alanı yok) — alternatifler önerildi.
- **İşlem Şablonları / Favori İşlemler:** Gerçek tasarımlar yapıldı, kapsam disiplini gereği ertelendi.

## Bağımsız UX Öz-Denetimi

`docs/sprint-10.3-ux-self-audit.md` — kendi geliştirdiğim ekranı eleştirerek 8 gerçek yavaşlatıcı nokta bulundu, en kritiği Undo butonunun görsel ayrışmaması.
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3

## Frozen Modules

| Modül | Durum |
|---|---|
<<<<<<< HEAD
| Modül 1-5, 7-10, Veri Yönetimi | ✅ Onaylandı |
| Modül 6 — AI (kesin kanıtlı düzeltme) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
=======
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.2 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (ilk akış) | ✅ Onaylandı |
| Modül 10 — Saha Operasyonları (TAM İŞLEVSEL) | 🟡 Bu teslimat |
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3
