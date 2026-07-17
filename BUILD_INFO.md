# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 5 — Bakım Yönetimi (Maintenance Management) |
| **Sprint** | 5.5 |
| **Feature** | Yaklaşan/Geciken Bakımlar Görünümü (Upcoming/Overdue Maintenance) |
| **Test Sonucu** | ✅ 347/347 başarılı (15 yeni) |
| **Build** | ✅ Başarılı (`dist/assets/index-dFIce3dp.js`, 389.36 kB) |
| **Lint** | ✅ 0 uyarı / 0 hata (131 dosya, 103 kural) |
| **Cap Sync** | ✅ Başarılı (8 native plugin, değişmedi) |
| **Tarih** | 2026-07-17 |
| **Git Commit** | `6ff1c51` |

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1 — Altyapı | ✅ FROZEN |
| Modül 2 — Parseller + Ağaçlar | ✅ FROZEN |
| Modül 3 — Gözlemler + Fotoğraflar | ✅ FROZEN |
| Modül 4 — Router + Finans | ✅ FROZEN |
| Modül 5 / Sprint 5.1 — Bakım Migration+Domain+Repository | ✅ FROZEN |
| Modül 5 / Sprint 5.2 — Bakım Hook+Form+Screen | ✅ FROZEN |
| Modül 5 / Sprint 5.3 — Bakım Navigasyon Entegrasyonu | ✅ FROZEN |
| Modül 5 / Sprint 5.4 — Bakım Planları (Tam Katman) | ✅ FROZEN |
| Modül 5 / Sprint 5.5 | 🟡 Bu teslimat — kullanıcı onayı bekliyor |

## Kısa Değişiklik Özeti

`IMaintenancePlanRepository`'ye `dueStatus` (`overdue`/`today`/`upcoming`) + `referenceDate` filtresi eklendi (repository katmanında, deterministik — `new Date()` çağıranın sorumluluğunda). `useMaintenancePlans` hook'u additive olarak genişletildi (`overduePlans`/`todayPlans`/`upcomingPlans` — mevcut `plans`/CRUD hiç değişmedi). `MaintenancePlanScreen`, planları 3 kategori bölümü halinde gösterecek şekilde güncellendi; kodlama sırasında gerçek bir UX/test çakışması bulunup düzeltildi (aynı planın iki bölümde birden görünmesi önlendi). Push/Local Notification, Calendar Sync, Cron, RRULE, AI eklenmedi — Blueprint'e tam sadakat. Navigasyon (route bağlama) bu sprintin kapsamı dışında bırakıldı.
