/**
 * Marka Yapılandırması
 * =======================
 *
 * MİMARİ KARAR (bkz. docs/adr/0013-brand-config-genisletildi.md):
 * Kullanıcının açık talebiyle, marka ile ilgili TÜM alanlar (kod
 * tabanında bugün kullanılmasa bile) burada merkezileştirildi. Amaç:
 * gelecekteki global marka/logo/ikon/domain çalışması sırasında kod
 * tabanının HİÇBİR YERİNDE marka adına bağımlı bir sabit aranıp
 * bulunması gerekmesin — tek dosya değişikliği yeterli olsun.
 *
 * ŞU AN DEĞER DEĞİŞTİRİLMEDİ — sadece dağınık sabitler buraya taşındı.
 *
 * BİLİNÇLİ İSTİSNA — burada OLMAYAN, bilerek dışarıda bırakılan:
 * - `DATABASE_NAME` (bkz. data/db/migrations/schema.ts): Kullanıcı
 *   cihazındaki gerçek SQLite dosyasının kalıcı kimliğidir. Marka
 *   değişikliğiyle otomatik değişmesi, mevcut kullanıcılar için veri
 *   kaybı gibi görünen bir migration sorunu yaratır (Kural 31). Bu,
 *   kozmetik bir marka detayı değil, ayrı bir veri-güvenliği kararıdır
 *   ve marka değişikliğinden BAĞIMSIZ tutulur.
 *
 * TEKNİK SINIR — `packageName` için:
 * `capacitor.config.ts`'nin `appId` alanı, yalnızca `npx cap add
 * android` çalıştırıldığı anda native projeyi oluşturmak için okunur.
 * Bu değeri burada değiştirmek, zaten oluşturulmuş `android/`
 * projesindeki gerçek paket adını OTOMATİK DEĞİŞTİRMEZ — bu,
 * `android/app/build.gradle`'da elle yapılması, imzalama anahtarı ve
 * Play Store kaydıyla birlikte ele alınması gereken ayrı bir işlemdir
 * (kullanıcının "Play Store yayını öncesi ayrı çalışma" olarak
 * tanımladığı kapsama girer). `capacitor.config.ts` yine de bu
 * değeri buradan okuyacak şekilde bağlandı — böylece en azından kod
 * tabanında TEK bir kaynak var, native tarafın senkronu ayrı bir adım.
 */

export interface BrandConfig {
  /** UI'da gösterilen, native biyometrik istemde kullanılan görünen ad. */
  displayName: string;
  /** Android paket adı (com.example.app formatında). Yukarıdaki teknik sınıra bakın. */
  packageName: string;
  /** AI sohbet arayüzünde ve sistem promptlarında kullanılacak asistan kimliği. */
  aiAssistantName: string;
  /** Google Play Console mağaza listeleme adı. Bugün hiçbir kod bunu okumuyor — Play Store yayın hazırlığı modülü geldiğinde kullanılacak. */
  playStoreName: string;
  /** Gelecekteki olası global/uluslararası marka adı. Henüz karar verilmedi. */
  futureGlobalBrandName: string | null;
}

export const BRAND: BrandConfig = {
  displayName: "Bahçem Mobile",
  packageName: "com.bahcem.mobile",
  aiAssistantName: "Bahçem Asistan",
  playStoreName: "Bahçem Mobile",
  futureGlobalBrandName: null,
};
