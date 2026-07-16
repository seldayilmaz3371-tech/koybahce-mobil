# Modül 3 Backlog — Gelecekte Değerlendirilecek Notlar

**Durum:** Kayıtlı, bugün uygulanmıyor. Observation Domain Review onayı sırasında eklendi (2026-07-15).

Bu belgedeki hiçbir madde mevcut sprint kapsamında kodlanmıyor. Amaç: ileride bu değerlendirmeleri yaparken tasarımı engellememek (kolayca eklenebilir bırakmak), bugünden inşa etmemek (YAGNI).

---

## 1) Observation Status (Open / Monitoring / Resolved)

Bir `health_concern` gözleminin zamanla "çözüldü" olarak işaretlenebilmesi. Domain Review'da da tartışılmıştı (Soru 8), kullanıcı onayıyla resmen backlog'a taşındı. **Şema etkisi:** yeni bir `status` enum-kod sütunu (nullable veya `general` gözlemler için anlamsız olacağından, sadece belirli tiplerde kullanılan opsiyonel bir alan) — ADR 0005'in additive migration deseniyle sancısız eklenebilir.

## 2) Observation Source (User / AI / Advisor)

Bir gözlemin kim tarafından girildiğinin izlenmesi — kullanıcı mı, AI mı (Modül 6-7), yoksa bir danışman mı. **Şema etkisi:** `source` enum-kod sütunu. **Not:** AI Master Architecture Bölüm 1 ilkesiyle (AI kendiliğinden veri yazamaz, kullanıcı onayı gerekir) uyumlu olmalı — "AI" kaynaklı bir gözlem bile, kullanıcı onayından geçmiş olmalı.

## 3) Timeline Görünümü

Observation ekranının, gelecekte kronolojik bir "Timeline" (zaman çizelgesi) görsel sunumunu destekleyecek şekilde tasarlanması. **Bugünkü etkisi:** Sprint 3.4'te (ObservationScreen) liste bileşeni, gelecekte bir Timeline bileşenine kolayca dönüştürülebilecek şekilde (veri ↔ görünüm ayrımı net tutularak) yazılmalı — ekstra bir soyutlama katmanı bugün eklenmeyecek, sadece mevcut `ObservationList`/`TreeList` deseni (liste render sorumluluğunun ayrı tutulması) buna zaten uygun.

## 4) Observation Type — Uzun Ömürlü İsimlendirme Değerlendirmesi

`weather_impact` yerine daha geniş bir `environment` kategorisi düşünülmeli (ör. sadece hava değil, toprak/çevresel koşulları da kapsayacak şekilde). **Bugün uygulanmıyor** — Sprint 3.1'in migration'ında `weather_impact` ismiyle ilerliyorum (kullanıcının bu maddeyi de açıkça "bugün uygulanmayacak" listesine koyduğu için). **Önemli not:** Enum-kod değerlerinin isim değişikliği, SQLite'ta "rename-and-recreate" deseni gerektirir (Database Migration Strategy Bölüm 12) — bu, `crop_type` gibi zaten üretimde veri biriktirmiş bir sütun için maliyetli olur. **Öneri (karar değil):** Bu isimlendirme netleşmeden çok fazla gerçek veri birikmeden (ör. Modül 3'ün ilk birkaç haftası içinde) karar verilirse, migration maliyeti düşük kalır.

## 5) Observation Type — i18n Genişletilebilirliği

`observation_type` enum-kodunun (ADR 0017 kuralına uygun, İngilizce kod + çeviri) gelecekte yeni kategoriler eklendiğinde i18n ile sorunsuz genişleyebilir kalması gerektiği — Sprint 3.3 onayında kayda geçti. **Bugünkü tasarım zaten buna uygun** (her yeni enum değeri, yeni bir `t('observation.type.<kod>')` anahtarı gerektirir, mevcut yapıyı bozmaz) — bu madde, gelecekte kategori eklenirken bu ilkenin hatırlanması için kayıtlı.

## 6) Accessibility Review (Genişletilmiş Kapsam)

Önceki "Kontrast Denetimi" önerisi, Sprint 3.3 onayında şu şekilde genişletildi: **WCAG AA kontrast oranı, dokunma alanı boyutu, font boyutu, güneş altında okunabilirlik** — tüm uygulamayı kapsayan tek bir Accessibility Review olarak ele alınacak (tek bir ekrana özel değil). **Bu sprint kapsamında uygulanmıyor**, sadece backlog'a kaydedildi.

