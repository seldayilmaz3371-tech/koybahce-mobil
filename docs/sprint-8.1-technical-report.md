# Sprint 8.1 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Hasat (Harvest) Modülü — Migration + Domain + Repository

## Yol Haritası Kararı

Beta APK'nın imzalanması kullanıcının kendi ortamında bekliyor (Sprint 7.5). Bu, GERÇEK modül geliştirmesini engellemiyor — `docs/roadmap/01-current-state-and-roadmap.md`'nin sıralamasına göre, bir sonraki mantıklı adım **Sprint 8.1 (Hasat)** idi. Bu karar, kullanıcıya sunulup onay beklenmeden, roadmap'in kendi mantığıyla gerekçelendirilerek başlatıldı.

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

- Şema Sürüm 11: `harvest_records` tablosu (`android/app/build.gradle` DEĞİL, `src/data/db/migrations/schema.ts` — bir SQLite migration'ı).
- `src/modules/harvest/domain/harvest.types.ts` — `HarvestRecord`, `NewHarvestRecordInput`, `HarvestRecordUpdateInput`.
- `src/modules/harvest/data/harvest.repository.interface.ts` + `harvest.repository.ts` — dual-scope (`listByParcel`/`listByTree`), CRUD, soft-delete.
- 16 yeni test (12 repository, 4 migration) — **gerçekten çalıştırıldı**, hepsi geçti.
- `npx tsc -b`, `npm run test`, `npm run lint`, `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**, çıktıları bu mesajda ve `BUILD_INFO.md`'de gösterildi.

## ÖNERİ (Bu Rapor Tarafından Önerilen, Henüz Yapılmayan)

- Sprint 8.2: Hook + Form + Screen.
- Sprint 8.3: Navigasyon entegrasyonu + Hasat'ın Finans'a "gelir" olarak nasıl bağlanacağına dair AYRI bir tasarım kararı (roadmap'in kendi notu — bu, basit bir navigasyon eklemesi değil, gerçek bir analiz gerektiriyor).

## VARSAYIM (Bu Sprintte YAPILMAYAN, Ama Bilinmesi Gereken)

- `parcels` tablosunun `crop_type` CHECK kısıtının (`'olive','vegetable','fruit'`) bu sprintte DEĞİŞMEDİĞİ varsayıldı — gerçek dosyadan doğrulandı, varsayılmadı.
- Hiçbir varsayım YAPILMADI bu sprintte — her SQL sütun adı (`parcels.name`, `.crop_type`, `.area_dekar`) gerçek `schema.ts` dosyasından okunarak doğrulandı.

## ADR Kararı

**Bu sprint için YENİ bir ADR yazılmadı.** Gerekçe: Hasat modülü, mevcut Bakım/Finans/Gözlem repository desenlerinin (dual-scope, soft-delete, additive migration) **birebir tekrarı** — hiçbir yeni mimari karar alınmadı. Kullanıcının kuralı ("ADR gerekmiyorsa numara tüketme") burada bilinçli olarak uygulandı.

## BUILD_INFO ile Çelişki Kontrolü

Bu raporda belirtilen test sayısı (499/499, +16 yeni), bundle boyutu (+0.75kB) ve commit hash (`1353f3a`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Sprint 8.1, saf bir veri katmanı sprintiydi (Migration+Domain+Repository) — Sprint 5.1'in (Bakım Kaydı) kanıtlanmış aşamalı yaklaşımıyla tutarlı. UI katmanı (Hook/Form/Screen) kasıtlı olarak Sprint 8.2'ye bırakıldı.
