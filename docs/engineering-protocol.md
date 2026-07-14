# Bahçem Mobile Engineering Protocol v1.6

**Durum:** Onaylandı (v1.0 kullanıcı tarafından sunuldu; Bölüm 5 ve 16 v1.1'de revize edildi; Bölüm 18 v1.2'de eklendi; Bölüm 18.1-18.3 v1.3'te eklendi; Bölüm 18.2 v1.4'te güncellendi; Bölüm 18.4 v1.5'te eklendi; Bölüm 18.5 — Cihaz Dili Sorgulama Kuralı — v1.6'da eklendi, 2026-07-14)

Bu belge Bahçem Mobile projesinin resmi geliştirme protokolüdür. Modül 2'den itibaren tüm geliştirme süreci için geçerlidir. Modül 1, bu protokolden önce tamamlandığı için geriye dönük olarak bu sıraya zorlanmamıştır — ancak Modül 1'e uygulanan denetim (Kalite Kapısı, Test Kapısı, ADR belgelemesi) protokolün ruhuyla zaten tutarlıydı.

Bu protokol; mimari kararların, geliştirme disiplininin, kalite standartlarının ve teslim süreçlerinin korunmasını amaçlar.

Bu protokol onaylandıktan sonra aşağıdaki üç belge projenin resmi referans dokümanlarıdır:
- **ADR** (`docs/adr/`) — Architecture Decision Records
- **AI Master Architecture** (`docs/ai-architecture.md`)
- **Bahçem Mobile Engineering Protocol** (bu belge)

Hiçbir modül bu üç belgeyle çelişemez. Yeni modüle başlamadan önce üçü de yeniden gözden geçirilir, yeni modülün bunlarla çelişmediği doğrulanır.

Bu protokol yaşayan bir dokümandır. Değişiklikler yalnızca teknik gerekçeyle önerilebilir; önce raporlanır, sonra tartışılır, kullanıcı onayından sonra yürürlüğe girer. Bir modülde yapılan her değişiklik, önceki/sonraki modülleri, AI mimarisini, ADR kayıtlarını ve genel sistem mimarisini etkileyip etkilemediği açısından değerlendirilir; gerekirse etki analizi hazırlanır.

---

## 1. Projenin Amacı

Bahçem Mobile; offline-first çalışan, tek kullanıcı odaklı, Android tabanlı, AI destekli, profesyonel, uzun ömürlü, bakımı kolay, Google Play seviyesinde bir tarım yönetim sistemidir. Bu proje bir demo değildir. Her mimari karar uzun yıllar kullanılacak şekilde verilir.

> **Not:** "Google Play seviyesinde" ifadesi, ileride Play Store'a yayınlanacağı varsayıldığında imza anahtarı yönetimi, gizlilik politikası, Play Console Veri Güvenliği formu gibi ek gereksinimler doğuracaktır — bunlar ilgili modül geldiğinde ayrıca ele alınacaktır, bugün eklenmiyor.

## 2. Temel Prensipler

Offline First · Local First · Single User · Serverless · Privacy First · AI Ready · Security First · Performance First · Maintainability First · Testability First

## 3. Altın Kurallar

1. Varsayım yapılmaz.
2. Emin olunmayan hiçbir bilgi kesinmiş gibi yazılmaz.
3. Koddan önce analiz yapılır.
4. Analizden önce mimari düşünülür.
5. Gereksiz teknoloji eklenmez.
6. Gereksiz bağımlılık eklenmez.
7. Gereksiz soyutlama yapılmaz.
8. Kod tekrarından kaçınılır.
9. Minimum API çağrısı yapılır.
10. Minimum token tüketimi hedeflenir.
11. Yerel çözüm mümkünse bulut çözümü tercih edilmez.
12. Android her zaman birinci platformdur.
13. Saha koşulları temel kullanım senaryosudur.
14. Tek elle kullanım önceliklidir.
15. İnternet yokmuş gibi geliştirme yapılır.
16. AI yalnızca gerektiğinde kullanılır.
17. AI kullanıcı onayı olmadan veri değiştiremez.
18. AI kullanıcıdan habersiz işlem yapamaz.
19. AI ürettiği önerileri açıklayabilmelidir.
20. Güvenlik performanstan önce gelir.
21. Kalite geliştirme hızından önce gelir.

