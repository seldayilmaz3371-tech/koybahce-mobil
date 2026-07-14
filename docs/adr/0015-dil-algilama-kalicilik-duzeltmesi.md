# ADR 0015 — Dil Algılama Kalıcılığı Düzeltmesi

**Durum:** Kabul edildi — ADR 0011'in bir davranışını düzeltir. **Not: Bu düzeltme tek başına yeterli değildi, asıl kök neden ADR 0020/0021'de bulundu ve gerçek cihazda doğrulandı.**
**Tarih:** 2026-07-14
**Bulan:** Kullanıcı, gerçek Android cihaz testinde (Test Kapısı — Engineering Protocol Bölüm 10)
**İlgili:** ADR 0011 (i18n Mimarisi), ADR 0012 Karar 3 (Runtime Dil Değiştirme)

## Bağlam — Gerçek Cihaz Testinde Bulunan Sorun

Test senaryosu: Kullanıcı, telefonun sistem dilini Türkçe'den İngilizce'ye değiştirdi, uygulamayı tamamen kapatıp yeniden açtı. **Beklenen:** Uygulama İngilizce açılmalıydı (henüz hiçbir uygulama-içi dil tercihi seçilmemişken). **Gerçekleşen:** Uygulama Türkçe kalmaya devam etti.

## Kök Neden

`resolveInitialLanguage()` (ADR 0011), ilk açılışta cihazdan algılanan dili `@capacitor/preferences`'a **kalıcı olarak yazıyordu** — gerekçe "algılama mantığını tekrar çalıştırmamak"tı. Ancak bu gerekçe hatalıydı: cihaz dili okuma (`navigator.language`) sıfır maliyetli bir işlemdir, tekrarından kaçınılacak bir performans maliyeti yoktur.

Daha önemlisi, bu tasarım **iki farklı kavramı birbirine karıştırıyordu**:
- **Sistemin o anki durumu** (cihaz dili — değişebilir, canlı takip edilmeli)
- **Kullanıcının bilinçli tercihi** (Ayarlar'dan seçilen dil — kalıcı olmalı)

İlk açılışta algılanan değer, kullanıcının hiçbir eylemi olmadan ikinci kategoriye (kalıcı tercih) yükseltiliyordu. Sonuç: kullanıcı hiçbir zaman bir "dil tercihi" beyan etmediği halde, sistem onun adına kalıcı bir tercih kaydediyor ve bir daha cihaz dilini dinlemiyordu.

## Karar — Düzeltme

`resolveInitialLanguage()` artık **hiçbir zaman otomatik algılanan değeri kalıcı olarak yazmıyor**:

- Kalıcı depoda (`@capacitor/preferences`) bir değer varsa (yalnızca `setLanguagePreference()` — kullanıcının Ayarlar'dan bilinçli seçimi — tarafından yazılmış olabilir), o değer kullanılır ve önceliklidir.
- Kalıcı depoda değer yoksa, **her açılışta** cihazın o anki sistem dili taze olarak okunur ve kullanılır — yazılmaz.

Bu, iki durumu net şekilde ayırır:

| Durum | Davranış |
|---|---|
| Kullanıcı hiç Ayarlar'dan dil seçmedi | Uygulama, cihaz dilini her açılışta canlı takip eder |
| Kullanıcı Ayarlar'dan bilinçli olarak bir dil seçti | O dil kalıcıdır, cihaz dili değişse bile etkilenmez |

## Kullanıcı Ayarlardan Dil Değiştirdiğinde (Gelecek — ADR 0012 Karar 3 ile Tutarlı)

Ayarlar modülü geldiğinde akış şöyle olacak:

```
Kullanıcı Ayarlar'dan bir dil seçer
  → setLanguagePreference(code)   [zaten mevcut, DEĞİŞMEDİ — kalıcı yazar]
  → i18n.changeLanguage(code)     [react-i18next'in hazır metodu, anlık günceller]
  → applyDocumentDirection(code)  [zaten mevcut, RTL için]
```

Bu andan itibaren `resolveInitialLanguage()`'ın "kalıcı depoda değer var" dalı devreye girer — kullanıcı artık cihaz dilini değiştirse bile, uygulama kendi bilinçli seçimini korur. Bu, tam olarak beklenen ve doğru davranıştır (çoğu uygulamanın Ayarlar'dan dil seçme özelliğiyle aynı mantık).

## Neden Bu Bir "Büyük Mimari Değişiklik" Değil

Değişiklik tek bir fonksiyonla (`resolveInitialLanguage()`) sınırlı, üç satırlık bir kaldırma (kalıcı yazma satırı silindi). `setLanguagePreference()`, çeviri dosyaları, RTL mantığı, Preferences katmanı — hiçbiri değişmedi. Kural 26 gereği yalnızca gerekli olan değiştirildi.

## Sonuçlar

Bu, Test Kapısı'nın (Engineering Protocol Bölüm 10) tam olarak amacına hizmet ettiği bir örnektir — kod derlenip çalışıyor olması yetmiyordu, gerçek cihazda gerçek bir davranış hatası ancak kullanıcının bizzat test etmesiyle ortaya çıktı.
