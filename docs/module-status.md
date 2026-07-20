# Modül Durumu Takibi

Bu belge, Engineering Protocol Bölüm 10'daki (Test Kapısı) yaşam döngüsünün her modül için resmi kaydını tutar:

```
Kod Yazılıyor → Kod Hazır → Gerçek Android Testi Bekleniyor → Test Başarılı → Modül Tamamlandı
```

## Genel Özet (Güncel)

| Modül | Kapsam | Durum |
|---|---|---|
| 1 | Altyapı | ✅ Resmen kapandı |
| 2 | Parseller + Ağaçlar | ✅ Resmen tamamlandı (v0.2.0) |
| 3 | Gözlemler + Fotoğraflar + Toplu Ağaç | ✅ Resmen tamamlandı (v0.3.0) |
| 4 | Router Migration + Finans | ✅ Resmen tamamlandı (ACCEPTED/FROZEN/PRODUCTION READY) |
| 5 | Bakım Yönetimi (Kayıt + Plan + Navigasyon + Görünüm) | ✅ Resmen tamamlandı (Sprint 5.1-5.5, FROZEN) |
| 6 | AI Altyapısı (Provider/Tool/Context Engine/Sohbet) | 🟡 Kodlama/Mimari/Testler/Dokümantasyon tamamlandı — APK Testi ve Gerçek Cihaz Doğrulaması bekleniyor, **Production Ready DEĞİL** |
| 7 | Hasat (Harvest) | ✅ Tam işlevsel — kullanıcı tarafından erişilebilir (Sprint 8.3) |
| 8 | Dashboard | ✅ Tam işlevsel — buton girişli alt ekran, ana ekran DEĞİL (Sprint 8.5) |
| 9 | Fotoğraf Analizi (AI) | 🟡 Sprint 9.2 (ilk çalışan akış) tamamlandı — Navigasyon bekliyor |
| 10 | Saha Operasyonları (Toplu İşlemler) | 🟡 Sprint 10.1 (Repository katmanı) tamamlandı — **Product Owner kararıyla yeni en yüksek öncelik** |
| 11+ | Hava Durumu/Harita/Sesli Asistan/RAG/Ayarlar/Raporlar/Finans+Hasat İşletme-Seviyesi Revizyonu | ⚪ Henüz başlamadı |

---

## Modül 1 — Altyapı

**Durum: ✅ RESMEN KAPANDI (Kullanıcı Kabul Raporu, 2026-07-15)**
**Tamamlanma tarihi:** 2026-07-14 · **Nihai kabul:** 2026-07-15

### Nihai Kabul Testi (Tam Kapsam)
Kullanıcının resmi kabul raporunda doğrulanan tam liste: Android Studio/Capacitor kurulumu, `npm install`/`build`/`cap sync`, APK üretimi + kurulumu + **güncelleme kurulumu**, SQLite, şifreli veritabanı, Secure Storage, Preferences, Biometric Authentication, Device Plugin, GitHub push.

**Dil sistemi — tam döngü doğrulaması:** TR → EN → TR geçişi, her adımda uygulamanın **tamamen** ilgili dilde açıldığı gerçek cihazda teyit edildi. Bu, ADR 0020/0021'in (native Device sorgusu + kalıntı veri temizliği) nihai, kesin kanıtıdır — "doğrulama bekleniyor" durumu artık geçerli değil.

### Dondurma Kuralı (Değişmedi)
Yeni özellik eklenmeyecek. Sadece kritik güvenlik açığı/hata durumunda düzeltme yapılacak.

### Kapsam
Şifreli SQLite bağlantısı, migration sistemi, biyometrik/PIN kilit ekranı, güvenli depolama (Keystore), i18n/Globalization mimarisi, marka yapılandırması.

### Bu Süreçte Bulunan ve Düzeltilen Kritik Sorunlar
1. Android Auto Backup + Keystore çakışması (ADR 0010)
2. Dil tercihi kalıcılığı tasarım hatası (ADR 0015)
3. `navigator.language` Android WebView güvenilirlik sorunu (ADR 0020)
4. Kalıntı dil tercihi verisi (ADR 0021)

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-14)
Modül 1'e **yeni özellik eklenmeyecek**. Yalnızca **kritik güvenlik açığı veya kritik hata** bulunursa düzeltme yapılacak — bu durumda yeni bir ADR ile belgelenip, bu belgedeki durum geçici olarak "Kritik Düzeltme Uygulanıyor" olarak güncellenecek, düzeltme sonrası tekrar "Completed"e dönecek.

