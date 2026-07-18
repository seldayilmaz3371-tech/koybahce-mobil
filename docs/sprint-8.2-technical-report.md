# Sprint 8.2 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Hasat (Harvest) Modülü — Hook + Form + Screen

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

- `src/modules/harvest/hooks/useHarvestRecords.ts` — `useMaintenanceRecords` ile birebir aynı dual-scope/sayfalama deseni.
- `src/modules/harvest/HarvestRecordForm.tsx` — gerçek zorunlu alan doğrulaması (`harvestDate`, `quantityKg > 0`), mevcut `NumberField`/`DateField`/`TextAreaField`/`FormError` paylaşılan bileşenleri kullanıldı.
- `src/modules/harvest/HarvestScreen.tsx` + `components/HarvestRecordCard.tsx`/`HarvestRecordList.tsx` — `MaintenanceScreen` ile birebir aynı desen.
- `harvest.*` i18n anahtarları EN/TR dosyalarına eklendi.
- 19 yeni test (8 hook, 6 form, 5 screen) — **gerçekten çalıştırıldı**, hepsi geçti.
- `npx tsc -b`, `npm run test` (518/518), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## ÖNERİ

- Sprint 8.3: Parsel/Ağaç ekranlarına navigasyon entegrasyonu (Sprint 5.3'ün deseni) + Hasat'ın Finans'a "gelir" olarak nasıl bağlanacağına dair AYRI bir tasarım kararı.

## VARSAYIM

- Hiçbiri. `NumberField`/`DateField` bileşenlerinin gerçek prop imzaları (`required`, `step`) kod dosyalarından okunarak doğrulandı, varsayılmadı.

## Mimari Sadakat Kontrolü (Kullanıcının Zorunlu Kuralları)

| Kural | Durum |
|---|---|
| Repository Pattern bozulmadı | ✅ — Hook, repository'yi DOĞRUDAN çağırmıyor, `HarvestScreen` sadece Hook kullanıyor |
| Offline First bozulmadı | ✅ — Hiçbir ağ çağrısı yok, tamamen SQLite üzerinden |
| Soft Delete korundu | ✅ — `deactivateRecord`, Bakım/Finans ile aynı desen |
| Migration mantığı değişmedi | ✅ — Bu sprintte migration'a HİÇ dokunulmadı |
| SQLite şeması keyfi değişmedi | ✅ — Şema Sürüm 11'den beri değişmedi |
| Repository katmanı dışında yeni mimari üretilmedi | ✅ — Sadece Hook/Form/Screen (UI katmanı), hiçbir yeni repository metodu eklenmedi |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: Bu sprint, Sprint 5.2'nin (Bakım Kaydı UI) desenini birebir tekrarladı — hiçbir yeni mimari karar alınmadı. `harvestDate`/`quantityKg`'ın "gerçek zorunlu alan" olması bir mimari karar değil, DB şemasının (`NOT NULL`) doğal bir yansıması.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (518/518, +19), bundle boyutu (+0.95kB) ve commit hash (`c60d752`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Sprint 8.2, Hasat modülünün UI katmanını tamamladı. Ekran henüz hiçbir rotaya bağlı değil (Bakım'ın Sprint 5.2→5.3 aşamalı yaklaşımıyla tutarlı) — Sprint 8.3'te navigasyon eklenecek.