## 7) Fotoğraf-Merkezli Saha Akışı

UI akışı, "önce fotoğraf çek, sonra isteğe bağlı not ekle" sırasını öncelemeli — saha kullanımında (Kural 15: güneş altında, tek elle, eldivenle) metin girmek fotoğraf çekmekten daha zahmetli. **Sprint 3.7 (Fotoğraf) ve 3.3 (Form) tasarımına girdi:** Gözlem formu, kamera/galeri eylemini metin alanından ÖNCE, daha belirgin şekilde sunmalı. Bugün hiçbir UI kodu yazılmıyor — bu, ilgili sprintler başladığında referans alınacak bir tasarım önceliği.

## 8) Gözlem Arama/Filtreleme

Sprint 3.4 UX Doğrulamasında bulundu: bugünkü tasarımla (sadece sayfalama + kronolojik sıralama), kullanıcı **son birkaç gözlemi** hızlıca bulabilir ama **aylar önceki** bir gözlemi aramak için bir mekanizma yok. **Mimari buna kapalı değil** — Sprint 3.2'de zaten kanıtlandığı gibi, `ObservationListOptions`'a tarih aralığı/`observation_type` filtresi eklemek, `ParcelListOptions`'ın `search`/`sortBy` ile genişlediği aynı yöntemle mümkün. **Bugün uygulanmıyor.**

## 9) Gözlem Sayısı Gösterimi

Sprint 3.5 UX Doğrulamasında bulundu: `ObservationScreen`'de kullanıcıya "kaç gözlem var" bilgisi gösterilmiyor. **Bugün eklenmiyor** çünkü `observations.length`, sayfalama nedeniyle sadece yüklenen sayıyı yansıtıyor — yanlış/eksik bir toplam göstermek, hiç göstermemekten daha kötü bir kullanıcı deneyimi olurdu. Doğru çözüm, Repository Contract Matrix'te zaten bilinen `count()` eksikliğinin kapatılmasını gerektiriyor — o tamamlanınca bu madde de değerlendirilebilir.

## 10) Test Dosyalarının Kendi Tip Doğruluğu Hiç Kontrol Edilmiyor

Sprint 3.5'te gerçek bir metodolojik boşluk bulundu: `.test.ts(x)` dosyaları `tsconfig.app.json`'da bilerek `exclude` edildiği için (üretim derlemesinin test paketlerine bağımlı olmaması — bkz. `f632df1` commit'i), **hiçbir zaman** `npm run build`/`tsc -b` tarafından tip kontrolünden geçmiyorlar. Bu sprintte, `TreesScreen`/`ObservationScreen`'e yeni zorunlu prop eklendiğinde, ilgili test dosyalarındaki **6+ çağrı noktası eksik prop'la sessizce "geçiyordu"** — sadece geçici, kapsam dışı bir kontrolle (`exclude`'suz bir tsconfig ile tek seferlik `tsc --noEmit`) yakalandı. **Öneri (bugün uygulanmadı):** `package.json`'a `"typecheck:tests"` gibi ayrı bir script eklenip, Release & QA Checklist'e (Belge 5) bir madde olarak eklenmesi — üretim derlemesini test bağımlılıklarına bağlamadan, test dosyalarının kendi tip doğruluğunu periyodik kontrol etmek için.

## 11) Photo Kimliği Her Zaman `photo.id` — Asla `file_path` Değil