---

## Modül 2 — Parseller ve Ağaçlar

**Durum: ✅ RESMEN TAMAMLANDI** (Kullanıcı Kabul Raporu, 2026-07-15 — gerçek Android cihaz testi, tüm kriterler karşılandı)

### Kapsam
Parsel ve Ağaç: tam CRUD, arama/sıralama/sayfalama (Parsel), Reference/Parcel Mode (Ağaç), Parsel↔Ağaç navigasyonu, Android fiziksel geri tuşu, Error Code Standard (temel altyapı), ADR 0022 (foreign key) düzeltmesi.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 2.1 | TreeRepository + testler | ✅ Kullanıcı tarafından kabul edildi |
| 2.2 | useTrees hook (Parcel/Reference Mode) | ✅ Kullanıcı tarafından kabul edildi |
| 2.3 | TreeForm + CheckboxField + native validation düzeltmesi | ✅ Kullanıcı tarafından kabul edildi |
| 2.4 | TreesScreen (listeleme) | ✅ Kullanıcı tarafından kabul edildi |
| 2.5 | TreeForm/TreesScreen entegrasyonu, Parcel→Trees navigasyonu, CRUD | ✅ Kullanıcı tarafından kabul edildi |
| 2.6 | Android geri tuşu, ADR 0022 düzeltmesi, Error Code Standard | ✅ Kullanıcı tarafından kabul edildi |

### Test Kapsamı
58 otomatik test (Vitest): 9 Parcel repo + 12 Tree repo + 8 useTrees hook + 7 TreeForm + 12 TreesScreen (CRUD+geri tuşu dahil) + 5 ParcelsScreen (navigasyon+geri tuşu) + 5 mapSqliteError.

### Bilinen Teknik Borçlar (Modül 2 Kapanışında)
- ~~Fotoğraf↔Gözlem ilişkisi tasarım kararı~~ — ✅ Modül 3'te çözüldü (Seçenek B)
- ~~Error Code Standard'ın UI katmanında tüketilmemesi~~ — ✅ Modül 4'te (Sprint 4.2/4.3.1) tüm ekranlara genişletildi

### Sonraki Adım
Kullanıcının gerçek Android cihaz kabul testi → Git Tag (v0.2.0) → Modül 2 resmi kabulü.

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-15)
Modül 2'ye **yeni özellik eklenmeyecek**. Yalnızca **kritik güvenlik açığı veya kritik hata** bulunursa düzeltme yapılacak (Modül 1'deki aynı kural).

---

## Modül 3 — Gözlemler ve Fotoğraflar

**Durum: ✅ RESMEN TAMAMLANDI** (Kullanıcı Kabul Raporu — gerçek Android cihaz testi, tüm kriterler karşılandı; ardından Sprint 3.10.1'de bir P0/P1 gerçek cihaz hotfix'i uygulanıp yeniden doğrulandı)