## 4. Mimari Kurallar

Her geliştirme SOLID, DRY, KISS, YAGNI, Clean Code, ADR ve AI Master Architecture prensiplerine uygun olur. Aşırı mühendislik yapılmaz. Katmanlar gereksiz yere çoğaltılmaz.

## 5. Katman Mimarisi — *(v1.1'de revize edildi)*

> **Revizyon gerekçesi:** v1.0'da bu bölüm, her modül için sabit, zorunlu 8 katmanlı bir zincir tanımlıyordu (*Presentation → Application → Domain → Repository → Data → SQLite → Native → AI*). Bu, Bölüm 4'ün kendi ilkeleriyle ("aşırı mühendislik yapılmayacak", "katmanlar gereksiz yere çoğaltılmayacak") ve Altın Kural #6-7 ile ("gereksiz bağımlılık/soyutlama eklenmez") çelişiyordu: basit bir CRUD modülünde ayrı bir "Application" katmanı zorunlu kılmak gereksiz soyutlama olurdu. Ayrıca liste doğrusal bir bağımlılık zinciri gibi okunmaya açıktı, oysa Native ve AI, Repository/Data'yı paralel kullanan bağımsız kesişen kaygılardır. Kullanıcı bu revizyonu 2026-07-14'te onayladı.

Aşağıdaki katmanlar, her modülün **kullanabileceği bir sözlüktür** — zorunlu sabit bir zincir değildir. Her modül, gerçekten ihtiyaç duyduğu katmanları kullanır:

| Katman | Ne zaman kullanılır |
|---|---|
| Presentation | Her zaman (UI bileşenleri) |
| Domain | Her zaman (tip tanımları) |
| Repository / Data | Her zaman (veri erişimi, BaseRepository üzerinden) |
| **Application** | **Sadece** birden fazla repository'yi birlikte yöneten, gerçek iş kuralı barındıran modüllerde (ör. "hasat kaydı stoktan düşer" gibi çapraz mantık). Basit tek-tablo CRUD modüllerinde (ör. Parseller) eklenmez — hook zaten yeterlidir. |
| SQLite | Repository'nin arkasında, doğrudan UI'dan erişilmez |
| Native | Repository/Data ile paralel, bağımsız bir kesişen kaygı (biyometri, kamera, GPS) — sıralı bir "sonraki adım" değildir |
| AI | Repository/Data'yı Tool Calling üzerinden kullanan, bağımsız bir kesişen kaygı |

Katmanlar birbirine doğrudan bağımlı olmaz; her katman sadece kendi altındaki soyutlamayı bilir.

## 6. AI Prensipleri

AI öneri verir, analiz yapar, karşılaştırır, yorum yapar, öğretir. Ancak kullanıcı onayı olmadan veri oluşturamaz, değiştiremez, silemez. AI; Gemini, Claude, OpenAI, yerel LLM arasında değiştirilebilir olacaktır (bkz. `docs/ai-architecture.md` Bölüm 9-10).

## 7. GitHub Referansı

Eski web projesi referans projedir. Kod doğrudan taşınmaz. Her dosya yeniden değerlendirilir. Sadece doğru mimari çözümler kullanılır.

## 8. Modül Geliştirme Döngüsü

1. Analiz
2. Hakem değerlendirmesi
3. Mimari tasarım
4. Kod geliştirme
5. Kendi kod incelemesi
6. Build doğrulaması
7. Android doğrulaması
8. Teslim

Bu sıra değiştirilemez.

## 9. Kalite Kapısı

Bir modül; `npm install`, `npm run build`, tip kontrolü, lint, `cap sync`, Android Build başarılı olmadan tamamlandı sayılmaz.

> **Operasyonel not:** Bu sürecin "Android Build" adımı, Claude'un çalıştığı sandbox ortamında gerçekleştirilemez (ağ erişimi Gradle/Android SDK dağıtım sunucularına kapalı — bkz. Modül 1 teslimindeki doğrulanmış deneme). Bu adım her zaman kullanıcının kendi ortamında tamamlanır.

## 10. Test Kapısı

Kod hazır olmak, modülün tamamlandığı anlamına gelmez. Modül ancak gerçek Android cihazda kurulup test edilip kullanıcı tarafından onaylandıktan sonra tamamlanmış kabul edilir.

