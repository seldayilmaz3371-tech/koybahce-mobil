# Module 5 Analysis Report — Web Projesi İncelemesi

**Belge No:** 1/8 (Kod Öncesi Teslim Edilecek Belgeler)
**Tarih:** 2026-07-16
**Kaynak:** `/home/claude/bahcem_analiz/bahcem_proje-main/` — **gerçekten okunarak** analiz edildi (81 dosya, ~9.400 satır — `src/` 7.315 satır bileşen kodu + `server/database.ts` 977 satır + `server/models.ts` 525 satır + `src/types.ts` 374 satır doğrudan incelendi)
**Metodoloji:** Hiçbir bilgi varsayılmadı. Belirsiz noktalar **"Unknown"** olarak işaretlendi.

---

## Document Metadata

| Alan | Değer |
|---|---|
| Doküman | Module 5 Analysis Report |
| Sürüm | 1.0 |
| Durum | OFFICIAL |
| Kapsam | Web projesinin (Mersin AgriTech — Zeytin Hafızası) tam envanteri |
| Çapraz Referans | `docs/module-status.md`, `docs/ai-architecture.md`, `docs/database-master-schema.md` |

---

## 🔴 Kritik Düzeltme (Talimatta Varsayılan, Gerçekte Farklı)

Talimat "SQLite ilişkileri" çıkarılmasını istiyordu. **Gerçek bulgu: web projesi SQLite kullanmıyor.** `server/database.ts`, tüm veritabanını **tek bir düz JSON dosyasında** (`data/tarim_hafizasi.json`) tutan, elle yazılmış bir `DatabaseManager` sınıfı — yazma işlemleri bir `Promise` kuyruğuyla (`writeQueue`) sıralanıyor, "migration" kavramı gerçek SQL değil, JSON şemasını elle dönüştüren bir simülasyon. Bu, mobil uygulamamızın SQLite mimarisiyle **temelden farklı** — doğrudan port edilecek bir "ilişki modeli" yok, sadece **kavramsal veri modeli** (hangi alanlar, hangi ilişkiler) referans alınabilir.

## 🔴 İkinci Kritik Düzeltme — Offline Davranışı

`README.md` açıkça **"çevrimdışı çalışma desteklenmez"** diyor. Ama `src/App.tsx` + `src/offline/offlineQueue.ts` incelendiğinde gerçek durum daha nüanslı:

- **Genel uygulama** (Finans, Envanter, AI, Rapor) gerçekten **her zaman internet gerektiriyor**.
- **SADECE yeni Gözlem oluşturma + fotoğraf ekleme**, IndexedDB tabanlı dar kapsamlı bir kuyruğa sahip (`MAX_QUEUED_OBSERVATIONS = 30`, sadece **yeni kayıt**, **düzenleme desteklenmiyor** — çakışma riski bilinçli olarak kaçınılmış).

**Sonuç:** Web projesinin "offline" davranışı, bizim mobil uygulamamızın (tam offline-first, SQLite tek gerçek kaynak) felsefesiyle **kıyaslanamaz** — web projesi "online-first + dar kapsamlı senkron kuyruk", biz "offline-first". Bu, Module 5 AI entegrasyonu tasarlanırken **doğrudan port edilemeyecek** temel bir mimari fark.

---

## 1. Ekranlar (Screens) — `ActiveTab` Enum'undan Doğrulandı

`src/types.ts`'teki `ActiveTab` tipi ve `App.tsx`'teki koşullu render, **10 üst-düzey ekranı** kesin olarak doğruluyor:

| Sekme | Bileşen | Mobil Uygulamamızdaki Karşılığı |
|---|---|---|
| `dashboard` | `Dashboard.tsx` | ⚪ Yok (gelecek modül) |
| `parcels` | `ParcelManager.tsx` (+ `parcels/TreeManager.tsx`, `parcels/TreeCountManager.tsx`) | ✅ Modül 2 |
| `observations` | `ObservationLog.tsx` | ✅ Modül 3 |
| `inventory` | `InventoryManager.tsx` | ⚪ Yok (gelecek modül) |
| `equipment` | `EquipmentManager.tsx` | ⚪ Yok (gelecek modül) |
| `finance` | `FinanceManager.tsx` (+ `finance/CostSection.tsx`, `HarvestSection.tsx`, `SaleSection.tsx`) | 🟡 Kısmi (Modül 4 sadece cost/sale, harvest hariç — **web projesi de aynı ayrımı yapıyor**, doğrulandı) |
| `ai-advisor` | `AIRecommendations.tsx` | ⚪ Yok (Modül 5+ konusu) |
| `photo-growth` | `PhotoGrowthAnalysis.tsx` | 🟡 Kısmi (biz fotoğraf çekiyoruz, AI analizi yok) |
| `document-hub` | `DocumentHub.tsx` | ⚪ Yok (RAG doküman havuzu) |
| `activities` | `ActivityLogs.tsx` | ⚪ Yok (audit log) |

