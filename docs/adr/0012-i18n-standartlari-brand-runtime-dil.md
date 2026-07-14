# ADR 0012 — Translation Key Convention, Brand Configuration, Runtime Dil Değiştirme

**Durum:** Kabul edildi
**Tarih:** 2026-07-14
**İlgili:** ADR 0011 (i18n Mimarisi), Engineering Protocol Bölüm 18 (Globalization Policy)

## Bağlam

Modül 1 resmi olarak kapatılmadan önce yapılan Architecture Validation'da, Globalization mimarisinin uzun vadeli sürdürülebilirliği için üç ek karar netleştirildi.

---

## Karar 1 — Translation Key Naming Convention

**Format:** `domain.key` veya `domain.subcontext.key` (nokta ayraçlı, camelCase segmentler, en fazla 3 seviye derinlik).

- `domain`, modülün adını yansıtır: `common`, `auth`, `parcel`, `tree`, `observation`, `finance`, `inventory`, `ai`, `settings`, `diagnostics`...
- **Genel/tekrar eden aksiyonlar HER ZAMAN `common.*` altındadır** — `common.save`, `common.cancel`, `common.retry`, `common.continue`, `common.delete`, `common.edit`. Bir domain'e özel bir buton metni, başka bir domain'de aynı anlamda tekrar ediyorsa, bu bir kod tekrarı işaretidir (Kural 8) — `common`'a taşınmalıdır.
- Hata mesajları: `<domain>.errors.<özel_ad>`.

**Validation'da bulunan gerçek ihlal:** `lockScreen.retryButton` ve `infrastructureStatus.retryButton` aynı metni ("Tekrar Dene") iki farklı domain'de tekrar ediyordu. `common.retry` altında birleştirildi. `LockScreen.tsx` ve `App.tsx` buna göre güncellendi.

**Dosya yapısı:** Bugün tek `src/i18n/locales/<dil>/common.json` dosyası, içinde domain'lere göre organize (yukarıdaki gibi). **Büyüme eşiği:** Dosya 200 satırı veya 6 domain'i aştığında, i18next'in namespace mekanizmasıyla (`i18next.init({ ns: [...] })`) domain başına ayrı dosyalara bölünür (ör. `locales/tr/parcel.json`). Bu eşik, Engineering Protocol'e eklendi.

---

## Karar 2 — Brand Configuration (Minimal)

`src/config/brand.ts` oluşturuldu, **sadece kodda gerçekten kullanılan** iki alanla:

```typescript
export const BRAND = {
  displayName: "Bahçem Mobile",
  aiAssistantName: "Bahçem Asistan",
} as const;
```

**Bilinçli olarak eklenmeyenler:**

| Alan | Neden eklenmedi |
|---|---|
| Play Store Name | Play Console yapılandırmasına ait, uygulama çalışma zamanında hiç kullanılmaz |
| Future Global Brand Name | Şu an gerçek bir ikinci marka yok — spekülatif alan eklemek YAGNI ihlali. Gerekince tek satırla eklenir |
| Application Name / Package Name | `capacitor.config.ts`'de zaten tanımlı, **derleme zamanı/native sabitler**. Android paket adını "çalışma zamanında değiştirmek" diye bir kavram yok — değişimi zaten yeni Play Store kaydı, imzalama anahtarı ve tam yeniden derleme gerektiren büyük bir olaydır. Bunun için dinamik soyutlama kurmak var olmayan bir problemi çözerdi |

`LockScreen.tsx` ve `biometricAuth.ts`'teki iki ayrı "Bahçem Mobile" sabiti kaldırıldı, `BRAND.displayName`'e yönlendirildi.

**Ayrıca düzeltildi:** `auth.biometricPromptReason` çeviri metninin İÇİNE gömülü marka adı (`"Bahçem Mobile'a erişmek için..."`), i18next interpolasyonuyla (`{{brandName}}`) parametreleştirildi. Aksi halde marka değişikliğinde her dildeki çeviri metninin de elle güncellenmesi gerekirdi — bu, brand config'in amacını (tek noktadan yönetim) baltalardı.

---

## Karar 3 — Runtime Dil Değiştirme (Gelecek Geliştirme — Bugün Uygulanmıyor)

**Bulgu:** Mimari buna zaten hazır — ek kod gerekmiyor, sadece UI eksik.

`react-i18next`'in kendi `i18n.changeLanguage(code)` metodu, sayfa yenilemesi veya uygulama yeniden başlatması OLMADAN tüm `useTranslation()` kullanan bileşenleri anında yeniden render eder — bu, kütüphanenin standart, belgelenmiş davranışıdır. `setLanguagePreference()` (ADR 0011'de zaten yazıldı, `src/i18n/languagePreference.ts`) kalıcı kaydı zaten yapıyor.

**Gelecekte Ayarlar modülü geldiğinde yapılacak olan sadece:**
```
Kullanıcı dil seçer
  → setLanguagePreference(code)   [zaten var]
  → i18n.changeLanguage(code)     [kütüphanenin hazır metodu]
  → applyDocumentDirection(code)  [zaten var, RTL için]
```
Üç fonksiyon da zaten mevcut veya kütüphanenin bir parçası — eksik olan tek şey, bunları çağıracak Ayarlar ekranı UI'ı. Bu, ilgili modül (Ayarlar) geldiğinde birkaç satırlık bir iş olacak, bugün yazılmıyor (YAGNI — henüz kullanılmayacak bir ekran için kod yazmamak).

---

## Karar 4 — Localization (l10n) Formatlayıcı Katmanı Başlatıldı

**Validation'da bulunan gerçek ihlal:** `App.tsx`, `firstLaunchAt` değerini ham ISO 8601 string olarak gösteriyordu (`2026-07-14T11:23:45.123Z`) — hiçbir yerelleştirme yoktu, Protocol'ün kendi "tarih... localization katmanından yönetilecektir" ilkesiyle çelişiyordu.

`src/i18n/formatters.ts` oluşturuldu — native `Intl.DateTimeFormat` kullanan `formatDateTime()`. Ekstra bağımlılık gerekmedi (Intl, WebView'a yerleşik). `App.tsx` bunu kullanacak şekilde güncellendi.

**Kapsam (YAGNI):** Şu an sadece tarih/saat formatlayıcısı var — Modül 1'de gösterilen tek biçimlendirilebilir değer bu. Sayı, para birimi, ölçü birimi formatlayıcıları, bunlara gerçekten ihtiyaç duyan modül (Finans, Stok) geldiğinde eklenecek.

---

## Sonuçlar

- Engineering Protocol'e naming convention ve dosya bölme eşiği eklendi (Bölüm 18 genişletildi).
- `docs/adr/` klasöründeki hiçbir eski karar silinmedi/değiştirilmedi — bu ADR, ADR 0011'in üzerine ekleme yapıyor.
