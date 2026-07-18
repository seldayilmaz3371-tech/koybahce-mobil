# Bahçem Mobile — Proje Durumu, Kalan Modüller ve Yol Haritası

**Tarih:** 2026-07-18 · **Hazırlayan bakış açısı:** Kıdemli Yazılım Proje Yöneticisi
**Metodoloji:** GitHub deposu, `docs/` klasörü, tüm ADR'ler, `module-status.md`, `engineering-protocol.md`, `BUILD_INFO.md`, `README.md` ve sprint raporları **gerçekten okunarak** hazırlandı — hiçbir bilgi varsayılmadı.

---

## 1. Projenin Mevcut Durumu

### 1.1 Özet Tablo

| Kategori | Durum |
|---|---|
| Tamamlanan Modüller | 5 (Altyapı, Parseller+Ağaçlar, Gözlemler+Fotoğraflar, Router+Finans, Bakım Yönetimi) |
| Frozen Modüller | Aynı 5 modül — resmen donduruldu, sadece kritik hata/güvenlik açığı için yeniden açılabilir |
| Beta İçin Hazır Modüller | Modül 1-5 (production ready) + Modül 6 (kod/test/mimari tamam, gerçek cihaz/APK doğrulaması kısmen yapıldı) |
| Devam Eden | Modül 6 (AI Altyapısı) — Sprint 7.3 tamamlandı, Beta APK/imzalama/versiyon kararları bekleniyor |
| Başlanmamış | Hasat, Hava Durumu, Harita, Fotoğraf Analizi, Sesli Asistan, RAG, Dashboard, Ayarlar (genel), Raporlar |
| Toplam Test | 484 (hepsi geçiyor) |
| Toplam ADR | 25 |
| Toplam Sprint (bugüne kadar) | ~45 (Modül 1: ~7, Modül 2: ~6, Modül 3: ~11, Modül 4: ~7, Modül 5: 5, Modül 6/Sprint 6-7.3: ~9) |

### 1.2 Mimari Özet (README'den Doğrulandı)

- **Uygulama çatısı:** Capacitor 8 + React 19 + TypeScript + Vite
- **Veritabanı:** Cihaz üzerinde şifreli SQLite (tek gerçek kaynak, offline-first)
- **Kimlik doğrulama:** Cihaz biyometrisi/PIN — **sunucu tarafı hesap sistemi YOK**
- **Sunucu:** Yok — **tek kullanıcılı**, tüm veri cihazda yaşar
- **AI:** Gemini (Provider Registry ile sağlayıcı-bağımsız tasarlandı), salt-okunur Tool Calling, offline-first ile uyumlu (AI özellikleri internet gerektirir, uygulamanın geri kalanı gerektirmez)

**🔴 Mimari açısından kritik bir gerçek:** Uygulama **tek kullanıcılı, hesapsız** bir mimariye sahip. Bu, aşağıdaki bölümlerde bazı "beklenen" ekranların (ör. Profil) neden **mevcut mimariyle doğal olarak uyuşmadığını** açıklıyor — bunu dürüstçe işaretleyeceğim.

---

## 2. Kalan Modüller (Gerçek Kaynaklardan Doğrulanmış)

**Not:** Aşağıdaki modüllerin bir kısmı `docs/module-status.md`'nin resmi "Henüz Başlamayan Modüller" listesinde, bir kısmı sadece AI Master Architecture'ın (gelecek bölümleri) veya Modül 5 Analiz Raporu'nun (web projesi karşılaştırması) içinde **aday** olarak geçiyor. İkisini KARIŞTIRMIYORUM — her modülün başında kaynağını belirtiyorum.

### 2.1 Hasat (Harvest) — *Resmi, module-status.md'de kayıtlı*

