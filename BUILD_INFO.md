# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Ayarlar Hub — Bildirimler (Bakım Hatırlatmaları) |
| **Sprint** | 10.19 |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 846/846 başarılı (+10 yeni bu turda, +34 önceden yazılmış doğrulandı) — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (255 dosya) |
| **Cap Sync** | ✅ Başarılı (12 native plugin, `@capacitor/local-notifications` eklendi) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi) |
| **Tarih** | 2026-07-23 |
| **Git Commit** | `71f088e` |

## Kapsam Kararı

SADECE bakım hatırlatmaları — `maintenance_plans.next_due_date` tabanlı, tamamen cihaz üzerinde zamanlanan yerel bildirimler. Sunucu tarafı push bildirim sistemi yok (offline-first ilkesiyle tutarlı).

## Önemli Not

Bu işin bir kısmı (native katman) bu session içinde daha önce yazılmış ama hiç commit edilmemişti — working tree'de bulundu, doğrulandı, üzerine inşa edilerek tamamlandı.

## Gerçek Bulgu

`AndroidManifest.xml`'de `POST_NOTIFICATIONS` izni eksikti — `targetSdkVersion=36` (Android 13+) için resmi olarak zorunlu (developer.android.com'dan doğrulandı). Eklendi.

## Mimari Karar

`Schedule.repeats: true` kullanılmıyor — bir bakım tamamlandığında `next_due_date` güncellenir, bu yüzden sabit aralıklı tekrarlama yanlış olurdu. Her plan için tek seferlik bir bildirim zamanlanır, planlar değiştiğinde tümü iptal edilip güncel veriyle yeniden zamanlanır.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-10, Veri Yönetimi, Dil, Bildirimler | ✅ Onaylandı |
| Modül 6 — AI | 🟢 Feature Freeze (bakım modu) — kullanıcı kararı |
