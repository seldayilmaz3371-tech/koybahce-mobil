/**
 * Kilit Ekranı
 * =============
 * Uygulama her açıldığında (ve arka plandan döndüğünde — bu davranış
 * Modül 1 kapsamında henüz eklenmedi, bkz. dosya sonundaki not)
 * gösterilen ilk ekran. Web projesindeki kullanıcı adı/şifre giriş
 * formunun YERİNİ TUTAR ama kavramsal olarak tamamen farklıdır: burada
 * hesap doğrulama yok, sadece "bu cihazın sahibi mi?" sorusu cevaplanır.
 *
 * SAHA KULLANILABİLİRLİĞİ (Kural 15):
 * Tek dokunuşla doğrulama başlar (otomatik). Buton büyük, tek elle
 * ulaşılabilir konumda. Metin boyutu güneş altında okunabilir kontrastta.
 */

import { useCallback, useEffect, useState } from "react";
import { biometricAuth, BiometryErrorType } from "../../native/biometricAuth";

type LockScreenStatus = "checking" | "prompting" | "error" | "device-not-secure";

interface LockScreenProps {
  onUnlocked: () => void;
}

/** Kullanıcıya gösterilecek Türkçe hata mesajını, hata koduna göre seçer. */
function describeError(errorType: BiometryErrorType | null): string {
  switch (errorType) {
    case BiometryErrorType.userCancel:
    case BiometryErrorType.appCancel:
    case BiometryErrorType.systemCancel:
      return "Doğrulama iptal edildi.";
    case BiometryErrorType.biometryLockout:
      return "Çok fazla başarısız deneme. Lütfen biraz bekleyip tekrar deneyin.";
    case BiometryErrorType.biometryNotEnrolled:
      return "Cihazınızda kayıtlı bir parmak izi/yüz bulunamadı.";
    case BiometryErrorType.passcodeNotSet:
    case BiometryErrorType.noDeviceCredential:
      return "Cihazınızda PIN, desen veya şifre tanımlı değil.";
    default:
      return "Doğrulama başarısız oldu. Lütfen tekrar deneyin.";
  }
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const [status, setStatus] = useState<LockScreenStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const attemptUnlock = useCallback(async () => {
    setStatus("prompting");
    setErrorMessage(null);

    const availability = await biometricAuth.checkAvailability();

    if (!availability.deviceIsSecure) {
      // Cihazda ne biyometri ne de PIN/desen/şifre var. Bu durumda
      // kilitleyecek hiçbir mekanizma yok — kullanıcıyı bilgilendirip
      // geçişe izin veriyoruz. Veri yine de şifreli (bkz.
      // encryptionKey.ts); burada eksik olan sadece "uygulama açılış
      // kilidi" katmanı.
      setStatus("device-not-secure");
      return;
    }

    const result = await biometricAuth.authenticate(
      "Bahçem Mobile'a erişmek için kimliğinizi doğrulayın"
    );

    if (result.success) {
      onUnlocked();
      return;
    }

    setErrorMessage(describeError(result.errorType));
    setStatus("error");
  }, [onUnlocked]);

  useEffect(() => {
    attemptUnlock();
  }, [attemptUnlock]);

  return (
    <div className="lock-screen">
      <div className="lock-screen__content">
        <h1 className="lock-screen__title">Bahçem Mobile</h1>

        {status === "checking" || status === "prompting" ? (
          <p className="lock-screen__status">Kimlik doğrulanıyor…</p>
        ) : null}

        {status === "device-not-secure" ? (
          <div className="lock-screen__warning">
            <p>
              Cihazınızda ekran kilidi (PIN, desen veya parmak izi) tanımlı
              değil. Uygulama kilitsiz açılacak.
            </p>
            <button
              type="button"
              className="lock-screen__button"
              onClick={() => onUnlocked()}
            >
              Devam Et
            </button>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="lock-screen__warning">
            <p role="alert">{errorMessage}</p>
            <button
              type="button"
              className="lock-screen__button"
              onClick={attemptUnlock}
            >
              Tekrar Dene
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