### Kapsam
Gözlem (5 tür: general/health_concern/growth_stage/weather_impact/other) tam CRUD, Fotoğraf (Kamera/Galeri, önizleme, kalıcı depolama, silme), Toplu Ağaç Oluşturma (Sprint 3.10 — `runInTransaction()`'ın ilk gerçek kullanımı), Parsel→Ağaç→Gözlem→Fotoğraf tam navigasyon zinciri.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 3.1 | Observation Domain Review + ObservationRepository + Şema Sürüm 4 | ✅ Kabul edildi |
| 3.2 | useObservations hook (dual-scope + sayfalama) | ✅ Kabul edildi |
| 3.3 | ObservationForm (0 zorunlu alan — Minimum Dokunuş İlkesi) | ✅ Kabul edildi |
| 3.4 | ObservationScreen (listeleme, ObservationCard) | ✅ Kabul edildi |
| 3.5 | Ağaç→Gözlem navigasyonu, contextLabel, geri tuşu | ✅ Kabul edildi |
| 3.6 | PhotoRepository + Şema Sürüm 5 (AI yok) | ✅ Kabul edildi |
| 3.7 | Photo Screen — Kamera/Galeri/Önizleme/Silme, kalıcı depolama | ✅ Kabul edildi |
| 3.8 | Observation↔Photo ilişkisi doğrulaması (kod değişikliği gerekmedi) | ✅ Kabul edildi |
| 3.9 | Modül 3 E2E Kabul Testi (Golden Path) + 5 kapanış belgesi | ✅ Kabul edildi |
| 3.10 | Toplu Ağaç Oluşturma (Bulk Tree Creation) | ✅ Kabul edildi |
| 3.10.1 | **P0/P1 Gerçek Cihaz Hotfix** — "Already in transaction" (transaction parametresi) + fotoğraf render (`convertFileSrc`) | ✅ Kabul edildi |

### Test Kapsamı (Modül 3 Kapanışında)
156 otomatik test — Observation/Photo repository+hook+form+screen, Golden Path E2E, Referans Ağaç+geri tuşu zinciri, statik mimari uyumluluk (offline-first, soft-delete-only).

### Bilinen Teknik Borçlar (Modül 3 Kapanışında)
- Fotoğraf galerisinde thumbnail yok (tam çözünürlük) — Sprint 4.3.1'de kısmen ele alındı (`loading="lazy"` eklendi, gerçek thumbnail üretimi hâlâ yok)
- `isSubmitting` yarış durumu sadece Photo'da düzeltilmişti — Sprint 4.2'de Finans'a da baştan uygulandı, Parcel/Tree/Observation formlarında hâlâ teorik risk
- Router eksikliği (bu noktada kritik önceliğe çıkmıştı) — ✅ Modül 4'te çözüldü

### Sprint 9.1 Notu (2026-07-18) — Fotoğraf Analizi Altyapısı
Sprint 9.1'in kod öncesi analizi, buradaki `IPhotoRepository`/`native/filesystem.ts`/`photos` şemasının **gelecekteki AI Fotoğraf Analizi için zaten yeterli ve olgun** olduğunu kanıtladı (bkz. `docs/sprint-9.1-photo-infrastructure-analysis.md`). Kronolojik sıralama (`taken_at ASC`) zaten bu amaçla tasarlanmıştı. **Eksik olan tek şey** — AI analiz sonucunun nereye kaydedileceği — `docs/photo-ai-analysis-data-model-design.md`'de 3 seçenekli bir tasarım olarak (kod yazılmadan) belgelendi.

### Dondurma Kuralı
Modül 3'e **yeni özellik eklenmeyecek**. Yalnızca **kritik güvenlik açığı veya kritik hata** bulunursa düzeltme yapılacak (Sprint 3.10.1 bu kural altında uygulandı).

---

## Modül 4 — Router Migration ve Finans

**Durum: ✅ RESMEN KABUL EDİLDİ — ACCEPTED / FROZEN / COMPLETED / PRODUCTION READY** (2026-07-16, kullanıcı resmi kabul kararı)

**Gerçek Cihaz Doğrulaması: PASSED** — P0-001 (Kamera Intent + LockScreen regresyonu) dahil, aşağıdaki senaryoların tamamı gerçek Android cihazda doğrulandı:
✅ Kamera ile fotoğraf çekme · ✅ Galeriden fotoğraf seçme · ✅ Önizleme ekranı · ✅ Native Camera dönüşü · ✅ App Lock davranışı · ✅ Android Back davranışı · ✅ Offline çalışma · ✅ Fotoğraf kaybı problemi tamamen giderildi · ✅ Regresyon oluşmadı

**Regresyon Testleri: PASSED** — 222/222
**Engineering Review: PASSED**

### Kapsam
Tüm üst-düzey navigasyonun `react-router` (HashRouter) tabanlı gerçek bir router'a taşınması (view-state prop-threading'den geçiş) + Finans modülü (sadece `cost`/`sale`, kuruş cinsinden `INTEGER` tutar saklama, `record_date` formda görünür/düzenlenebilir).

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 4.0 | Ön analiz + Router Migration mimari onayı | ✅ Onaylandı |
| 4.0.1 | Router Migration — tüm 5 üst-düzey rota (Seçenek A, tek seferde) | ✅ Onaylandı |
| 4.1 | Finans — Migration (Şema Sürüm 6) + Domain + Repository | ✅ Onaylandı |
| 4.2 | Finans — Hook + Form + Screen (Error Code Standard'ın ilk UI tüketimi) | ✅ Onaylandı |
| 4.3 | Finans Router entegrasyonu (Parsel→Finans navigasyonu) | ✅ Onaylandı |
| 4.3.1 | **Bağımsız Mimari Denetim** + P1 düzeltmeleri: para birimi (Şema Sürüm 7, `amount_minor INTEGER`), arka plan yeniden kilitleme, Error Code Standard'ın 4 ekrana genişletilmesi | ✅ Onaylandı |
| 4.3.2 | **P0-001 Hotfix** — Kamera Intent + LockScreen regresyonu (`isCapturingPhoto()` bayrağı) | Kod tamamlandı — **gerçek cihaz doğrulaması bekleniyor** |

### Test Kapsamı (Güncel)
**222 otomatik test.**

### Bilinen Teknik Borçlar (Modül 4 Bağımsız Denetiminde Bulunan, Bilinçli Ertelenen)
- Liste virtualization yok (P2 — gerçek performans şikayeti olmadan erken optimizasyon olurdu)
- `AppRouter.tsx`'teki `treeRepository`'ye doğrudan erişim — değerlendirildi, **gerekçelendirilerek korundu** (`engineering-protocol.md` Bölüm 21)
- 4 modülde tekrarlanan List bileşen deseni (`EntityList<T>` soyutlaması yok) — YAGNI gerekçesiyle ertelendi
- `AppRouter.tsx`'teki inline fonksiyonlarda `useCallback` yok — ölçülebilir etkisi yok, erken optimizasyon olurdu

### Sonraki Adım
✅ Tamamlandı — Git Tag (v0.4.0) kullanıcı tarafından uygun görüldüğünde manuel olarak uygulanabilir (öneri: `docs/git-tag-v0.2.0.md`/`v0.3.0.md` ile aynı desen).

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-16)
Modül 4 **kalıcı olarak donduruldu**. Bundan sonra: yeni özellik eklenmeyecek, refactor yapılmayacak, mimari değiştirilmeyecek. Sadece **kritik güvenlik açığı** veya **kritik üretim hatası** bulunursa, yeni bir ADR açılarak yeniden aktif hale getirilebilir (Modül 1-3 ile aynı kural).

