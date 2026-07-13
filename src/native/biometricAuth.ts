/**
 * Biyometrik Kimlik Doğrulama — İnce Sarmalayıcı Katmanı
 * =========================================================
 *
 * NEDEN BU DOSYA VAR?
 * secureStorage.ts ile aynı gerekçe: `@aparajita/capacitor-biometric-auth`
 * paketi uygulamanın geri kalanında hiçbir yerde doğrudan import edilmez.
 *
 * MİMARİ KARAR (bkz. docs/adr/0003-kimlik-dogrulama-modeli.md):
 * Bu uygulama TEK KULLANICI odaklıdır. Web projesindeki gibi sunucu
 * tarafı kullanıcı adı/şifre/rol sistemi YOKTUR. Kilit, tamamen cihaz
 * seviyesinde çözülür: parmak izi/yüz tanıma varsa onunla, yoksa veya
 * başarısız olursa cihazın kendi PIN/desen ekranıyla (allowDeviceCredential).
 *
 * `authenticate()` çağrısı hata fırlatabiliyor (BiometryError). Bu
 * katman, UI'ın try/catch yazmak zorunda kalmadan sonucu ele alabilmesi
 * için hatayı yutup açıklayıcı bir sonuç nesnesine çeviriyor — çünkü
 * "kullanıcı iptal etti" gibi durumlar UI için bir hata değil, normal bir
 * akış dalıdır.
 */

import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  type CheckBiometryResult,
} from "@aparajita/capacitor-biometric-auth";

export interface AuthenticateResult {
  success: boolean;
  /** Başarısızsa neden; kullanıcı arayüzünde uygun mesajı seçmek için kullanılır. */
  errorType: BiometryErrorType | null;
}

/**
 * Cihazda hangi doğrulama yöntemlerinin mevcut olduğunu sorgular.
 * Kilit ekranı, bu sonuca göre "parmak izi simgesi göster" ya da
 * doğrudan cihaz PIN'ine yönlendir kararını verir.
 */
async function checkAvailability(): Promise<CheckBiometryResult> {
  return BiometricAuth.checkBiometry();
}

/**
 * Kullanıcıdan doğrulama ister. `allowDeviceCredential: true` sabit
 * olarak ayarlanmıştır — bu, bizim "Cihaz PIN/Biyometrik yeterli"
 * kararımızın doğrudan uygulamasıdır: biyometri mevcut değilse veya
 * kullanıcı üst üste başarısız olursa, sistem otomatik olarak cihazın
 * PIN/desen ekranına düşer. Ayrı bir uygulama içi şifre asla sorulmaz.
 */
async function authenticate(reason: string): Promise<AuthenticateResult> {
  try {
    await BiometricAuth.authenticate({
      reason,
      allowDeviceCredential: true,
      androidTitle: "Bahçem Mobile",
      androidSubtitle: reason,
      cancelTitle: "İptal",
    });
    return { success: true, errorType: null };
  } catch (error) {
    if (error instanceof BiometryError) {
      return { success: false, errorType: error.code };
    }
    // Beklenmeyen (BiometryError olmayan) bir hata — bunu yutmuyoruz,
    // çünkü kilit mekanizmasında sessizce yutulan beklenmedik bir hata
    // güvenlik açısından tehlikeli olabilir.
    throw error;
  }
}

export const biometricAuth = {
  checkAvailability,
  authenticate,
};

export { BiometryErrorType };
