# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 10 — Saha Operasyonları (Toplu İşlemler) |
| **Sprint** | 10.2 |
| **Feature** | Toplu İşlemler UI — Ağaç Seçim Sistemi + Formlar + Geri Al |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 596/596 başarılı (+26 yeni) — **gerçekten çalıştırıldı** |
| **Build** | ✅ Başarılı — ana bundle 415.03kB → 416.97kB (+1.94kB, makul) |
| **Lint** | ✅ 0 uyarı/hata (219 dosya, 103 kural) — **gerçekten çalıştırıldı** |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) — **gerçekten çalıştırıldı** |
| **Şema Sürümü** | 11 (değişmedi — bu sprint hiçbir migration içermiyor) |
| **Tarih** | 2026-07-18 |
| **Git Commit** | `19677c8` |
| **ADR** | Yeni ADR yazılmadı — "Biçme" kararı ve Geri Al mimarisi mevcut desenlerin genişletmesi, gerçek bir yeni mimari kategori değil |

## Kritik Mimari Karar — "Biçme"

`MaintenanceType` enum'unda ne TS'te ne SQLite `CHECK` kısıtında "mowing" değeri yok. SQLite'ta `CHECK` kısıtı değiştirmek tablo yeniden oluşturmayı gerektirir (gerçek risk). **Karar:** "Biçme" kullanıcıya seçenek olarak gösteriliyor, arka planda `maintenanceType: "other"` kaydediliyor — hiçbir migration gerekmedi (testte doğrulandı).

## Geri Al (Undo)

Mimari olarak uygun bulundu — mevcut soft-delete deseni (`deactivateMany()`) yeterli.

## Bilinen Riskler (Gerçek Cihazda Doğrulanmalı)

- `TreeSelectorList` sanallaştırma içermiyor (500 satır tamamen DOM'a render ediliyor).
- `runInTransaction()`'ın ANR riski gerçek cihazda doğrulanmadı.
- Test planı hazır (`docs/sprint-10.2-device-performance-test-plan.md`) ama **çalıştırılmadı**.

## Sonraki Adım

Sprint 10.3: Navigasyon entegrasyonu + gerçek cihaz performans testlerinin çalıştırılması.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-5 | ✅ FROZEN |
| Sprint 6-10.1 | ✅ Onaylandı |
| Modül 7 — Hasat | ✅ Onaylandı |
| Modül 8 — Dashboard | ✅ Onaylandı |
| Modül 9 — Fotoğraf Analizi (ilk akış) | ✅ Onaylandı |
| Modül 10 — Saha Operasyonları (UI) | 🟡 Bu teslimat |