---

## Modül 5 — Bakım Yönetimi (Maintenance Management)

**Durum: ✅ RESMEN TAMAMLANDI** (Sprint 5.1-5.5, FROZEN)

### Kapsam
Bakım Kayıtları (7 tür, audit-log'lu durum geçişi) + Bakım Planları (basit `interval_days`, RRULE/Cron yok — bilinçli YAGNI) + Parsel/Ağaç/Referans Ağaç navigasyon entegrasyonu + Yaklaşan/Geciken/Bugün görünümü.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 5.1 | Migration (Şema Sürüm 8) + Domain + Repository (audit log, gerçek transaction rollback kanıtı) | ✅ Kabul edildi |
| 5.2 | Hook + Form + Screen (Finance deseni birebir tekrarlandı) | ✅ Kabul edildi |
| 5.3 | Navigasyon Entegrasyonu (Parsel/Ağaç/Referans Ağaç → Bakım) | ✅ Kabul edildi |
| 5.4 | Bakım Planları — Tam Katman (Şema Sürüm 9) | ✅ Kabul edildi |
| 5.5 | Yaklaşan/Geciken/Bugün Görünümü (`dueStatus` filtresi) | ✅ Kabul edildi |

### Test Kapsamı (Kapanışta)
**347 otomatik test.**

### Bilinen Teknik Borçlar
- `TreeMaintenanceScreenRoute`, `ObservationScreenRoute`'un "Tree fetch" desenini 2. kez tekrarlıyor — `engineering-protocol.md` Bölüm 21'in önceden öngördüğü eşik gerçekleşti, bilinçli olarak ertelendi (Sprint 5.4+ için `useTreeForRoute` hook'u önerisi kayıtlı).

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-17)
Modül 5 **kalıcı olarak donduruldu**. Sadece kritik güvenlik açığı/üretim hatası bulunursa yeniden aktif hale getirilebilir.

---

## Modül 6 — AI Altyapısı

**Durum: 🟡 KOD+NAVİGASYON+MOBİL UX TAMAMLANDI, GERÇEK CİHAZDA KISMEN DOĞRULANDI — Production Ready DEĞİL** (kullanıcı kararı, 2026-07-18)

| Alan | Durum |
|---|---|
| Kodlama | ✅ Tamamlandı |
| Mimari | ✅ Tamamlandı (ADR 0024) |
| Testler | ✅ Tamamlandı (484/484) |
| Dokümantasyon | ✅ Tamamlandı (ADR 0024/0025, BUILD_INFO.md, APK Test Planı) |
| Navigasyon Entegrasyonu | ✅ Tamamlandı (Sprint 7.1) |
| Bundle Optimizasyonu | ✅ Tamamlandı (Sprint 7.1 — ana bundle 744kB→396kB, ölçüldü) |
| Mobil UX (Sohbet balonları, textarea, klavye) | ✅ Tamamlandı (Sprint 7.3) |
| AI Davranış Doğrulaması (kod seviyesi) | ✅ Tamamlandı (Sprint 7.3) |
| Beta Versiyon Numaraları | ✅ Uygulandı (Sprint 7.4 — `0.1.0-beta.1`) |
| Gerçek Cihaz İlk Doğrulama | ✅ Tamamlandı (Sprint 7.2 onayında — açılış/parsel/SQLite/AI Ayarları/Secure Storage/AI ekranı/galeri) |
| Gerçek Cihaz TAM Doğrulama (zorunlu test seti) | 🔴 **Bekleniyor** (bkz. `sprint-7.4-release-readiness-report.md`) |
| **İmzalama (Keystore)** | 🟡 **Mimari belgelendi (ADR 0026, Sprint 7.5) — gerçek keystore kullanıcının kendi ortamında oluşturulmayı bekliyor, Beta Release'in TEK kritik engeli** |
| APK Testi (imzalı, dağıtılabilir) | 🔴 Bekleniyor |
| Production Ready | 🔴 **Henüz değil** |

### Kapsam
AI Ayarları (güvenli varsayılanlar) + Provider Registry (Gemini) + Tool Registry (5 salt-okunur araç) + Context Engine (anahtar kelime tabanlı) + Konuşma Depolama + Salt-Okunur Sohbet. Fotoğraf Analizi/Sesli Asistan/RAG/Embedding/AI Agent/Workflow/Yazma Araçları/Çoklu Sağlayıcı **bilinçli olarak kapsam dışı**.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 6 | AI Altyapısı — Provider/Tool Registry, Context Engine, Sohbet (ADR 0024) | ✅ Kod tamamlandı |
| 7.1 | Gerçek navigasyon entegrasyonu (`/settings`, `/settings/ai`, `/ai/chat`, parsel/ağaç-bağlamlı) + `React.lazy` bundle optimizasyonu + `useTreeForRoute` soyutlaması | ✅ Onaylandı |
| 7.2 | APK/Beta hazırlığı — UX/erişilebilirlik/dokümantasyon son kontrolleri | ✅ Onaylandı, **gerçek cihazda doğrulandı** |
| 7.3 | AI Asistan mobil UX (sohbet balonları/textarea/klavye) + AI davranış doğrulaması (kod seviyesi) + Beta/Release öneri belgeleri (ADR 0025 taslak) | ✅ Onaylandı |
| 7.4 | Beta versiyon altyapısı — `versionCode`/`versionName`/`package.json` gerçekten güncellendi | ✅ Onaylandı |
| 7.5 | Release Signing mimarisi belgeleri (ADR 0026, Rehber, Checklist, Dağıtım Stratejisi) — SAF dokümantasyon, kod değişikliği yok | 🟡 Bu teslimat |

### Sonraki Adım
Sprint 7.2 sonrası: APK üretimi → Gerçek cihaz doğrulaması (bkz. `docs/sprint-6-apk-device-test-plan.md`, gerçek navigasyona göre güncellendi) → Production Ready kararı.

### Dondurma Kuralı
Henüz uygulanmıyor — modül aktif geliştirme/doğrulama aşamasında.

---

## Modül 7 — Hasat (Harvest)

**Durum: ✅ TAM İŞLEVSEL — Kullanıcı Tarafından Erişilebilir** (Sprint 8.3, 2026-07-18)

| Alan | Durum |
|---|---|
| Migration (Şema Sürüm 11) | ✅ Tamamlandı |
| Domain Tipleri | ✅ Tamamlandı |
| Repository | ✅ Tamamlandı (16 test) |
| Hook + Form + Screen | ✅ Tamamlandı (19 test) |
| Navigasyon Entegrasyonu | ✅ Tamamlandı (7 test) — Parsel/Ağaç/Referans Ağaç ekranlarından erişilebilir |
| Finans Entegrasyonu | 🟡 Sadece mimari tasarım hazır (`docs/harvest-finance-integration-design.md`) — kesin karar bekliyor |

### Kapsam
Parsel/ağaç bazlı hasat miktarı (kg) kaydı. **Finans'tan bilinçli olarak ayrı** (Modül 4 kararı, `finance.types.ts`'in kendi başlığında kayıtlı) — bu modül SADECE miktar kaydı tutar, finansal alan içermez. Bakım'ın aksine audit-log/durum geçişi YOK (YAGNI). Bakım'ın aksine `harvestDate`/`quantityKg` GERÇEK zorunlu alanlar.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 8.1 | Migration + Domain + Repository | ✅ Tamamlandı |
| 8.2 | Hook + Form + Screen | ✅ Tamamlandı |
| 8.3 | Navigasyon entegrasyonu + Finans entegrasyon tasarımı | ✅ Tamamlandı |

