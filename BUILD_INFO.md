# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 7 — Hasat (Harvest) |
| **Sprint** | 8.3 |
| **Feature** | Navigasyon Entegrasyonu + Finans Entegrasyon Tasarımı |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 525/525 başarılı (+7 yeni — navigasyon testleri) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 397.52kB → 406.43kB (+8.91kB, Hasat ekranı artık lazy-load edilmiyor, Bakım/Finans ile tutarlı, makul) |
| **Lint** | ✅ 0 uyarı/hata (197 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (değişmedi) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `90e649b` |
| **ADR** | Yeni ADR gerekmedi — Bakım'ın (Sprint 5.3) birebir tekrarı; Finans-Hasat entegrasyonu için henüz kesin bir karar yok, sadece tasarım seçenekleri sunuldu |

## Bu Sprintte Yapılanlar (Gerçek, Kanıtlı)

`routes.ts`'e `parcelHarvest`/`treeHarvest` eklendi (eski, bağlamsız `FUTURE_ROUTE_NAMES.harvest` kaldırıldı). `AppRouter.tsx`'e `HarvestScreenRoute`/`TreeHarvestScreenRoute` eklendi (mevcut `useTreeForRoute` hook'u — 4. kullanım, yeni soyutlama yok). `ParcelsScreen`/`ParcelForm`/`TreesScreen`/`TreeForm`'a `onViewHarvest` prop'u eklendi. `docs/harvest-finance-integration-design.md` — 3 seçenekli mimari tasarım (kod yok).

## Sonraki Adım

Roadmap'in bir sonraki adımı: Sprint 8.4 (Dashboard). Finans-Hasat entegrasyonu, kullanıcının tasarım belgesindeki seçeneklerden birini onaylamasını bekliyor.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-8.2 | ✅ Onaylandı |
| Modül 7 — Hasat (TAM İŞLEVSEL) | 🟡 Bu teslimat |
