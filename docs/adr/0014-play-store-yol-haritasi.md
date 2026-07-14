# ADR 0014 — Play Store Yayını Öncesi Yol Haritası: Paket Adı Değişimi ve Marka Varlıkları

**Durum:** Belgelendi, **UYGULANMADI** — bu ADR yalnızca gelecekte (Play Store yayını öncesi ayrı bir çalışma kapsamında) izlenecek teknik yol haritasını kayıt altına alır. Bugün hiçbir kod değişikliği yapılmamıştır.
**Tarih:** 2026-07-14
**İlgili:** ADR 0013 (Brand Configuration)

---

## 1) Package Rename / Bundle Identifier Migration Strategy

### Bağlam

`BRAND.packageName` (`com.bahcem.mobile`), ADR 0013'te kod tabanında tek kaynağa bağlandı. Ancak bunun native Android projesine (`android/app/build.gradle`'daki `applicationId`) yansıması otomatik değil — bu bölüm, gerçek bir paket adı değişikliği gerektiğinde izlenecek adımları belgeler.

### Kritik Zamanlama Gerçeği

**En güvenli ve sıfır maliyetli pencere: Play Store'a İLK yayından ÖNCE.** Uygulama henüz Play Store'da yayınlanmadığı için paket adı şu an istenildiği gibi, herhangi bir maliyet olmadan değiştirilebilir.

**Play Store'a yayınlandıktan SONRA değişirse (genel platform bilgisi, Android/Google Play'in bilinen kısıtları):**

1. **Google, yayınlanmış bir uygulamanın paket adının değiştirilmesine izin vermez** — yeni paket adı, Play Console'da teknik olarak **yepyeni bir uygulama** olarak değerlendirilir. Mevcut kurulum sayısı, yorumlar, puanlar, arama sıralaması **taşınmaz**.
2. **Kullanıcı verisi taşınmaz.** Android'de uygulama verisi (bizim durumumuzda: şifreli SQLite dosyası + Keystore anahtarları), paket adına bağlı bir sanal alanda (sandbox) yaşar. Eski paket adıyla yeni paket adı arasında işletim sistemi seviyesinde otomatik bir veri geçişi mekanizması yoktur.
3. **İmzalama anahtarı** paket adından bağımsızdır — aynı keystore yeni paket adı için de teknik olarak kullanılabilir, bu adım nispeten sorunsuzdur.

### Önerilen Gelecek Yol Haritası (Uygulanmadı)

Eğer ilk yayından sonra bir paket adı değişikliği kaçınılmaz olursa:

1. `android/app/build.gradle`'da `applicationId` elle güncellenir, `BRAND.packageName` senkron tutulur.
2. Kullanıcıların veri kaybı yaşamaması için, mevcut manuel yedekleme özelliği (bkz. ADR 0008) üzerinden bir **"eski uygulamadan veri aktar"** akışı tasarlanmalı — kullanıcı eski uygulamada yedek alır, yeni (yeni paket adlı) uygulamayı kurar, yedeği içe aktarır. Bu, otomatik bir OS mekanizması değil, bizim tasarlayacağımız bir UX akışı olacak.
3. Play Console'da yeni bir liste oluşturulur; eski listede kullanıcıları yeni uygulamaya yönlendiren bir duyuru/geçiş süresi planlanmalı.

**Ana tavsiye:** Paket adına **ilk Play Store yayınından önce nihai karar verilmeli** — sonrasındaki değişikliğin maliyeti çok yüksektir.

---

## 2) Brand Assets Management Strategy

### Kapsam

App Icon, Splash Logo, Notification Icon, AI Avatar, Play Store Assets (feature graphic, ekran görüntüleri, mağaza ikonu).

### Her Varlık Türünün Gerçek Teknik Gereksinimi

| Varlık | Nerede yaşar | Bilinen platform kısıtı |
|---|---|---|
| App Icon | `android/app/src/main/res/mipmap-*/` | Çoklu çözünürlük + Adaptive Icon (ön plan/arka plan katmanı ayrı) gerektirir |
| Splash Logo | `android/app/src/main/res/drawable*/` + `@capacitor/splash-screen` eklentisi | Henüz projeye eklenmedi — ilgili modülde değerlendirilecek |
| Notification Icon | Ayrı, sadeleştirilmiş bir varlık seti | Android bildirim ikonları **tek renkli/şeffaf** olmalıdır (durum çubuğunda beyaz silüet olarak render edilir) — normal uygulama ikonu doğrudan kullanılamaz |
| AI Avatar | `src/` içinde, uygulama koduna gömülü bir görsel/bileşen | Native varlık değil, bizim tasarımımız |
| Play Store Assets | **Kod tabanında YAŞAMAZ** — doğrudan Play Console'a yüklenir | Kod deposunun sorumluluğu dışında |

### Önerilen Gelecek Yol Haritası (Uygulanmadı)

- Tüm marka varlıklarının **yüksek çözünürlüklü kaynak dosyaları** (SVG/PNG master), koddan ayrı, proje kökünde bir `brand-assets/` klasöründe tek kaynak olarak tutulur.
- Platform-spesifik boyut/format türetmeleri (mipmap'ler, adaptive icon katmanları, splash ekranları), kaynak dosyalardan **otomatik üretim aracıyla** türetilir — her boyutu elle export etmek yerine.
  - **Açık araştırma konusu (varsayımla kapatılmıyor):** Bu iş için resmi bir Capacitor aracı (`@capacitor/assets` veya güncel muadili) olup olmadığı, bu çalışma başladığında güncel resmi dokümantasyondan doğrulanacak.
- Notification Icon için ayrı, Android'in tek-renk/şeffaflık kısıtına uygun bir varlık seti üretilecek — App Icon'dan otomatik türetilemez, ayrı tasarım gerektirir.
- AI Avatar, AI modülü (Modül 6-7) kapsamında, sohbet arayüzü tasarımıyla birlikte ele alınacak.

---

## Sonuçlar

Bu ADR, Modül 1 mimarisi donduktan sonra bile **referans olarak kalır** — Play Store yayın hazırlığı modülü geldiğinde ilk okunacak belge budur. Bugün hiçbir dosya, hiçbir bağımlılık eklenmedi.
