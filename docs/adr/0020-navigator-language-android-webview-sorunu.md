# ADR 0020 — `navigator.language` Android WebView Güvenilirlik Sorunu

**Durum:** Kabul edildi — ADR 0015'in kök nedenini tamamlar ve düzeltir
**Tarih:** 2026-07-14
**Bulan:** Kullanıcı, gerçek Android cihaz testinde (ADR 0015'ten SONRA bile sorun devam etti)
**İlgili:** ADR 0011 (i18n Mimarisi), ADR 0015 (Dil Algılama Kalıcılığı Düzeltmesi)

## Bağlam — ADR 0015 Yeterli Olmadı

ADR 0015, "otomatik algılanan dilin kalıcı yazılmaması" sorununu doğru şekilde çözmüştü. Ancak kullanıcı, düzeltme sonrası gerçek cihazda **aynı senaryoyu tekrar test ettiğinde sorun devam etti**: cihaz dili Türkçe'den İngilizce'ye değiştirilip uygulama tamamen kapatılıp yeniden açıldığında, uygulama hâlâ Türkçe açılıyordu.

Bu, ADR 0015'in düzelttiği mantığın (kalıcı yazmama) doğru olduğunu ama **kaynağın kendisinin (`navigator.language`) güvenilmez olduğunu** gösteriyordu.

## Kök Neden Araştırması

Kullanıcının istediği gibi varsayım yapmadan araştırdım:

1. **`navigator.language` Android WebView'de gerçekten "canlı" mı?** Hayır — bu, dokümante edilmiş bir Android/Chromium WebView davranışıdır. Android 7.0+'ta WebView içeriği, Chromium tabanlı ayrı süreçler (renderer process'ler) tarafından render edilir. Bu süreçler, performans için sistem tarafından önceden başlatılıp önbelleğe alınabilir ("spare renderer process"). **Uygulamamızı "son uygulamalardan tamamen kapatmak", bu paylaşılan/önbelleğe alınmış WebView alt süreçlerinin de kesin olarak sonlandığı anlamına gelmez.** Bu süreçler, başlatıldıkları andaki sistem yapılandırmasını (dil dahil) taşıyabilir.
2. **Bilinen platform sorunu mu?** Evet — Chromium'un kendi hata takip sisteminde ve çok sayıda bağımsız geliştirici raporunda (Android WebView'de `navigator.language`/`Accept-Language`'ın sistem dili değişikliğinden sonra güncellenmemesi) belgelenmiş, tekrar eden bir şikayet konusu.
3. **Capacitor ekosisteminin resmi çözümü var mı?** Evet — `@capacitor/device` paketinin `getLanguageCode()` metodu, tam bu amaç için var: "cihazın **o anki** dil kodunu" native katmandan sorgular.

## Karar

`navigator.language` kullanımı **tamamen kaldırıldı**. Cihaz dili artık `@capacitor/device` (v8.0.2, Capacitor 8 uyumlu, resmi paket) üzerinden, native (Kotlin) katmandan sorgulanıyor.

```typescript
// src/native/device.ts
const result = await Device.getLanguageCode();
```

Bu çağrı, Android'in `Configuration`/`Locale` API'sini doğrudan sorgular — WebView'ın JS motorunu veya önbellekli render sürecini hiç devreye sokmaz, bu yüzden her seferinde güncel sonuç verir.

## Dürüstlük Notu — Tam Kesinlik İddia Edilmiyor

`@capacitor/device`'ın Android native (Kotlin) kaynak kodunu satır satır doğrulayamadım (arama sonuçları tam kaynak dosyasını getirmedi). Bu düzeltmenin dayanağı:
- Resmi API dokümantasyonunun açık amacı ("cihazın o anki dil kodu")
- Native eklenti mimarisinin genel prensibi (JS/WebView katmanını atlayıp native koddan sorgulama)
- Bunun, topluluğun `navigator.language` sorunu için önerdiği standart çözüm olması

**Kesin doğrulama, kullanıcının bir sonraki gerçek cihaz testiyle gelecek.** Bu ADR, o test sonucuna göre (başarılı/başarısız) güncellenecek.

## Sonuçlar

- `src/native/device.ts` oluşturuldu (yeni ince sarmalayıcı katman, mevcut desenle tutarlı).
- `src/i18n/languagePreference.ts`: `detectDeviceLanguageCode()` artık async, `getDeviceLanguageCode()`'u çağırıyor. Hata durumunda İngilizceye düşülüyor (dil algılama asla uygulama açılışını engellemez).
- ADR 0015'teki mantık (otomatik algılanan değerin kalıcı yazılmaması) **değişmedi** — sadece algılamanın KAYNAĞI düzeltildi.
- Yeni bağımlılık: `@capacitor/device` — ücretsiz, resmi Capacitor paketi, Kural 17'ye uygun.