### Sonraki Adım
Kullanıcı, Finans entegrasyon tasarımındaki 3 seçenekten (`docs/harvest-finance-integration-design.md`) birini seçip onaylarsa, o zaman gerçek bir ADR + kod değişikliği ayrı bir sprintte yapılabilir. Roadmap'in bir sonraki adımı: Sprint 8.4 (Dashboard).

---

## Modül 8 — Dashboard

**Durum: ✅ TAM İŞLEVSEL — Kullanıcı Tarafından Erişilebilir** (Sprint 8.5, 2026-07-18)

| Alan | Durum |
|---|---|
| Hook (`useDashboardSummary`) | ✅ Tamamlandı (6 test) |
| Screen | ✅ Tamamlandı (4 test) |
| Navigasyon Entegrasyonu | ✅ Tamamlandı (3 test) — Parseller ekranından **buton ile** erişilebilir |

### Kararlaştırılan Navigasyon Yaklaşımı (Kullanıcı Kararı, 2026-07-18)
**Dashboard, ana ekran YAPILMADI** — Parseller mevcut ana ekran olarak KALDI. Gerekçe: Sprint 7.2'de gerçek cihazda test edilen "Kilit→Parseller" akışını bozma riski, saha kullanımında (Kural 15) ekstra tık maliyeti, henüz gerçek bir Beta geri bildirimi olmadan spekülatif bir değişiklik riski. Dashboard, Parseller ekranından bir buton ile erişiliyor ("Add Parcel"dan hemen sonra, en görünür konumda).

