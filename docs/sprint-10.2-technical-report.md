# Sprint 10.2 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Saha Operasyonları Paketi — Toplu İşlemler Kullanıcı Arayüzü

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

### Repository Genişletmesi
- `observationRepository.deactivateMany()` + `maintenanceRepository.deactivateMany()` — Sprint 10.1'in `createMany()` deseninin tekrarı, Geri Al özelliği için.

### UI Bileşenleri
- `useTreeSelection` — `Set` tabanlı O(1) seçim state yönetimi.
- `TreeSelectorList` — "Tüm Ağaçlara Uygula"/"Ağaç Seçerek Uygula" + checkbox listesi + Tümünü Seç/Seçimi Temizle + canlı sayı.
- `BulkMaintenanceForm` — 5 bakım türü (Sulama/Gübreleme/İlaçlama/Budama/Biçme) **tek formda**.
- `BulkObservationForm` — Toplu Gözlem, aynı desen.
- `BulkOperationsScreen` — giriş noktası, 6 işlem kartı.
- Onay (`window.confirm`) + Sonuç ("N kayıt oluşturuldu, 0 hata") + Geri Al UI'da uygulandı.

### Testler ve Doğrulama
- **26 yeni test** — 4 repository (`deactivateMany`), 6 `useTreeSelection`, 5 `TreeSelectorList`, 6 `BulkMaintenanceForm`, 2 `BulkObservationForm`, 3 `BulkOperationsScreen`.
- `npx tsc -b`, `npm run test` (596/596), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

### Gerçek Cihaz Performans Test Planı
- `docs/sprint-10.2-device-performance-test-plan.md` — 7 senaryo (100/250/500 ağaç, liste render performansı, Geri Al, ANR kontrolü). **Bu ortamda gerçek cihaz olmadığı için testler çalıştırılamadı** — bu dürüstçe belirtildi, sahte sonuç üretilmedi.

## Kritik Mimari Kararlar (Önce Gerekçe, Sonra Uygulama)

### "Biçme" Kararı
`MaintenanceType` enum'unda ne TS'te ne SQLite `CHECK` kısıtında "mowing" değeri bulunmadığı gerçek dosyalardan doğrulandı. SQLite'ta `CHECK` kısıtı değiştirmek **tablo yeniden oluşturmayı** gerektirir — ADR 0005'in "sadece ekleme" migration ilkesiyle doğal olarak çatışan gerçek bir risk. **Karar:** "Biçme" kullanıcıya seçenek olarak gösteriliyor, arka planda `maintenanceType: "other"` kaydediliyor. Bu, testte doğrulandı (`records[0].maintenanceType === "other"`).

### Geri Al (Undo) Feasibility Analizi
Kullanıcının kendi talimatı: "Eğer mimari uygunsa tek işlemle geri alınabilmelidir. Eğer uygun değilse açıkça raporla." **Sonuç: Mimari olarak UYGUN bulundu** — mevcut soft-delete deseni (`deactivate`/`isActive`) zaten `createMany()`'nin döndürdüğü id listesini toplu olarak pasife almaya izin veriyor. Yeni bir mekanizma icat edilmedi, sadece mevcut desenin `deactivateMany()` olarak genişletilmesi yeterliydi.

## Gerçek Bulgular (Geliştirme Sırasında)

1. **CSS varsayımı hatası:** İlk taslakta `.field`/`.vision-notice` gibi **var olmayan** CSS sınıfları kullanılmıştı (muhtemelen HTML prototipinden etkilenme) — kontrol edilip mevcut `SelectField`/`TextAreaField` ortak bileşenlerini kullanacak şekilde düzeltildi.
2. **Radio buton sorunu:** İlk `TreeSelectorList` taslağı radio butonları kullanıyordu — bunların saha koşulları için (Kural 15) çok küçük kalacağı fark edildi, buton-tabanlı bir mod seçiciye çevrildi.
3. **Test tasarım hatası:** `renderHook()` ve `render()`'ı ayrı çağırmak, React state güncellemelerinin bileşene yansımasını engelledi — gerçek bir wrapper bileşenle (React'in kendi render döngüsü) düzeltildi.

## ÖNERİLER (Kullanıcının İstediği Ayrı Başlık)

Bu öneriler **bu sprintte uygulanmadı** — gelecekte değerlendirilmek üzere sunuluyor:

1. **Liste sanallaştırma (virtualization):** `TreeSelectorList`, 500 satırlık bir listeyi hiç sanallaştırma olmadan DOM'a render ediyor. Gerçek cihaz testinde performans sorunu çıkarsa, `react-window` benzeri bir çözüm değerlendirilmeli (bugün YAGNI ile ertelendi — spekülatif eklenmedi).
2. **Arama/filtre kutusu:** 500 ağaçlık bir listede belirli bir ağacı bulmak zor olabilir — bir arama kutusu kullanıcı deneyimini iyileştirebilir.
3. **Son kullanılan işlem türünü hatırlama:** Kullanıcı her gün aynı işlemi (ör. sulama) yapıyorsa, uygulamanın son kullanılan türü varsayılan göstermesi hız kazandırabilir.
4. **Ardışık işlem kısayolu:** Saha kullanımında aynı ağaçlara birden fazla işlem art arda yapılabilir — "Şimdi Gübreleme de uygulamak ister misiniz?" gibi bir kısayol düşünülebilir.

## VARSAYIM

Hiçbiri — her mimari karar (Biçme, Undo feasibility, CSS sınıfları) gerçek dosya incelemesiyle doğrulandı.

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Mevcut mimari bozulmadı | ✅ |
| Duplicate kod oluşturulmadı | ✅ — Sulama/Gübreleme/İlaçlama/Budama/Biçme tek formda |
| Repository katmanı tekrar yazılmadı | ✅ — Sadece Sprint 10.1'in deseninin genişletmesi (`deactivateMany`) |
| Sprint 10.1 altyapısı kullanıldı | ✅ — `createMany()` doğrudan kullanıldı |
| Yeni mimari karar önce açıklandı | ✅ — Biçme ve Undo kararları |

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (596/596, +26), bundle boyutu (+1.94kB) ve commit hash (`19677c8`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Toplu İşlemler UI'ı tamamlandı — 6 işlem, tek elle kullanılabilir bir akışta, Geri Al desteğiyle. İki gerçek risk (liste sanallaştırma, ANR) gerçek cihazda doğrulanmayı bekliyor.