Sprint 3.6 onayında kaydedildi: `file_path`, sadece fiziksel dosyanın **o anki** konumudur — kalıcı kimlik değildir (dosya taşınabilir/yeniden adlandırılabilir bir depolama düzenine geçilirse `file_path` değişebilir). Tüm ilişkiler, önbellekleme, referanslar **her zaman** `photo.id` (UUID) üzerinden kurulmalı. Bu, bugünkü tasarımda zaten doğal olarak böyle (repository `id`'yi PK olarak kullanıyor) — bu madde, gelecekte biri yanlışlıkla `file_path`'i bir kimlik gibi kullanmaya kalkışırsa hatırlatma amaçlı.

## 12) Photo Veri Modeli — Gelecekteki AI Metadata Genişletilebilirliği

Sprint 3.6 onayında kaydedildi: `quality_score`, `blur_score`, `ai_processed`, `analysis_version` gibi alanlar **bugün eklenmiyor** ama şema, bunların ADR 0005'in additive migration deseniyle (yeni nullable sütunlar) sancısız eklenmesine açık kalmalı. Bugünkü `photos` tablosu (Sprint 3.6) bu ilkeye uygun tasarlandı — hiçbir alan bu genişlemeyi engellemiyor.

## 13) `taken_at` İçin EXIF — KESİNLEŞEN BULGU (Sprint 3.7)

**Sprint 3.6'da "EXIF varsa" olarak planlanmıştı — Sprint 3.7'de gerçek plugin araştırmasıyla KESİNLEŞTİ:** `@capacitor/camera` (v8.2.1, güncel) `MediaMetadata` tipi sadece `size`/`duration`/`format`/`resolution` içeriyor — **çekim tarihi/EXIF hiçbir zaman plugin API'sinden gelmiyor** (GitHub issue #1910, 2023, bağımsız olarak doğruluyor). Bu, "veri yoksa" değil, "bu plugin'in genel API'si bunu hiç sunmuyor" — EXIF'e erişmek için dosyanın ham baytlarını ayrı bir kütüphaneyle okumak gerekir (kapsamlı bir ek iş, bugün uygulanmıyor). **Sprint 3.7'nin kesin kararı:** `taken_at`, her zaman uygulamanın kayıt anı (`new Date().toISOString()`) ile dolduruluyor — hem kamera hem galeri için, kaynak farkı yok.

## 14) Fotoğraf Sayısı / Depolama Sınırı

Sprint 3.6 Veri Modeli Doğrulamasında değerlendirildi: bir gözleme bağlı fotoğraf sayısında veya toplam cihaz depolama kullanımında bugün bir sınır yok. **Bugün eklenmiyor** (YAGNI) — gerçek saha kullanımında depolama sorunu gözlemlenirse ele alınacak.

## 15) `isSubmitting` Deseninin Senkron Çift-Tıklama Karşısındaki Yarış Durumu (Race Condition)

**Sprint 3.7'de gerçek bir testle bulundu:** `PhotoGalleryScreen`'de, sadece React `useState` tabanlı bir `isSaving` bayrağıyla çift-kayıt korumasının **yetersiz kaldığı** kanıtlandı — aynı senkron JS turu içinde art arda gelen iki tıklama, state güncellemesi henüz yeniden render'a yansımadan ikisi de "henüz kaydedilmedi" durumunu görebiliyor. **Düzeltme (sadece `PhotoGalleryScreen`'de uygulandı):** `useRef` tabanlı senkron bir bayrak (`isSavingRef`) eklendi — state, sadece UI'da butonun görsel olarak devre dışı görünmesi için korundu.