```
Kod Yazılıyor → Kod Hazır → Gerçek Android Testi Bekleniyor → Test Başarılı → Modül Tamamlandı
```

## 11. Dokümantasyon

Her modül sonunda: ADR, Migration, Değişen dosyalar, Risk analizi, Test planı, Bilinen problemler, Sonraki modüle etkileri raporlanır.

## 12. Güvenlik

API anahtarları Android Keystore üzerinde saklanır. Hassas bilgiler düz metin tutulmaz. AI gereksiz veri paylaşmaz.

## 13. Performans

Önce SQLite. Sonra Context Engine. En son AI. AI hiçbir zaman veritabanının yerine kullanılmaz.

## 14. Kullanıcı Deneyimi

Uygulama; bahçede, güneş altında, tek elle, eldivenle, zayıf internetle, uzun süreli kullanımda rahat çalışacak şekilde geliştirilir.

## 15. Geleceğe Uyumluluk

Mimari; IoT, Drone, Uydu, Sensör, RAG, Yerel LLM, Web Paneli, Çoklu Çiftlik gibi gelecekteki özelliklere açık olur. Ancak YAGNI prensibi korunur — bu özellikler için bugün kod/şema eklenmez.

## 16. Hakem Prensibi — *(v1.1'de netleştirildi)*

Her modülde önce Hakem, sonra Mimar, en son Geliştirici rolü uygulanır. Kendi çözümü eleştirilir, alternatifler değerlendirilir, gerekirse ilk karar reddedilir.

> **Yöntem netleştirmesi:** Hakem değerlendirmesi, **birden fazla kurgusal persona simülasyonu ile değil, tek-sesli, çok boyutlu, dürüst teknik eleştiri yöntemiyle** yapılır (bkz. Modül 1 sonrası inceleme — Android Auto Backup/Keystore çakışması bulgusu — bu yöntemin somut örneğidir). Kurgusal "bağımsız uzman paneli" formatı, gerçek bağımsızlık sağlamadığı ve sahte kesinlik hissi yarattığı için kullanılmaz.

## 17. Teslim Kriteri

Çalışan kod yeterli değildir. Teslim edilen her modül; yüksek kalite, düşük teknik borç, uzun ömür, yüksek güvenlik, yüksek performans, kolay bakım, kolay test edilebilirlik, AI uyumluluğu, offline-first uyumluluğu sağlamalıdır. Kalite hiçbir zaman geliştirme hızına feda edilmez.

## 18. Globalization Policy — *(v1.1'de eklendi, 2026-07-14)*

Bahçem Mobile, Google Play üzerinden dünya çapında yayınlanabilecek bir platform olarak tasarlanır. Çoklu dil desteği sonradan eklenecek bir özellik değil, temel mimarinin bir parçasıdır (bkz. ADR 0011).

- Kullanıcıya görünen hiçbir metin doğrudan kod içine yazılamaz. Tüm kullanıcı metinleri, merkezi i18n sistemi (`react-i18next`, bkz. ADR 0011) üzerinden `src/i18n/locales/` altındaki çeviri dosyalarından yönetilir.
- Yeni bir dil eklemek mevcut bileşen kodunu değiştirmeyi gerektirmez — yeni bir çeviri dosyası ve `supportedLanguages.ts`'e bir satır yeterlidir.
- Varsayılan geliştirme dili İngilizcedir (`FALLBACK_LANGUAGE_CODE`).
- Kod değişkenleri, fonksiyon isimleri, sınıf isimleri, dosya isimleri, SQLite tablo isimleri, kolon isimleri, API isimleri, repository isimleri, servis isimleri İngilizce olur. Türkçe (ve diğer diller) yalnızca çeviri dosyalarında bulunur.
- Tarih, saat, sayı biçimleri, para birimi, ölçü birimleri, yerelleştirme (localization) katmanından (`Intl` API tabanlı) yönetilir — ilgili modül geldiğinde ayrıca tasarlanacaktır.
- **RTL (sağdan sola) desteği mimaride hazır olacaktır.** Bunun ön koşulu: tüm CSS, fiziksel yön özellikleri (`margin-left`, `text-align: left` vb.) yerine **mantıksal özelliklerle** (`margin-inline-start` vb.) yazılır. `<html dir="rtl|ltr">` özniteliği, aktif dile göre otomatik ayarlanır (`applyDocumentDirection()`).
- Yeni dil eklemek kod değişikliği gerektirmez.
- AI katmanı aynı mimariye uyar — kullanıcının seçtiği dilde konuşur, düşünür ve hafızasını o dilde tutar (bkz. `docs/ai-architecture.md` Bölüm 3, 5).
- Marka adı ("Bahçem Mobile") istisnadır — çevrilmez.
- Dil tercihi, kimlik doğrulama öncesi erişilebilir olması gerektiği için `@capacitor/preferences` üzerinde tutulur, SQLite veya Secure Storage'da değil (bkz. ADR 0011 — üç depolama katmanının sorumluluk ayrımı).