### Kapsam
Toplam parsel/ağaç sayısı, geciken/yaklaşan bakım sayısı, son 5 gözlem (tüm parseller genelinde), toplam hasat (kg). **Hava Durumu/Fotoğraf Analizi/Raporlar gibi henüz geliştirilmemiş modüllere bağlı hiçbir öge YOK** (uydurulmadı).

### Mimari Not
Hiçbir repository'ye yeni metod eklenmedi — mevcut `listByParcel` sorguları Hook seviyesinde birleştirildi. Bilinen bir ölçek sınırı var (`docs/sprint-8.4-technical-report.md`'de detaylandırıldı).

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 8.4 | Hook + Screen | ✅ Tamamlandı |
| 8.5 | Navigasyon entegrasyonu (buton girişi) | ✅ Tamamlandı |

### Sonraki Adım
Roadmap'in bir sonraki adımı: Sprint 9.1-9.2 (Fotoğraf Analizi) veya kullanıcının belirleyeceği başka bir öncelik.

---

## Modül 9 — Fotoğraf Analizi (AI)

**Durum: 🟡 İLK ÇALIŞAN AKIŞ TAMAMLANDI, NAVİGASYON BEKLİYOR** (Sprint 9.2, 2026-07-18)

| Alan | Durum |
|---|---|
| Kod öncesi mimari analizi | ✅ Tamamlandı (Sprint 9.1) — mevcut Fotoğraf altyapısının zaten yeterli olduğu kanıtlandı |
| Veri modeli tasarımı (kod yok) | ✅ Tamamlandı (Sprint 9.1) |
| `AIProvider.analyzeImage()` | ✅ Tamamlandı (16 test) — Gemini Vision, gerçek `inlineData` formatı doğrulanmış |
| `readFileAsBase64()` (Filesystem uzantısı) | ✅ Tamamlandı — mevcut `persistPhotoFile`'a dokunulmadı |
| `usePhotoAnalysis` Hook | ✅ Tamamlandı (5 test) |
| `PhotoAnalysisScreen` | ✅ Tamamlandı (4 test) |
| Navigasyon Entegrasyonu | 🔴 Bekliyor — PhotoGalleryScreen'den erişim kararı |
| Kalıcı Saklama (AI Analiz Sonucu) | ⚪ Bilinçli olarak YOK (bkz. necessity analizi aşağıda) |