**Bugün uygulanmayan, ama gerçek bir olasılık:** `ParcelForm`, `TreeForm`, `ObservationForm` da AYNI `isSubmitting` (state-only) desenini kullanıyor — teorik olarak aynı yarış durumuna açık olabilirler. Gerçek kullanıcı dokunuşlarında (genellikle en az 100-300ms arayla) bu risk düşük (React'in state güncellemesi araya girecek kadar zaman var), ama programatik/çok hızlı tekrarlı tetiklemelerde teorik olarak sorun oluşabilir. **Bugün bu üç form için düzeltme yapılmadı** — gerçek bir sorun (ör. kullanıcı raporu veya yeni bir test) ortaya çıkarsa, aynı `useRef` deseni tutarlı şekilde uygulanmalı.

## 16) Kapak Fotoğrafı (Cover Photo)

Sprint 3.8'de doğrulandı: `listByObservation()[0]` (kronolojik ilk fotoğraf) zaten "kapak" kavramını karşılıyor — **yeni bir şema alanı gerekmiyor**. Bugün hiçbir UI'da (ör. `ObservationCard`'da küçük bir önizleme) uygulanmadı — talep edilmedi. İleride `ObservationCard`'a bir küçük resim eklenmek istenirse, sadece `photoRepository.listByObservation(observation.id)`'in ilk elemanını çekmek yeterli olur.

## 17) Fotoğraf Galerisi — Thumbnail İhtiyacı (Performans)

Sprint 3.8'de bulundu: `PhotoGalleryScreen`, bugün **tam çözünürlüklü** görselleri doğrudan `<img>` ile render ediyor — küçük önizleme (thumbnail) yok. Bir gözlemin doğası (tek kısa çekim oturumu) gereği bugün düşük risk, ama gerçek saha kullanımında bir gözleme çok sayıda fotoğraf eklenirse düşük performanslı cihazlarda sorun yaratabilir. **Dijital Bahçe Hafızası ilkesiyle uyumlu çözüm (bugün uygulanmıyor):** orijinal dosya asla değiştirilmez, ayrı bir küçük `thumbnailPath` alanı (additive migration) ileride eklenip galeri onu kullanabilir — bu, hem performans hem gelecekteki AI thumbnail ihtiyacını (kullanıcının kendi talimatında belirttiği gibi) aynı çözümle karşılar.

## 18) Toplu Oluşturmanın Toplu Geri Alınması

Sprint 3.10'da dürüstçe belirtildi (Madde 8): başarısız bir toplu oluşturma zaten tam olarak geri alınıyor (transaction rollback, gerçek testle kanıtlandı). Ama **başarıyla tamamlanmış** bir toplu oluşturmayı SONRADAN topluca geri almak (ör. "yanlış aralık girdim, hepsini geri al") için özel bir mekanizma bugün yok — kullanıcı isterse ağaçları tek tek pasife alabilir. **Bugün eklenmiyor** (YAGNI) — gerçek bir ihtiyaç doğarsa (`restore()` eksikliğiyle — backlog Modül 2 Kapanış Raporu madde 1 — birlikte) değerlendirilebilir.

## 19) Liste Virtualization

Sprint 4.3.1'de (Modül 4 Bağımsız Denetimi kaynaklı) değerlendirildi: hiçbir listede (`react-window` vb.) virtualization yok — sayfalama (50/sayfa) DOM boyutunu yumuşak bir şekilde sınırlıyor ama sert bir tavan değil (kullanıcı "Daha Fazla Yükle"ye çok kez basarsa yüzlerce öğe DOM'da birikebilir). **Bugün eklenmiyor** — gerçek bir performans şikayeti/ölçümü olmadan bir kütüphane bağımlılığı eklemek erken optimizasyon olurdu (YAGNI). İzlenmesi gereken bir madde: gerçek saha kullanımında bir kullanıcı gerçekten yüzlerce kayıt biriktirirse yeniden değerlendirilmeli.

## 20) `AppRouter.tsx`'teki Inline Fonksiyonlar (`useCallback` Yokluğu)

Sprint 4.3.1'de değerlendirildi: route wrapper'lardaki `onBack={() => navigate(-1)}` gibi satır-içi fonksiyonlar her render'da yeni referans üretiyor, `useCallback` ile sabitlenmiyor. Bu, teorik olarak alt bileşenlerin geri tuşu dinleyicisinin gereksiz yere yeniden kaydolmasına yol açabilir. **Bugün düzeltilmiyor** — gerçek ölçülebilir bir performans etkisi yok (dinleyici yeniden kaydı ucuz bir işlem), `useCallback` eklemek bu ölçekte erken optimizasyon olurdu.

## 21) Tekrarlanan Liste Bileşenleri (`ParcelList`/`TreeList`/`ObservationList`/`FinanceRecordList`)

Sprint 4.3.1'de (Modül 4 Bağımsız Denetimi) değerlendirildi: 4 modülde neredeyse aynı `<ul class="parcel-list">` + `.map()` deseni tekrarlanıyor. **Bugün `EntityList<T>` gibi bir soyutlamaya REFACTOR EDİLMİYOR** — gerekçe: (1) bu 4 modül zaten çalışan, test edilmiş kod — sadece kozmetik/organizasyonel bir sebeple dokunmak gerçek bir regresyon riski taşır (Kural 26 ihlali); (2) bileşenler yapı olarak benzese de İÇERİK olarak (her Card'ın gösterdiği alanlar) farklı — gerçek bir genelleştirme, render-prop/children deseni gerektirir ki bu da kendi karmaşıklığını getirir; (3) henüz sadece 4 tekrar var, 5./6. bir modül (Bakım/Hasat) de aynı deseni gerektirirse yeniden değerlendirilmeli.
