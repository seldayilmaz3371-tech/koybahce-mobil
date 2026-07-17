# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Modül 6 — AI Altyapısı |
| **Sprint** | 7.2 |
| **Feature** | UX/Erişilebilirlik/Dokümantasyon Son Kontrolleri (APK Öncesi Kalite) |
| **Test Sonucu** | ✅ 479/479 başarılı (+3 yeni — i18n simetri denetimi) |
| **Build** | ✅ Başarılı — ana bundle 395.68kB, AI chunk 346.40kB (Sprint 7.1 ölçümüyle tutarlı) |
| **Lint** | ✅ 0 uyarı / 0 hata (183 dosya, 103 kural) |
| **Cap Sync** | ✅ Başarılı (9 native plugin, değişmedi) |
| **Tarih** | 2026-07-17 |
| **Git Commit** | `aaeeb57` |
| **ADR** | [0024 — AI Architecture Decisions](docs/adr/0024-ai-architecture-decisions.md) |

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1 — Altyapı | ✅ FROZEN |
| Modül 2 — Parseller + Ağaçlar | ✅ FROZEN |
| Modül 3 — Gözlemler + Fotoğraflar | ✅ FROZEN |
| Modül 4 — Router + Finans | ✅ FROZEN |
| Modül 5 — Bakım Yönetimi | ✅ FROZEN |
| Sprint 6 — AI Altyapısı (kod) | ✅ Onaylandı |
| Sprint 7.1 — Navigasyon + Bundle Optimizasyonu | ✅ Onaylandı |
| Sprint 7.2 — UX/Kalite Son Kontrolleri | 🟡 Bu teslimat |

## Kısa Değişiklik Özeti

Gerçek bulgularla yönlendirilen 6 kalite iyileştirmesi: (1) i18n EN/TR simetri denetimi eklendi (30+ sprintlik manuel disiplinin otomatik güvenceye kavuşması), (2) `engineering-protocol.md` Bölüm 21 güncellendi (v1.12, `useTreeForRoute`'un gerçekleştiğini yansıtıyor), (3) `AiChatScreen`'e otomatik kaydırma eklendi (gerçek UX sorunu), (4) mesaj listesine `aria-live` eklendi (gerçek erişilebilirlik boşluğu), (5) `.status-screen`'e responsive `max-width` eklendi (geniş ekranlı Android tabletler için), (6) `module-status.md`/APK test planı Sprint 7.1'in tamamlandığını yansıtacak şekilde güncellendi. Kod davranışı DEĞİŞMEDİ (CSS-only + erişilebilirlik ekleri), bundle boyutu ETKİLENMEDİ.

**Yeni belge:** `docs/apk-beta-readiness-checklist.md` — imzalama yapılandırması eksikliği ve versiyon numarası kararlarının APK üretimi öncesi kullanıcı onayı gerektirdiğini kayıt altına alıyor.
