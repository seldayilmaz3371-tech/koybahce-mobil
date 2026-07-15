# Belge 5 — Release & QA Checklist

**Durum:** Onay bekliyor · **Tarih:** 2026-07-15
**Çelişmediği belgeler:** Engineering Protocol Bölüm 9 (Kalite Kapısı), Bölüm 10 (Test Kapısı), `docs/module-status.md`

---

## Amaç

Protocol Bölüm 9-10'da tanımlanan yaşam döngüsünü (`Kod Yazılıyor → Kod Hazır → Cihaz Testi → Test Başarılı → Modül Tamamlandı`), her modül kapanışında **tek tek işaretlenebilir, somut** bir kontrol listesine dönüştürmek. Bu belge Protocol'ü **değiştirmez**, operasyonelleştirir.

## Kapsam

Her modülün (ve her modül içindeki dikey dilimin — ör. Parsel, Ağaç) kapanışında uygulanacak resmi kontrol listesi.

---

## Tasarım Kararları — Kontrol Listesi

### A) Otomatik Doğrulanabilir (Sandbox/CI'da Kontrol Edilebilir)

- [ ] `npm install` temiz
- [ ] `npm run build` (`tsc -b && vite build`) hatasız
- [ ] `npm run lint` (oxlint) — 0 hata, 0 uyarı
- [ ] `npm run test` (Vitest) — tüm testler geçti
- [ ] `npx cap sync android` hatasız, beklenen eklenti sayısı/listesi doğru
- [ ] Translation Audit — yetim/eksik çeviri anahtarı taraması (mevcut Python denetim script'i deseni) 0 bulgu
- [ ] Migration testi — `SCHEMA_MIGRATIONS`'daki gerçek SQL'e karşı testler geçti (Belge 1)

### B) Sadece Gerçek Cihazda Doğrulanabilir (Kullanıcı Tarafında)

- [ ] Android Studio'da gerçek derleme
- [ ] APK kurulumu (temiz + güncelleme senaryosu)
- [ ] Offline test (uçak modu) — ilgili modülün tüm CRUD işlemleri çalışıyor
- [ ] Biometric/Secure Storage — **sadece bu alanlarda değişiklik varsa** yeniden test edilir, değişmediyse atlanır
- [ ] Migration cihaz testi — eski sürümden güncelleme senaryosu (ADR 0021'in kanıtladığı desen)
- [ ] Navigation — yeni ekranın Android fiziksel geri tuşu davranışı (bilinen açık teknik borç — Modül 2 Gözden Geçirmesinde bulundu, ele alınana kadar her modülde kontrol edilmeli)

### C) Kod İnceleme Kontrolleri

- [ ] Accessibility — her form alanı gerçek `<label>`/`aria-label`, dokunma hedefi ≥48dp, semantik HTML (Protocol Bölüm 19)
- [ ] Repository — yeni repository'ler için Vitest testleri var (Belge 2 sözleşmesine uyuyor mu)
- [ ] Hook — yeni hook'lar ince-sarmalayıcı desenine uyuyor mu (iş mantığı repository'de mi kaldı)
- [ ] Component — yeniden kullanılabilir olması gerekenler `shared/`'a çıkarıldı mı
- [ ] Error Handling — yeni hatalar Belge 3'teki error code standardına uyuyor mu (bugün itibariyle Parsel kodu **henüz uymuyor** — bu her yeni modülde tekrar kontrol edilecek, düzeltilene kadar bilinen sapma olarak işaretlenir)

### D) Mimari Uyumluluk

- [ ] AI uyumluluğu — yeni repository'nin salt-okunur sorguları, gelecekteki Tool Calling'in çağırabileceği netlikte mi (AI Master Architecture Bölüm 7)
- [ ] ADR uyumluluğu — yeni kararlar ADR olarak belgelendi mi
- [ ] Engineering Protocol uyumluluğu — yeni bir kural gerekiyorsa Protocol'e eklendi mi
- [ ] Offline-first uyumluluğu — yeni özellik internet gerektirmeden çalışıyor mu

### E) Süreç ve Kapanış

- [ ] Git — küçük, anlamlı commit mesajları (Protocol Bölüm 8)
- [ ] **Git Tag — 🔴 gerçek eksik, bugüne kadar hiç tag atılmadı.** Öneri: her modül/dikey dilim kapanışında `module-2-parcel-v1` gibi bir tag atılması — bugün kod/komut çalıştırılmıyor (talimat), sadece süreç önerisi olarak kayda geçiyor
- [ ] Release Note — kullanıcıya sunulan özet rapor (zaten her adımda pratikte yapılıyor, bu maddeyle resmileşiyor)
- [ ] Production Approval — kullanıcının resmi kabulü, `docs/module-status.md`'ye işlenir

### F) Sistematik Ölçülmeyen, Sübjektif Kontroller (Dürüstçe Belirtiliyor)

- [ ] **Memory Leak** — sistematik bir profiling aracı **kullanılmıyor** (bugün YAGNI). Kontrol: gerçek cihazda uzun süreli kullanım sırasında gözle görülür yavaşlama/çökme yok. Somut bir araç, gerçek bir sorun gözlemlenirse eklenecek.
- [ ] **Performance** — React DevTools Profiler gibi bir araçla ölçüm **yapılmıyor** (bugün YAGNI). Kontrol: gözle görülür takılma yok. Somut metrik, gerçek bir performans şikayeti doğarsa eklenecek.

---

## Modül Kapanış Kriteri (Kesin Tanım)

Bir modül/dikey dilim **"Modül Tamamlandı"** sayılır ancak ve ancak:
1. A, C, D bölümlerindeki tüm maddeler ✅ (otomatik + kod incelemesi + mimari uyum)
2. B bölümündeki tüm maddeler kullanıcı tarafından gerçek cihazda ✅ olarak doğrulanmış
3. E bölümündeki resmi kabul (`docs/module-status.md` güncellemesi) yapılmış

---

## Alternatifler

| Alternatif | Neden Reddedildi |
|---|---|
| CI/CD pipeline (GitHub Actions vb.) ile tam otomasyon | Bugün proje ölçeği ve tek geliştiricili (kullanıcı+Claude) süreç için orantısız — A bölümü zaten her commit'te manuel çalıştırılıyor, otomasyonun getirisi bugünkü hızda düşük (YAGNI, ileride gerçek fayda görülürse eklenebilir) |
| Otomatik memory/performance profiling araçları şimdiden kurmak | Erken optimizasyon — gerçek bir sorun olmadan araç kurmak zaman/karmaşıklık maliyeti yaratır |

## Neden Bu Karar Seçildi

Zaten pratikte uygulanan süreç (her commit'te tsc/build/test/lint + kullanıcının gerçek cihaz testi) somut bir kontrol listesine dökülüyor — yeni bir süreç dayatılmıyor, var olan resmileştiriliyor.

## Riskler

| Risk | Seviye |
|---|---|
| Git Tag'lerin hiç kullanılmamış olması — geçmişe dönük bir sürüme referans vermek bugün zor | Düşük-Orta |
| Memory/performance için somut ölçüm olmaması, büyüdükçe fark edilmeyen yavaş bozulma riski taşır | Düşük (bugünkü veri ölçeğinde) |

## Gelecekte Değişebilecek Noktalar

- Proje büyüdükçe (çok modüllü hale geldikçe) CI/CD otomasyonu yeniden değerlendirilebilir.
- Gerçek bir performans sorunu yaşanırsa, somut profiling araçları bu checklist'e eklenecek.

## Sonuç

Checklist, Protocol Bölüm 9-10'u **değiştirmeden** somutlaştırıyor. Tek yeni öneri: Git Tag disiplini — bugüne kadar hiç uygulanmamış, gerçek bir süreç eksiği.
