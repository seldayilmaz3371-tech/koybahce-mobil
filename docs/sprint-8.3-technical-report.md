# Sprint 8.3 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Hasat (Harvest) Modülü — Navigasyon Entegrasyonu + Finans Entegrasyon Tasarımı

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

- `src/router/routes.ts`: `parcelHarvest`/`treeHarvest` rotaları eklendi; eski, bağlamsız `FUTURE_ROUTE_NAMES.harvest` kaldırıldı (`finance`/`settings`'in Sprint 4.3/7.1'deki emsaliyle tutarlı).
- `src/router/AppRouter.tsx`: `HarvestScreenRoute` (parsel-bağlamlı) + `TreeHarvestScreenRoute` (ağaç-bağlamlı, mevcut `useTreeForRoute` hook'unun **4. kullanımı** — yeni soyutlama gerekmedi).
- `ParcelsScreen`/`ParcelForm`/`TreesScreen`/`TreeForm`'a `onViewHarvest` prop'u eklendi (Bakım'ın Sprint 5.3 deseninin birebir tekrarı).
- `parcel.viewHarvestButton`/`tree.viewHarvestButton` i18n anahtarları EN/TR'ye eklendi.
- `docs/harvest-finance-integration-design.md` — 3 seçenekli mimari tasarım belgesi (kod içermez).
- **7 yeni gerçek navigasyon testi** (`AppRouter.test.tsx`) — 2'si, oluşturulan hasat kaydının **DB seviyesinde** doğru `parcelId`/`treeId` taşıdığını kanıtlıyor (kullanıcının Madde 3 talebi).
- `npx tsc -b`, `npm run test` (525/525), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Gerçek Bir Bulgu (Test Yazarken Ortaya Çıktı)

`HarvestScreen`'in (Bakım'ın deseni) **görünür bir "Back" butonu olmadığı** keşfedildi — sadece donanım geri tuşuna (`addBackButtonListener`) güveniyor. İlk test denemem bunu yanlış varsaydı (görünür buton arıyordu), gerçek DOM çıktısı incelenip mevcut `backButtonListeners` simülasyon mekanizmasıyla düzeltildi.

## ÖNERİ

- Finans-Hasat entegrasyonu için **Seçenek A (Tam Ayrım, bugünkü durum)** ile devam edilmesi, Dashboard modülü (Sprint 8.4) geliştirilirken gerçek kullanıcı ihtiyacı görülürse **Seçenek B**'nin yeniden değerlendirilmesi.
- Roadmap'in bir sonraki adımı: Sprint 8.4 (Dashboard).

## VARSAYIM

Hiçbiri. `treeRepository.create`'in `parcelId`'yi referans ağaçlar için de zorunlu kıldığı (`NewTreeInput` tipinden) gerçekten okunarak doğrulandı — ilk test taslağımda bunu varsaymıştım, tip hatası aldım, gerçek dosyayı okuyup düzelttim.

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Repository Pattern bozulmadı | ✅ — Bu sprintte hiçbir repository değişmedi |
| Offline First bozulmadı | ✅ |
| Soft Delete korundu | ✅ — Dokunulmadı |
| SQLite şeması keyfi değişmedi | ✅ — Bu sprintte hiçbir migration yok |
| Kod tekrarından kaçınıldı | ✅ — `useTreeForRoute` yeniden kullanıldı, yeni hook YOK |
| Mevcut ortak bileşenler kullanıldı | ✅ — Bakım'ın route wrapper/prop deseni birebir tekrarlandı |
| Sprint 8.1/8.2 mimarisi değişmedi | ✅ — Repository/Hook/Form/Screen dosyalarının hiçbiri değişmedi |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: Navigasyon entegrasyonu, Sprint 5.3'ün birebir tekrarı — yeni mimari karar yok. Finans-Hasat entegrasyonu için **henüz kesin bir karar alınmadı** (sadece seçenekler sunuldu) — kullanıcı bir seçenek onayladığında, o zaman gerçek bir ADR yazılabilir.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (525/525, +7), bundle boyutu (+8.91kB) ve commit hash (`90e649b`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Modül 7 (Hasat) artık **tam işlevsel ve kullanıcı tarafından erişilebilir** — Parsel/Ağaç/Referans Ağaç ekranlarından "View Harvest" ile ulaşılabiliyor, kayıtlar doğru bağlamda oluşuyor (test edildi). Finans entegrasyonu bilinçli olarak **tasarım aşamasında** bırakıldı, kod yazılmadı.