### 18.1 Translation Key Naming Convention *(ADR 0012 ile eklendi)*

Format: `domain.key` veya `domain.subcontext.key` (nokta ayraçlı, camelCase, en fazla 3 seviye derinlik). `domain` modül adını yansıtır (`common`, `auth`, `parcel`, `tree`, `finance`, `ai`, `settings`...). **Genel/tekrar eden aksiyonlar (kaydet, iptal, tekrar dene, sil, düzenle) her zaman `common.*` altındadır** — hiçbir domain kendi "cancel"/"retry" metnini tekrar tanımlamaz.

**Dosya bölme eşiği:** Çeviri dosyası 200 satırı veya 6 domain'i aştığında, i18next namespace mekanizmasıyla domain başına ayrı dosyalara bölünür.

### 18.2 Brand Configuration *(ADR 0012 ile başlatıldı, ADR 0013 ile tam kapsama genişletildi)*

Marka ile ilgili TÜM bilgiler (Display Name, Package Name, AI Assistant Name, Play Store Name, Future Global Brand Name) `src/config/brand.ts`'de tek noktadan yönetilir — kod tabanının hiçbir yerinde marka adı ikinci kez sabit yazılmaz. Çeviri metinleri içine gömülü marka adları, i18next interpolasyonuyla (`{{brandName}}`) parametreleştirilir. `capacitor.config.ts` bu dosyayı import eder (native `appId`/`appName` için tek kaynak).

**Teknik sınır:** `packageName`'in native Android projesine (`build.gradle`) yansıması otomatik değildir — `cap add` sonrası değişiklikler elle senkronize edilmelidir (bkz. ADR 0013).

**Bilinçli istisna:** `DATABASE_NAME` marka konfigürasyonuna bağlanmaz — bu bir veri kimliğidir, kozmetik bir marka detayı değildir (Kural 31, veri güvenliği önceliklidir).

### 18.4 Sabit Küme (Enum) Verilerinin Saklama Kuralı *(ADR 0017 ile eklendi)*

Sabit, önceden bilinen seçenek kümesi içeren (dropdown/seçim listesi) her alan, veritabanında **İngilizce, kararlı bir kod** olarak saklanır (ör. `crop_type = 'olive'`). Ekranda gösterilecek metin her zaman çeviri dosyasından gelir, asla veri değeri olarak saklanmaz. Mümkün olduğunda SQL `CHECK` kısıtıyla desteklenir. Bu kural, kullanıcının serbestçe yazdığı metin alanlarına (notlar, çeşit adı vb.) uygulanmaz — onlar zaten kullanıcının kendi dilinde, çeviriye ihtiyaç duymayan ham veridir.

### 18.5 Cihaz Dili Sorgulama Kuralı *(ADR 0020 ile eklendi)*

**`navigator.language` cihaz dilini sorgulamak için KULLANILMAZ.** Android WebView'in renderer süreç önbellekleme davranışı nedeniyle, sistem dili değiştiğinde bu değer güncel kalmayabilir (gerçek cihaz testinde doğrulanmış bir bulgu, bkz. ADR 0020). Cihaz dili her zaman `@capacitor/device`'ın `getLanguageCode()` metodu — native katmandan sorgulanan bir API — üzerinden okunur.

### 18.3 Runtime Dil Değiştirme *(ADR 0012 ile eklendi, gelecek geliştirme)*

Mimari buna hazırdır (`i18n.changeLanguage()` + `setLanguagePreference()` + `applyDocumentDirection()` — hepsi mevcut). Ayarlar modülü geldiğinde bu üç fonksiyonu çağıran bir UI eklenecek — bugün yazılmıyor.
