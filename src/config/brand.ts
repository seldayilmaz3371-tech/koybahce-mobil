/**
 * Marka Yapılandırması
 * =======================
 *
 * MİMARİ KARAR (bkz. docs/adr/0012-marka-isimlendirme-runtime-dil.md):
 * Bu dosya, koddaki UI/AI metinlerinde kullanılan marka bilgilerinin
 * TEK kaynağıdır. Gelecekte marka değişirse, sadece bu dosya değişir.
 *
 * BİLİNÇLİ SINIRLAMA — burada OLMAYANLAR ve neden:
 * - "Play Store Name": Play Console'daki mağaza listeleme metnidir,
 *   uygulama çalışma zamanında hiçbir yerde kullanılmaz — kod
 *   tabanına değil, Play Console yapılandırmasına ait.
 * - "Future Global Brand Name": Şu an gerçek bir ikinci marka yok;
 *   spekülatif/kullanılmayan bir alan eklemek YAGNI ihlali olurdu.
 *   Gerçek ihtiyaç doğduğunda bu nesneye yeni bir alan eklemek tek
 *   satırlık bir değişikliktir — mimari buna zaten açık.
 * - "Application Name" / "Package Name" (com.bahcem.mobile): Bunlar
 *   `capacitor.config.ts`'de tanımlı, DERLEME ZAMANI/native
 *   sabitlerdir — Android paket adını çalışma zamanında "değiştirmek"
 *   diye bir kavram yok (paket adı değişimi = yeni bir Play Store
 *   kaydı, imzalama anahtarı, tam yeniden derleme gerektiren büyük bir
 *   olay). Bunun için dinamik bir soyutlama katmanı kurmak, var
 *   olmayan bir problemi çözmek olurdu.
 */

export const BRAND = {
  /** UI'da gösterilen, native biyometrik istemde kullanılan görünen ad. */
  displayName: "Bahçem Mobile",

  /**
   * AI sohbet arayüzünde ve sistem promptlarında kullanılacak asistan
   * kimliği. Henüz AI modülü yazılmadı — bu alan şimdiden burada,
   * çünkü AI Master Architecture Bölüm 1 "AI'nin rolü" ile
   * ilişkilendirilmesi gerekecek.
   */
  aiAssistantName: "Bahçem Asistan",
} as const;