- **Amacı:** Ağaç/parsel bazlı hasat miktarı kayıtları (kg/ton), hasat tarihi, verim takibi.
- **Özellikler:** Hasat kaydı CRUD, parsel/ağaç bazlı toplam verim özeti, sezon karşılaştırması.
- **Teknoloji:** Mevcut Repository/Hook/Screen deseni (Bakım/Finans ile birebir aynı), yeni bağımlılık gerekmiyor.
- **Tahmini dosya sayısı:** ~12-15 (migration, domain, repository+test, hook+test, form+test, screen+test, navigasyon).
- **Tahmini kod büyüklüğü:** ~800-1.000 satır (üretim) + ~600-800 satır (test) — Bakım Kaydı modülüyle (Sprint 5.1-5.3) kıyaslanabilir.
- **Bağımlılıklar:** Finans (ADR: Hasat, Finans'tan bilinçli ayrıldı, ama "gelir" hesaplamasında Finans'a referans verebilir), Parsel/Ağaç.
- **Öncelik:** Yüksek — zaten Finans'tan ayrılmış, mimari netleşmiş, en düşük riskli kalan modül.

### 2.2 Hava Durumu (Weather) — *Resmi, module-status.md'de kayıtlı*

- **Amacı:** Parsel bazlı güncel hava durumu + kısa vadeli tahmin, don/aşırı sıcaklık uyarıları.
- **Özellikler:** Open-Meteo entegrasyonu (Modül 5'in "Hatırlatılacak Konular" listesinde önerilmişti, web projesinde de kullanılan ücretsiz bir API), parsel konumuna göre hava durumu, basit uyarı eşiği.
- **Teknoloji:** Yeni bir "harici API" deseni gerektirir — bugüne kadar SADECE Gemini (AI) harici bir API'ye bağlanıyordu. Bu, **yeni bir mimari kategori** (Provider Registry benzeri, ama hava durumu için).
- **Tahmini dosya sayısı:** ~10-12.
- **Tahmini kod büyüklüğü:** ~600-800 satır.
- **Bağımlılıklar:** Parsel (konum bilgisi gerekiyor — **bugün Parsel'de konum/GPS alanı YOK**, bu da önce bir Parsel şeması genişletmesi gerektirebilir).
- **Öncelik:** Orta — gerçek değer katıyor ama Parsel'e konum eklenmesi ön koşul, bu da ek bir analiz gerektirir.

### 2.3 Harita (Map) — *Resmi, module-status.md'de kayıtlı*

- **Amacı:** Parsellerin coğrafi konumlarının haritada gösterimi.
- **Özellikler:** Parsel sınırları/pin'leri, dokunarak parsel detayına gitme.
- **Teknoloji:** Yeni bir harita kütüphanesi gerekir (ör. Leaflet, MapLibre) — **bugüne kadar HİÇ harita bağımlılığı yok**, bu YENİ bir bağımlılık kategorisi. Çevrimdışı harita karolarının (offline map tiles) offline-first ilkesiyle nasıl uyumlu olacağı **ayrı bir mimari karar** gerektirir.
- **Tahmini dosya sayısı:** ~8-10.
- **Tahmini kod büyüklüğü:** ~500-700 satır.
- **Bağımlılıklar:** Parsel'e GPS/konum eklenmesi (Hava Durumu ile ORTAK bir ön koşul).
- **Öncelik:** Orta-Düşük — gerçek değeri var ama offline harita karmaşıklığı riskli.

### 2.4 Fotoğraf Analizi — *Resmi, AI Master Architecture Bölüm 11, Modül 6'da bilinçli ertelendi*

- **Amacı:** Çekilen bir ağaç/yaprak fotoğrafının Gemini Vision ile analiz edilip hastalık/zararlı tespiti, büyüme değerlendirmesi.
- **Özellikler:** Fotoğrafı Gemini'ye gönderme, analiz sonucunu gösterme, geçmiş analizlerle karşılaştırma.
- **Teknoloji:** Mevcut `GeminiProvider`'ın GENİŞLETİLMESİ gerekiyor (bugün sadece metin, `sendMessage` — görsel girdi için YENİ bir metot, ADR 0024'ün kendi notu: "`streamMessage()`/`analyzeImage()` Sprint 6 kapsamı DIŞINDA... bugün YAZILMIYOR").
- **Tahmini dosya sayısı:** ~10-12.
- **Tahmini kod büyüklüğü:** ~700-900 satır.
- **Bağımlılıklar:** AI Altyapısı (Modül 6, TAMAMLANDI), Fotoğraf modülü (Modül 3, TAMAMLANDI).
- **Öncelik:** Yüksek — AI altyapısı zaten hazır, en doğal bir sonraki AI genişlemesi.

### 2.5 Sesli Asistan — *Resmi, AI Master Architecture Bölüm 12, ertelendi*

- **Amacı:** Sesle soru sorma, sesli yanıt alma (özellikle saha koşullarında eller meşgulken).
- **Teknoloji:** Yeni bir native ses tanıma/sentezleme plugin'i gerekir (AI Master Architecture'da `@capgo/capacitor-audio-recorder` referansı var, ADR 0007 — Ses Kaydı Eklentisi Seçimi zaten VAR ama bu, KAYIT için, tanıma/STT için DEĞİL).
- **Tahmini dosya sayısı:** ~8-10.
- **Tahmini kod büyüklüğü:** ~500-700 satır.
- **Bağımlılıklar:** AI Altyapısı, AI Sohbet (Modül 6).
- **Öncelik:** Düşük-Orta — saha kullanımı için değerli ama Türkçe STT/TTS kalitesi büyük bir bilinmeyen (AI Master Architecture'ın kendi kayıtlı teknik borcu: "sesli asistanın Türkçe doğruluğu doğrulanmamış").

### 2.6 RAG/Embedding — *Resmi, ertelendi (ADR 0024, Karar 5)*

- **Amacı:** Tarımsal bilgi tabanı (ör. zeytin yetiştiriciliği rehberleri) üzerinde anlamsal arama, AI'nin daha zengin bağlamla cevap vermesi.
- **Teknoloji:** `IContextEngine` arayüzü ZATEN buna hazır tasarlandı (ADR 0024) — `SemanticContextEngine` implementasyonu eklenmesi yeterli, mimari değişikliği GEREKMİYOR.
- **Tahmini dosya sayısı:** ~10-14 (embedding depolama, RAG servis, semantic context engine).
- **Tahmini kod büyüklüğü:** ~900-1.200 satır.
- **Bağımlılıklar:** AI Altyapısı (Modül 6).
- **Öncelik:** Düşük — gerçek bir kullanıcı ihtiyacı henüz KANITLANMADI (spekülatif olabilir, YAGNI ilkesiyle gözden geçirilmeli).

### 2.7 Dashboard — *Resmi, module-status.md'de kayıtlı*

- **Amacı:** Uygulamayı açınca görülecek özet ekran — toplam parsel/ağaç sayısı, yaklaşan bakımlar, son gözlemler, hava durumu özeti (varsa).
- **Teknoloji:** Mevcut repository'lerin ÖZET sorgularını birleştiren yeni bir ekran — yeni bir mimari kategori GEREKMİYOR.
- **Tahmini dosya sayısı:** ~6-8.
- **Tahmini kod büyüklüğü:** ~400-600 satır.
- **Bağımlılıklar:** TÜM mevcut modüller (özet verisi çekiyor).
- **Öncelik:** Yüksek — kullanıcı deneyimini büyük ölçüde iyileştirir, düşük risk.

### 2.8 Ayarlar (Genel Settings Hub Genişletmesi) — *Kısmen mevcut*

**🟢 Gerçek bulgu:** `SettingsScreen.tsx` **Sprint 7.1'de ZATEN oluşturuldu** — ama bilinçli olarak SADECE "AI" girişini içeriyor (YAGNI). Kalan gerçek genel ayarlar (Dil, Tema, GPS, Kamera, Senkronizasyon, Yedekleme) bu HUB'a EKLENECEK YENİ satırlar.

- **Yedekleme:** ADR 0008 ZATEN karar verilmiş — v1.0'da **manuel, tamamen yerel** (bulut/otomatik DEĞİL). Bu, GERÇEK bir mimari karar, spekülasyon DEĞİL.
- **Dil/Tema:** i18n altyapısı (EN/TR) zaten var, bir "dil seçimi" ekranı EKLEMEK düşük risk.
- **GPS/Kamera izinleri:** Zaten kullanılan native sarmalayıcılar var, bir "izin durumu" özet ekranı eklenebilir.
- **Tahmini dosya sayısı:** ~8-10 (birkaç küçük alt-ekran).
- **Öncelik:** Orta — kullanıcı deneyimi için değerli ama acil değil.

### 2.9 Raporlar (Reports) — *Resmi, module-status.md'de kayıtlı*

- **Amacı:** Parsel/sezon bazlı PDF/paylaşılabilir özet raporlar (maliyet, verim, bakım geçmişi).
- **Teknoloji:** PDF üretimi için yeni bir bağımlılık (ör. `pdf-lib` veya native bir çözüm) gerekebilir.
- **Tahmini dosya sayısı:** ~8-10.
- **Tahmini kod büyüklüğü:** ~500-700 satır.
- **Bağımlılıklar:** Finans, Bakım, Hasat (varsa).
- **Öncelik:** Düşük-Orta — değerli ama diğer modüller (özellikle Hasat) TAMAMLANMADAN anlamlı raporlar üretilemez.

### 2.10 🔴 Dürüstçe İşaretlenmesi Gereken Adaylar (Resmi Modül DEĞİL)

Kullanıcının bu görevde beklediği bazı ekranlar (Stok/Envanter, Bildirimler, Profil), **`module-status.md`'nin resmi listesinde YOK** — sadece şu kaynaklarda geçiyor:

- **Stok (Envanter):** SADECE Modül 5 Analiz Raporu'nda (web projesi karşılaştırması) bir "aday" olarak bahsedildi — hiçbir ADR/resmi karar YOK. Web projesinde var (`InventoryItem`), ama Bahçem Mobile için **henüz bir taahhüt yok**.
- **Bildirimler (Notification):** Modül 5'in "Hatırlatılacak Konular" listesinde **bilinçli olarak ERTELENMİŞ** bir konu (Sprint 6/7 boyunca hiç yasaklı özellik listesine GİRMEYE devam etti — "❌ Push Notification" her sprintte tekrarlandı). Resmi bir modül DEĞİL, sadece "gelecekte değerlendirilecek" bir not.
- **Profil:** **Hiçbir belgede geçmiyor.** Uygulamanın **tek kullanıcılı, hesapsız** mimarisi (README'nin kendi ifadesiyle) göz önüne alındığında, geleneksel bir "kullanıcı profili" ekranı **mimariyle doğal olarak uyuşmuyor** — bu bölüm 12-24'te AÇIKÇA bu şekilde ele alınacak (icat edilmeyecek, ya çıkarılacak ya da "Cihaz Bilgisi" gibi mimariye uygun bir karşılığa dönüştürülecek).

---

## 3. Her Modülü Sprintlere Bölme

Aşağıda, **öncelik sırasına göre**, her kalan modül gerçekçi sprint parçalarına bölünmüştür. Format, Modül 5'in kanıtlanmış deseninden (Migration+Domain+Repo → Hook+Form+Screen → Navigasyon → Görünüm/Özel Özellik) türetildi.

### Sprint 8.1 — Hasat: Migration + Domain + Repository
- **Amaç:** Hasat kaydı veri katmanı.
- **İşler:** Şema migration (yeni sürüm), domain tipleri, repository (dual-scope, audit gerekmez — Bakım'ın audit-log'undan daha basit), gerçek testler.
- **Testler:** Repository CRUD + FK/CHECK + migration testi.
- **Teslim Kriterleri:** Tüm testler geçer, tsc/lint/build temiz.
- **Riskler:** Düşük — kanıtlanmış desen.
- **Tahmini Süre:** 1 sprint (Bakım Sprint 5.1 ile kıyaslanabilir kapsam).
- **Zorluk:** Kolay.

### Sprint 8.2 — Hasat: Hook + Form + Screen
- **Amaç:** Kullanıcı arayüzü.
- **Riskler:** Düşük.
- **Tahmini Süre:** 1 sprint.
- **Zorluk:** Kolay.

### Sprint 8.3 — Hasat: Navigasyon + Finans ile Gelir Bağlantısı (opsiyonel)
- **Amaç:** Parsel/Ağaç'tan Hasat'a erişim, Finans'a "hasat geliri" referansı (bilinçli tasarım kararı gerektirir — ayrı mı tutulacak, yoksa Finans'a mı bağlanacak).
- **Riskler:** Orta — Finans'la ilişki tasarımı gerçek bir analiz gerektirir (Hasat'ın Finans'tan NEDEN ayrıldığını hatırlamak önemli).
- **Tahmini Süre:** 1 sprint.
- **Zorluk:** Orta.

### Sprint 8.4 — Dashboard: İlk Sürüm
- **Amaç:** Parsel/ağaç sayısı, yaklaşan bakımlar (Sprint 5.5'in `dueStatus` filtresini TEKRAR KULLANIR), son gözlemler özeti.
- **Riskler:** Düşük-Orta — çoklu repository'den veri BİRLEŞTİRME performansı ölçülmeli.
- **Tahmini Süre:** 1-2 sprint.
- **Zorluk:** Orta.

### Sprint 9.1 — Fotoğraf Analizi: GeminiProvider Genişletmesi
- **Amaç:** `AIProvider.interface.ts`'e `analyzeImage()` eklemek (ADR 0024'ün önceden öngördüğü genişleme).
- **Riskler:** Orta — gerçek Gemini Vision API şeklinin DOĞRULANMASI gerekir (varsayılmadan, Sprint 6'daki gibi resmi tip tanımlarından).
- **Tahmini Süre:** 1 sprint.
- **Zorluk:** Orta.

### Sprint 9.2 — Fotoğraf Analizi: UI + Depolama
- **Amaç:** Analiz sonucu ekranı, geçmiş analizlerle karşılaştırma.
- **Riskler:** Orta — yeni bir veri modeli (analiz sonucu + fotoğraf ilişkisi).
- **Tahmini Süre:** 1-2 sprint.
- **Zorluk:** Orta.

### Sprint 10.1 — Ayarlar Hub Genişletmesi (Dil/Tema/Yedekleme)
- **Amaç:** Genel Ayarlar hub'ına yeni bölümler.
- **Riskler:** Düşük — ADR 0008 zaten karar vermiş (yedekleme), i18n zaten var (dil).
- **Tahmini Süre:** 1-2 sprint.
- **Zorluk:** Kolay-Orta.

### Sprint 11.1-11.2 — Hava Durumu (Parsel Konum Eklentisi Dahil)
- **Amaç:** Parsel'e GPS/konum alanı eklenmesi (ön koşul) + Open-Meteo entegrasyonu.
- **Riskler:** Orta-Yüksek — Parsel şemasına yeni alan eklemek migration riski taşır (dikkatli additive migration gerekir), YENİ bir harici API deseni.
- **Tahmini Süre:** 2 sprint.
- **Zorluk:** Zor.

### Sprint 12.1-12.2 — Harita
- **Amaç:** Harita kütüphanesi seçimi + entegrasyonu, offline harita karolarının değerlendirilmesi.
- **Riskler:** Yüksek — offline-first ilkesiyle "harita karoları internet gerektirir" gerginliği, Sprint 6'nın AI-offline gerginliğine BENZER bir analiz gerektirir.
- **Tahmini Süre:** 2 sprint.
- **Zorluk:** Zor.

### Sprint 13.1-13.2 — Raporlar
- **Amaç:** PDF/paylaşılabilir rapor üretimi.
- **Riskler:** Orta — yeni bağımlılık, Hasat'ın TAMAMLANMIŞ olması ön koşul.
- **Tahmini Süre:** 2 sprint.
- **Zorluk:** Orta.

### Sprint 14.1-14.2 — Sesli Asistan
- **Amaç:** STT/TTS entegrasyonu, sesli soru-cevap akışı.
- **Riskler:** Yüksek — Türkçe STT/TTS kalitesi bilinmeyen, yeni native plugin.
- **Tahmini Süre:** 2 sprint.
- **Zorluk:** Çok Zor.

### Sprint 15.1-15.2 — RAG/Embedding
- **Amaç:** `SemanticContextEngine` implementasyonu.
- **Riskler:** Orta-Yüksek — gerçek kullanıcı ihtiyacı KANITLANMADAN yapılırsa YAGNI riski.
- **Tahmini Süre:** 2 sprint.
- **Zorluk:** Zor.

---

## 4. Toplam Kalan Sprint Sayısı (Gerçekçi Tahmin)

| Sprint | Modül | Zorluk |
|---|---|---|
| 7.4 | Beta İmzalama/Versiyon Uygulaması | Kolay |
| 7.5 | Beta APK + Gerçek Cihaz Tam Doğrulama | Orta |
| 8.1-8.3 | Hasat | Kolay-Orta |
| 8.4 | Dashboard (v1) | Orta |
| 9.1-9.2 | Fotoğraf Analizi | Orta |
| 10.1 | Ayarlar Hub Genişletmesi | Kolay-Orta |
| 11.1-11.2 | Hava Durumu | Zor |
| 12.1-12.2 | Harita | Zor |
| 13.1-13.2 | Raporlar | Orta |
| 14.1-14.2 | Sesli Asistan | Çok Zor |
| 15.1-15.2 | RAG/Embedding | Zor |
| 16.1 | 1.0 Release Hazırlığı (son entegrasyon, tam regresyon, Play Store hazırlığı) | Orta |

**Toplam: ~24-26 sprint** (Beta'dan 1.0'a). Bahçem Mobile'ın bugüne kadarki temposu (Modül 5'in 5 sprintte, Modül 6'nın ~4 sprintte tamamlanması) baz alınırsa, bu **gerçekçi ama iyimser olmayan** bir tahmindir — gerçek süre, gerçek cihaz test döngülerinin sıklığına bağlı olarak DEĞİŞEBİLİR.

---

## 5. Beta Roadmap (Öncelik Sırasına Göre)

1. **Signing (İmzalama)** — ADR 0025'e göre gerçek bir keystore oluşturulması (kullanıcı kararı bekliyor).
2. **Version** — `sprint-7.3-version-proposal.md`'deki önerilerin (`versionCode`/`versionName`) onaylanıp uygulanması.
3. **APK (Beta)** — Gerçek imza ile Beta APK üretimi.
4. **Gerçek Cihaz Testleri** — `docs/sprint-6-apk-device-test-plan.md`'nin **zorunlu** test setinin TAM olarak çalıştırılması (Sprint 7.2'de sadece bir alt küme doğrulanmıştı).
5. **Saha Testleri** — Gerçek çiftçilerle sınırlı bir grup, gerçek zeytinlikte kullanım.
6. **Bug Fix** — Saha testlerinde bulunan sorunlar (Sprint 7.3'ün öngördüğü "Sprint 7.4 hata düzeltme" yapısı).
7. **Beta Release** — Sınırlı kullanıcı grubuna resmi Beta dağıtımı.

**Tahmini süre:** 2-3 sprint (Sprint 7.4-7.6 civarı) — bu, KOD YAZMAKTAN çok KARAR ALMA ve GERÇEK CİHAZ DOĞRULAMASI ağırlıklı bir aşama.

---

## 6. 1.0 Roadmap (Beta Sonrası)

Öncelik sırasına göre (Bölüm 2'deki analiz temelinde):

1. **Hasat** (en düşük risk, Finans/Bakım deseninin doğrudan tekrarı)
2. **Dashboard** (kullanıcı deneyimini hemen iyileştirir)
3. **Fotoğraf Analizi** (AI altyapısı zaten hazır, doğal genişleme)
4. **Ayarlar Hub Genişletmesi** (Yedekleme dahil — ADR 0008 zaten kararlı)
5. **Hava Durumu** (Parsel konum eklentisiyle birlikte)
6. **Raporlar** (Hasat'a bağımlı, ondan sonra gelmeli)
7. **Harita** (yüksek risk — offline karo stratejisi netleşmeden başlanmamalı)
8. **Sesli Asistan** (en yüksek risk — Türkçe STT/TTS kalitesi kanıtlanmalı)
9. **RAG/Embedding** (gerçek kullanıcı ihtiyacı kanıtlanana kadar ertelenmesi ÖNERİLİR)

**Bilinçli olarak dışarıda bırakılan (resmi modül değil):** Stok/Envanter, Bildirimler, Profil — Bölüm 2.10'da gerekçelendirildi.

---

## 7. Her Modül İçin Tahmini Süre (Özet Tablo)

| Modül | Sprint | Zorluk | Tahmini Gün (sprint başına ~3-5 gün varsayımıyla) |
|---|---|---|---|
| Beta Hazırlığı | 2 | Kolay-Orta | 6-10 gün |
| Hasat | 3 | Kolay-Orta | 9-15 gün |
| Dashboard | 1 | Orta | 3-5 gün |
| Fotoğraf Analizi | 2 | Orta | 6-10 gün |
| Ayarlar Hub | 1 | Kolay-Orta | 3-5 gün |
| Hava Durumu | 2 | Zor | 8-14 gün |
| Harita | 2 | Zor | 8-14 gün |
| Raporlar | 2 | Orta | 6-10 gün |
| Sesli Asistan | 2 | Çok Zor | 10-16 gün |
| RAG/Embedding | 2 | Zor | 8-14 gün |
| 1.0 Hazırlık | 1 | Orta | 3-5 gün |
| **TOPLAM** | **~22** | — | **~70-118 gün** (takvim günü, sürekli çalışma varsayımıyla — gerçek cihaz test döngüleri/kullanıcı onay süreleri EKLENMEDİ) |

**🔴 Dürüst bir uyarı:** Bu süre tahminleri **sadece geliştirme sürelerini** kapsıyor — kullanıcının kendi onay/inceleme süreleri, gerçek cihaz test döngüleri, ve olası "hata düzeltme" sprintleri (Sprint 7.3'ün kendi öngördüğü gibi) bu sayıya **eklenmemiştir**. Gerçek takvim süresi muhtemelen **daha uzun**.

---

## 8. Proje Tamamlandığında Ortaya Çıkacak Ürün (Son Kullanıcı Perspektifi)

Bahçem Mobile v1.0, bir zeytin yetiştiricisinin cebinde taşıyabileceği, **internet olmadan da tam işlevsel** bir çiftlik yönetim asistanı olacak:

- Kullanıcı, **birden fazla parselini** ve bu parsellerdeki **ağaçlarını** (referans ağaçlar dahil) tam bir dijital envanterde tutar.
- Her ağaç için **gözlem geçmişi** (sağlık durumu, büyüme, hava etkisi vb.) ve **fotoğraflar** kayıtlıdır.
- **Bakım kayıtları** (sulama, gübreleme, ilaçlama, budama) hem geçmişe dönük hem **planlı** (yaklaşan/geciken görünümüyle) tutulur.
- **Hasat** miktarları kaydedilir, sezonlar arası karşılaştırılabilir.
- **Finans** (maliyet/satış) parsel bazlı özetlenir.
- Kullanıcı, **kendi API anahtarıyla**, kendi çiftlik verisi hakkında bir **AI Asistan'a** soru sorabilir — AI sadece OKUR, hiçbir kaydı DEĞİŞTİREMEZ.
- (v1.0'a kadar) Bir **fotoğraf çekip** AI'den **hastalık/zararlı analizi** isteyebilir.
- **Hava durumu** ve (varsa) **harita** üzerinden parsellerini görebilir.
- **Dashboard**'da tüm çiftliğinin özetini bir bakışta görür.
- Tüm veri **cihazında, şifreli** olarak saklanır — **sunucu yok, hesap yok**, sadece kullanıcının kendi cihazı ve (isteğe bağlı) manuel yerel yedeklemesi.
- Uygulama, **güneş altında, zayıf internette, tozlu ortamda, tek elle** kullanılabilecek şekilde tasarlanmıştır (Kural 15).

---

## 9. Kritik Risk Analizi

| Risk Alanı | Açıklama | Olasılık | Etki | Azaltma |
|---|---|---|---|---|
| **Android** | Yeni Android sürümleri (API seviyesi değişiklikleri) mevcut native plugin'leri etkileyebilir | Orta | Orta | Düzenli `cap sync` + gerçek cihaz regresyon testleri |
| **SQLite** | Şema migration'larının birikmesi (şu an Sürüm 10) — ileride migration zinciri karmaşıklaşabilir | Düşük | Yüksek | Additive migration deseni (ADR 0005) SÜRDÜRÜLMELİ, her migration gerçek test kanıtı gerektirmeli |
| **Gemini/AI** | API fiyatlandırma/kota politikaları DEĞİŞEBİLİR, kullanıcı deneyimini etkileyebilir | Orta | Orta | Provider Registry ZATEN çoklu-sağlayıcıya hazır (ADR 0024) — alternatif sağlayıcı eklemek görece kolay |
| **AI Doğruluğu** | Fotoğraf Analizi/Sesli Asistan'da yanlış teşhis riski — GERÇEK bir tarımsal karar riski | Orta | **Yüksek** | AI'nin "öneri", kesin teşhis DEĞİL olduğu kullanıcıya AÇIKÇA belirtilmeli (sistem promptu genişletilmeli) |
| **Native Plugin** | Yeni bağımlılıklar (harita, ses) plugin ekosisteminin olgunluğuna bağlı, bakımı bırakılmış paket riski | Orta | Orta | Her yeni plugin seçiminde gerçek bir "seçim ADR'si" (ADR 0007 emsali) yazılmalı |
| **Performans** | Bundle boyutu her yeni AI/native özellikte artabilir (Sprint 6'daki +350kB gibi) | Yüksek | Düşük-Orta | Sprint 7.1'in kanıtladığı `React.lazy` deseni HER yeni ağır modülde TEKRARLANMALI |
| **Versiyonlama** | Beta→1.0 arası birden fazla `versionCode` artışı disiplinsiz yapılırsa Play Store'a geçişte sorun çıkarabilir | Düşük | Orta | ADR 0025'in versiyonlama politikası SIKI takip edilmeli |
| **Google Play** | Uygulama HENÜZ Play Store'a hiç yayınlanmadı — ilk yayın süreci (inceleme, politika uyumu) bilinmeyen bir süre alabilir | Orta | Orta | 1.0 Roadmap'ine Play Store hazırlığı için AYRI bir sprint eklenmeli (bu belgede henüz YOK — gerçek bir eksiklik, dürüstçe belirtiyorum) |
| **Yedekleme** | ADR 0008'in "manuel/yerel" kararı, kullanıcı yedeklemeyi UNUTURSA veri kaybı riski taşır | Orta | Yüksek | Kullanıcıya düzenli hatırlatma (ama "Bildirimler" resmi bir modül DEĞİL — bu, gerçek bir gerilim noktası) |
| **Teknik Borç** | Bugüne kadar (25 ADR, 6 modül) teknik borç disiplini ÇOK GÜÇLÜ oldu — bu tempo yeni katılımcılarla/hızlanan sprintlerle BOZULABİLİR | Düşük | Yüksek | Engineering Protocol'ün (v1.12) sıkı takibi |

---

## 10. Yönetici Raporu (Yönetici Özeti)

**Projenin yüzde kaçı tamamlandı?**
Kaba bir tahmin: **~35-40%** — 6 modül (5 tam + 1 kısmi) tamamlandı, ~9 modül kaldı. Ama modüller EŞİT AĞIRLIKTA değil (Harita/Sesli Asistan gibi bazıları TEK BAŞINA Modül 5 kadar iş gerektirebilir) — bu yüzden bu yüzde **kaba bir gösterge**, kesin bir ölçüm değil.

**Kaç sprint kaldı?**
Beta'ya **~2-3 sprint**, 1.0'a (Beta dahil) **~24-26 sprint**.

**Beta ne zaman hazır olur?**
Kod açısından **çok yakın** — sadece imzalama/versiyon kararları + gerçek cihaz tam doğrulaması kaldı. Kullanıcının karar hızına bağlı olarak **birkaç gün ile birkaç hafta arası**.

**1.0 ne zaman hazır olur?**
Geliştirme temposu bugüne kadarki gibi sürerse, **~22 sprint** (yukarıdaki Bölüm 7'nin ~70-118 günlük tahmini + kullanıcı onay/test döngüleri) — **gerçekçi bir aralık için 4-8 ay** (sprint başına 1 haftadan fazla, gerçek cihaz test sürelerini de sayarsak).

**En kritik eksikler neler?**
(1) İmzalama/versiyon kararları, (2) Play Store yayın süreci **hiç planlanmadı**, (3) AI'nin tarımsal tavsiye riskini azaltacak açık bir sorumluluk reddi/uyarı metni **henüz yok**.

**Hangi modüller ertelenebilir?**
RAG/Embedding (gerçek ihtiyaç kanıtlanmadan), Bildirimler/Stok/Profil (resmi modül bile değil).

**Hangi modüller Beta öncesi kesin bitmeli?**
Hiçbiri — Beta, MEVCUT Modül 1-6 ile ZATEN yeterli bir ürün. Yeni modül BETA'YI GECİKTİRMEMELİ.
