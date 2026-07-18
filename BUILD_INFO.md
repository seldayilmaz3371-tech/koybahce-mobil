# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 8 — Dashboard |
| **Sprint** | 8.5 |
| **Feature** | Navigasyon Entegrasyonu (buton girişi, ANA EKRAN DEĞİL) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 538/538 başarılı (+4 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 407.00kB → 413.73kB (+6.73kB, Dashboard artık navigasyona bağlı) |
| **Lint** | ✅ 0 uyarı/hata (201 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `33b94b4` |
| **ADR** | Yeni ADR gerekmedi — mevcut route/prop deseninin tekrarı |

## Kararlaştırılan Navigasyon Yaklaşımı

**Dashboard ana ekran YAPILMADI** — Parseller mevcut ana ekran olarak kaldı. Gerekçe: Sprint 7.2'nin gerçek cihaz testli akışını (Kilit→Parseller) bozmamak, saha kullanımında ekstra tık maliyetinden kaçınmak, Beta geri bildirimi olmadan spekülatif değişiklik yapmamak. Dashboard, Parseller ekranından bir buton ile ("Add Parcel"dan hemen sonra) erişiliyor.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-8.4 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard (TAM İŞLEVSEL) | 🟡 Bu teslimat |