Ayrıca `Login.tsx`, `Sidebar.tsx` — kimlik doğrulama/navigasyon kabuğu.

## 2. Kullanıcı Akışları

**Doğrulanmış (App.tsx'ten):** Giriş → token doğrulama (`/api/auth/me`) → Sidebar navigasyonu → sekme değişimi `localStorage`'a kaydediliyor (`agri_active_tab`) → oturum kapatınca 4 ayrı `localStorage` anahtarı temizleniyor.

**Unknown:** Her ekranın içindeki detaylı kullanıcı akışları (ör. bir Gözlem'in tam oluşturma adımları) bu analizde tek tek çıkarılmadı — bu, Phase 2 (Architecture Review) kapsamında ekran-bazlı derinlemesine incelemeyi gerektirir.

## 3. Veri Modelleri — `src/types.ts`'ten Tam Liste (374 satır, eksiksiz okundu)

**Zaten mobilde karşılığı olanlar:** `User` (rol: Admin/Çalışan/Misafir — **API katmanında uygulanmadığı README'de itiraf ediliyor**), `Parcel` (bizde yok: `qrCodeData`, `soilType`, `irrigationType` — bunlar mobilde `notes` alanına gömülü, ayrı alan değil), `Tree` (bizde yok: `plantingYear` zorunlu — mobilde opsiyonel), `Observation` (web'de `activityType` enum'u 6 değerli: Genel Gözlem/İlaçlama/Sulama/Budama/Gübreleme/Biçme — **bizim 5 `observation_type`'ımızdan tamamen farklı bir sınıflandırma**, doğrudan eşlenmiyor; ayrıca `audioNotePath` — biz sesli not desteklemiyoruz), `Photo` (web'de `thumbnailUrl` ayrı alan — **backlog #17'deki thumbnail eksikliğimizi doğrudan doğruluyor**, `contentHash` bizde yok).

**Mobilde HİÇ karşılığı olmayanlar (yeni modül adayları):**
- `TreeCountChangeLog` — parsel ağaç sayısı değişikliklerinin **değişmez (immutable) denetim kaydı**. Bizim `Tree` tablomuzda böyle bir audit-trail yok.
- `Equipment`, `InventoryItem`/`InventoryCategory` — tamamen yeni domain.
- `Cost`/`Sale`/`Harvest` — **üçü ayrı entity** (bizim Modül 4 kararımızla — sadece cost/sale birleşik, harvest ayrı — birebir tutarlı, doğrulandı).
- `WeatherRecord` + `LiveWeatherForecast` (Open-Meteo, "never fabricated" yorumu — gerçek veri politikası) — bizim `docs/module-status.md`'de referans verilen "Open-Meteo tabanlı Weather Provider" backlog maddesiyle tutarlı.
- `AIRecommendation`, `PhotoAiAnalysis`, `ReferenceTreeStatus`/`ParcelHealthSummary` (referans ağaçlardan **deterministik** parsel sağlık özeti — AI değil, kural-tabanlı agregasyon), `UploadedDocument`, `AiModelUsage`/`AiUsageSnapshot` (Gemini kota takibi, kendi kendine raporlanan tahmin — Google'ın canlı kota API'si olmadığı açıkça belirtiliyor).
- `Notification`, `ActivityLog`.

## 4. Repository Yapısı — `server/repositories/` (9 dosya, tam liste doğrulandı)

`activity`, `ai`, `base`, `equipment`, `finance` (**Harvest/Cost/Sale ayrı sınıflar olarak AYNI dosyada** — `HarvestRepository`, `CostRepository`, muhtemelen `SaleRepository`), `inventory`, `observation`, `parcel`, `user`. Tümü `BaseRepository<T>`'den türüyor — **bizim `BaseRepository` desenimizle kavramsal olarak benzer** (generic taban sınıf), ama implementasyonu JSON-dosya tabanlı, bizimki SQL tabanlı.

## 5. Servis Katmanı

`server/services/` altında 14 dosya, `ai/` alt klasöründe 7 AI-özel servis: `gemini-client.ts` (tembel başlatılan Gemini istemcisi), `chat-assistant.service.ts`, `document.service.ts` (RAG özetleme), `growth-analysis.service.ts`, `parcel-recommendation.service.ts` (hava durumu+gözlem+envanter+RAG'ı birleştiren öneri motoru), `photo-analysis.service.ts`, `rag-retrieval.service.ts` (embedding arama). Ayrıca: `ai-usage-tracker.service.ts`, `auth.service.ts`, `backup.service.ts`, `embedding-storage.service.ts`, `growth-scoring.util.ts`, `notification-trigger.service.ts`, `photo-storage.service.ts`, `setting.service.ts`, `weather.service.ts`.

**Prompt şablonları ayrı dosyalarda** (`server/prompts/`) — `prompt-safety.util.ts` (`capUserQueryLength` — kullanıcı girdisi uzunluk sınırlaması, prompt injection'a karşı temel bir önlem).

## 6. AI Entegrasyon Noktaları

7 farklı AI servisinin TAMAMI **Google Gemini API**'ye bağımlı (`@google/genai`). Kota takibi var (`AiModelUsage`) ama **gerçek zamanlı Google kota API'si yok** — kendi kendine sayan bir tahmin sistemi (kod içi yorumla doğrulandı: *"Google does not expose a public endpoint for querying remaining free-tier quota"*).

## 7. Offline-First Davranışları

Yukarıda "Kritik Düzeltme" bölümünde detaylandırıldı — **dar kapsamlı, sadece yeni-gözlem-oluşturma** için IndexedDB kuyruğu.

## 8. Navigasyon Yapısı

Router YOK — `activeTab` state + koşullu render (bizim Modül 4 öncesi eski deseni gibi). `localStorage`'da kalıcı (`agri_active_tab`).

## 9. Bileşen Bağımlılıkları

`Unknown` — bu analiz, dosya-bazlı envanter seviyesinde kaldı; bileşenler arası tam bağımlılık grafiği (hangi bileşen hangi hook'u/servisi çağırıyor) çıkarılmadı. Phase 2'de gerekirse derinlemesine incelenecek.

## 10. Mevcut Teknik Borçlar (Kod ve README'den Doğrudan Alıntı)

1. **Rol bazlı yetkilendirme UI'da tanımlı, API'de uygulanmamış** (README'nin kendi itirafı) — "tüm giriş yapmış kullanıcılar aynı erişime sahip".
2. **Offline çalışma sadece gözlem oluşturmayla sınırlı**, düzenleme desteklenmiyor (kod yorumunda gerekçelendirilmiş: çakışma riski).
3. **JSON-dosya veritabanı** — eşzamanlılık, büyük veri performansı, ilişkisel bütünlük garantisi SQLite'a kıyasla yapısal olarak daha zayıf (kendi `writeQueue` ile telafi edilmeye çalışılmış).
4. **Gemini kota takibi tahminî**, gerçek zamanlı değil.

---

## Sonuç ve Module 5'e Doğrudan Etki

- **AI özellikleri (Modül 5+ adayı) için**, web projesinin prompt şablonları/servis ayrımı (`ai/` alt klasörü, her AI özelliği kendi servisinde) **iyi bir kavramsal referans** — ama Gemini entegrasyonunun kendisi, bizim offline-first mimarimizle **uyumsuz** (her AI çağrısı internet gerektiriyor) — bu, Phase 2/3'te ciddi bir mimari tartışma konusu olacak.
- **Finans/Hasat ayrımı kararımız** web projesinin kendi ayrımıyla **doğrulandı**.
- **Fotoğraf thumbnail eksikliğimiz** (backlog #17), web projesinin `thumbnailUrl` alanıyla **somut olarak doğrulandı** — gerçek bir öncelik olabilir.
- **Ekipman/Envanter/Bakım** modülleri için web projesi zengin bir veri modeli referansı sunuyor, ama JSON-tabanlı implementasyon detayları port edilmemeli, sadece kavramsal alan listesi.

**Bu, 8 belgenin 1.'sidir.** Kalan 7 belge (Architecture Review, 10 Bağımsız Hakem Raporu, Final Technical Decision, Sprint Roadmap, Risk Assessment, Implementation Strategy, Final Recommendation) — özellikle Phase 3'teki 10 gerçekten bağımsız, derinlemesine uzman raporu — bu belgeyle **aynı titizlikte** hazırlanabilmesi için **ayrı ayrı, sıradaki mesajlarda** teslim edilecek. Hepsini bu tek yanıtta sıkıştırmak, senin "ilk denemede production kalitesinde" hedefinle çelişirdi.