### Kapsam
Tek bir fotoğrafın Gemini Vision ile "ilk çalışan akış" analizi — **teşhis YOK, tedavi önerisi YOK, karşılaştırmalı analiz YOK** (kullanıcının Sprint 9.2 açık sınırları). Sistem promptu (`photoAnalysisPrompt.ts`) bu sınırları modele açıkça yansıtıyor. Sonuç **kalıcı olarak saklanmıyor** — sadece ekran oturumunda gösteriliyor.

### Necessity Analizi (Neden Yeni Tablo/Migration/Repository YOK)
Sprint 9.1'in tasarım belgesindeki (Seçenek B — ayrı `photo_analyses` tablosu) yerine **Seçenek C** (kalıcı saklama yok) uygulandı — gerekçe: kalıcı saklamanın tek gerçek tüketicisi ("Karşılaştırmalı Fotoğraf"/"Zaman Çizelgesi") **bu sprintin açıkça kapsamı dışında** (Öncelik 10). Bu, kalıcı saklamanın bugün gerekli olmadığının kanıtıdır.

### Mimari Kod Tekrarı Önleme
`AiSessionService`'in izin kontrolü + provider alma mantığı `getActiveAiProvider()`'a çıkarıldı (davranış aynı kaldı, mevcut 8 test hâlâ geçiyor — güvenli refactor kanıtı). Fotoğraf Analizi de aynı yardımcıyı kullanıyor.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 9.1 | Kod öncesi mimari analizi + AI veri modeli tasarımı (kod yok) | ✅ Tamamlandı |
| 9.2 | Gemini Vision entegrasyonu — ilk çalışan akış | ✅ Tamamlandı |

