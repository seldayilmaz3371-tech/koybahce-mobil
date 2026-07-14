# ADR 0013 — Brand Configuration Tam Kapsama Genişletildi

**Durum:** Kabul edildi — ADR 0012'nin ilgili kısmını günceller
**Tarih:** 2026-07-14
**İlgili:** ADR 0012 (Brand Configuration — ilk minimal sürüm)

## Bağlam

ADR 0012'de, `src/config/brand.ts` bilinçli olarak minimal tutulmuştu — yalnızca kodda gerçekten kullanılan iki alan (`displayName`, `aiAssistantName`) eklenmiş, "Play Store Name" ve "Future Global Brand Name" YAGNI gerekçesiyle dışarıda bırakılmıştı.

Kullanıcı bu kararı **açıkça geçersiz kıldı**: gelecekteki global marka/logo/ikon/domain çalışmasının (Play Store yayını öncesi, ayrı bir çalışma olarak planlanan) kod tabanını taramadan, tek bir dosyadan yürütülebilmesini istiyor. Bu, YAGNI ile çelişmiyor — YAGNI "kullanılmayan özellik yazma" demektir, burada özellik yazılmıyor, sadece **var olan sabitlerin toplanacağı yer genişletiliyor**; bu, açık ve gerekçeli bir kullanıcı kararı olduğu için uygulanıyor.

## Karar

`BrandConfig` arayüzü, kullanıcının istediği 5 alanın tümünü içerecek şekilde genişletildi:

```typescript
export interface BrandConfig {
  displayName: string;
  packageName: string;
  aiAssistantName: string;
  playStoreName: string;
  futureGlobalBrandName: string | null;
}
```

**Mevcut değerler değiştirilmedi** — sadece dağınık sabitler tek dosyaya taşındı.

## Teknik Sınır — `packageName`

`capacitor.config.ts`, artık `BRAND.packageName` ve `BRAND.displayName`'i okuyor (`appId`/`appName`) — doğrulandı, `npx cap sync android` hatasız çalıştı ve üretilen `capacitor.config.json`'da değerler doğru şekilde göründü.

**Ancak dürüstçe belirtilmesi gereken bir sınır var:** Capacitor'ın resmi dokümantasyonu doğrultusunda, `appId`, yalnızca `npx cap add android` çalıştırıldığı anda native projeyi (`android/app/build.gradle`'daki `applicationId`) oluşturmak için okunur. `capacitor.config.ts`'deki değeri değiştirmek, **zaten oluşturulmuş native projedeki paket adını otomatik değiştirmez**. Gerçek bir paket adı değişikliği:
1. `android/app/build.gradle`'da `applicationId` elle güncellenmeli
2. Yeni bir imzalama anahtarı / Play Store kaydı gerekebilir (paket adı değişimi Play Store'da pratikte "yeni bir uygulama" anlamına gelir)

Bu, kullanıcının zaten "Play Store yayını öncesi ayrı bir çalışma" olarak tanımladığı kapsama giriyor — `BRAND.packageName` bu çalışma için **kod tabanındaki tek referans noktasını** sağlıyor, ama native tarafın senkronizasyonu ayrı, elle yapılacak bir adımdır.

## Bilinçli İstisna — `DATABASE_NAME`

`src/data/db/migrations/schema.ts`'deki `DATABASE_NAME = "bahcem_mobile"` **BİLEREK** `BRAND`'e bağlanmadı. Bu, kullanıcı cihazındaki gerçek SQLite dosyasının kalıcı kimliğidir — kozmetik bir marka detayı değil, bir veri kimliğidir. Marka değişikliğiyle birlikte otomatik değişmesi, var olan kullanıcılar için "veritabanı bulunamadı" görünümünde bir veri kaybı senaryosu yaratırdı (Kural 31: veri güvenliği her zaman önceliklidir). Marka değişikliği ile veritabanı dosya adı değişikliği, birbirinden bağımsız, ayrı ayrı ele alınması gereken kararlardır.

## Diğer Bağlanan Noktalar

- `index.html`'deki statik `<title>` etiketi korundu (JS yüklenmeden önceki an için yedek), ama gerçek başlık artık `main.tsx`'te `document.title = BRAND.displayName` ile çalışma zamanında ayarlanıyor.

## Sonuçlar

ADR 0012 silinmedi — bu ADR onun brand-config kısmını günceller, gerekçesi (minimal başlamak) o zaman için geçerliydi, kullanıcının sonraki açık kararıyla genişletildi. Versiyon mantığı korundu.
