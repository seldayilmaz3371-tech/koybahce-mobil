# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 8 — Dashboard |
| **Sprint** | 8.4 |
| **Feature** | Hook + Screen (özet ekranı) |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 534/534 başarılı (+9 yeni — 6 hook + 3 screen) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 406.43kB → 407.00kB (+0.57kB, ekran henüz navigasyona bağlı değil) |
| **Lint** | ✅ 0 uyarı/hata (201 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (değişmedi — bu sprint hiçbir migration/repository içermiyor) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `1ce38d8` |
| **ADR** | Yeni ADR gerekmedi — mevcut repository'lerin Hook seviyesinde birleştirilmesi, yeni mimari kategori YOK |

## Bu Sprintte Yapılanlar (Gerçek, Kanıtlı)

`useDashboardSummary` — hiçbir repository'ye yeni metod eklenmeden, mevcut `listByParcel` sorgularının `Promise.all` ile paralel toplanması. `DashboardScreen` — toplam parsel/ağaç, geciken/yaklaşan bakım, son 5 gözlem, toplam hasat. **Hiçbir henüz-geliştirilmemiş modüle (Hava Durumu, Fotoğraf Analizi, Raporlar) bağlı öge yok.**

## Bilinen Sınır (Gerçek, Kayıtlı)

`parcelRepository.list()`'in varsayılan limiti (50) aşılırsa Dashboard eksik gösterir — bugün sorun değil, gerçek bir ölçek sorunu çıkarsa değerlendirilecek (YAGNI).

## Sonraki Adım

Dashboard'ın navigasyonu (yeni ana ekran mı, Parseller'e ek giriş mi) **kullanıcı kararı gerektiriyor** — App.tsx'in varsayılan rotasını etkileyebilecek bir değişiklik, tek taraflı yapılmadı.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-8.3 | ✅ Onaylandı |
| Modül 7 — Hasat (TAM İŞLEVSEL) | ✅ Onaylandı |
| Modül 8 — Dashboard (Hook+Screen) | 🟡 Bu teslimat |