### Sonraki Adım
PhotoGalleryScreen'den `PhotoAnalysisScreen`'e navigasyon entegrasyonu (Hasat/Dashboard'ın aşamalı yaklaşımıyla tutarlı, ayrı bir sprint).

---

## Modül 10 — Saha Operasyonları (Toplu İşlemler)

**Durum: ✅ TAM İŞLEVSEL — Kullanıcı Tarafından Erişilebilir** (Sprint 10.3, 2026-07-18) — Product Owner kararıyla yeni en yüksek öncelik

| Alan | Durum |
|---|---|
| Kod öncesi mimari analizi | ✅ Tamamlandı |
| Repository katmanı (`createMany`/`deactivateMany`) | ✅ Tamamlandı |
| Gerçek performans testi (100/250/500 ağaç, in-memory) | ✅ Tamamlandı |
| Ağaç seçim UI'ı + arama kutusu | ✅ Tamamlandı |
| Toplu Gözlem/Bakım formları (5 bakım türü tek formda) | ✅ Tamamlandı |
| Son Kullanılan İşlem hızlı erişimi | ✅ Tamamlandı — `localPreferences` ile |
| Ardışık İşlem Sihirbazı | ✅ Tamamlandı |
| Undo güvenliği (ayrı onay + net sayı) | ✅ Tamamlandı |
| Navigasyon Entegrasyonu | ✅ Tamamlandı — ParcelForm'dan buton, gerçek route |
| Filtre sistemi (Aktif/Pasif/Hasta/Sağlıklı/Genç/Yaşlı) | 🔴 Veri modeli desteklemiyor — alternatifler önerildi, kodlanmadı |
| İşlem Şablonları | 🔴 Tasarlandı, kapsam disiplini gereği ertelendi |
| Favori İşlemler | 🔴 Tasarlandı, kapsam disiplini gereği ertelendi |
| Gerçek cihaz performans testleri | 🔴 Test planı hazır, çalıştırılmadı (gerçek cihaz gerekiyor) |

### Kritik Mimari Kararlar
1. Toplu Ağaç Oluşturma zaten mevcuttu (Sprint 3.10).
2. Sulama/Gübreleme/İlaçlama/Budama/Biçme mimari olarak TEK özellik.
3. "Biçme" enum değeri yok, `other` ile temsil ediliyor.
4. Geri Al (Undo) mevcut soft-delete deseniyle mümkün, yeni mekanizma gerekmedi.
5. "Son Kullanılan İşlem" için `@capacitor/preferences` (mevcut, ADR 0011) kullanıldı — SQLite migration gerekmedi.

### Bağımsız UX Öz-Denetimi (Sprint 10.3)
`docs/sprint-10.3-ux-self-audit.md` — 8 gerçek yavaşlatıcı nokta bulundu (en kritiği: Undo butonunun görsel olarak yeterince ayrışmaması). Hiçbiri bu sprintte düzeltilmedi, sonraki sprint için önceliklendirildi.

### Bilinen Riskler (Gerçek Cihazda Doğrulanmalı)
- `TreeSelectorList` sanallaştırma içermiyor.
- `runInTransaction()`'ın ANR riski doğrulanmadı.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 10.1 | Repository katmanı + gerçek performans testi | ✅ Tamamlandı |
| 10.2 | Toplu İşlemler UI (ağaç seçimi, formlar, geri al) | ✅ Tamamlandı |
| 10.3 | Saha UX iyileştirmeleri + navigasyon + UX öz-denetimi | ✅ Tamamlandı |
| 10.4 | Geriye dönük tarih/saat (tüm türler) + Sulama Başlangıç/Bitiş Saati (Şema Sürüm 12) | ✅ Tamamlandı |

### Sprint 10.4 Notu (2026-07-19) — Geriye Dönük Tarih/Saat + Sulama Süresi
Gerçek saha geri bildirimine dayanan iki eklenti: (1) Toplu Gözlem/Bakım'da `observedAt`/`completedDate` artık varsayılan "şimdi" ile dolu ama kullanıcı tarafından düzenlenebilir (migration gerekmedi — mevcut TEXT sütunlar zaten esnekti). (2) Sulama'ya özel Başlangıç/Bitiş Saati + canlı hesaplanan toplam süre (Şema Sürüm 12, `start_time`/`end_time` nullable sütunlar — süre kendisi saklanmıyor, türetilebilir). Detay: `docs/sprint-10.4-technical-report.md`.

### Sonraki Adım
UX öz-denetiminin önceliklendirdiği iyileştirmeler (Undo görsel vurgusu öncelikli), İşlem Şablonları/Favoriler (gerçek kullanıcı ihtiyacı kanıtlanırsa), gerçek cihaz performans testleri (kullanıcı tarafından).

---

## Henüz Başlamayan Modüller

Router'da isim alanı ayrılmış (`docs/router` altında `FUTURE_ROUTE_NAMES`), ama hiçbir tasarım/kod kararı alınmamış:

- **Hava Durumu (Weather)**
- **Harita (Map)**
- **Sesli Asistan** — Bölüm 12, ertelendi
- **RAG/Embedding** — ertelendi
- **Ayarlar (Settings)**
- **Raporlar (Reports)**
