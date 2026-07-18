# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 7 — Hasat (Harvest) |
| **Sprint** | 8.2 |
| **Feature** | Hook + Form + Screen (UI katmanı) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 518/518 başarılı (+19 yeni — 8 hook + 6 form + 5 screen) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 396.57kB → 397.52kB (+0.95kB, makul) |
| **Lint** | ✅ 0 uyarı/hata (197 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (değişmedi — bu sprint sadece UI) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `c60d752` |
| **ADR** | Yeni ADR gerekmedi — Bakım Kaydı'nın (Sprint 5.2) birebir tekrarı, yeni mimari karar YOK |

## Bu Sprintte Yapılanlar (Gerçek, Kanıtlı)

`useHarvestRecords` (dual-scope hook), `HarvestRecordForm` (gerçek zorunlu alan doğrulaması — Bakım'ın aksine), `HarvestScreen` (liste/form geçişleri, Error Code Standard). `harvest.*` i18n anahtarları eklendi, `keySymmetry` testi gerçekten çalıştırılıp doğrulandı.

## Sonraki Sprint

Sprint 8.3: Parsel/Ağaç navigasyon entegrasyonu + Finans'a "hasat geliri" bağlantısı tasarım kararı.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-8.1 | ✅ Onaylandı |
| Modül 7 — Hasat, Sprint 8.2 | 🟡 Bu teslimat (UI katmanı) |
