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
 *
 * GLOBALIZATION POLICY: Bu dosyada hiçbir kullanıcıya görünen metin
 * doğrudan yazılmaz — tümü useTranslation() üzerinden
 * src/i18n/locales/*.json dosyalarından gelir.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { biometricAuth, BiometryErrorType } from "../../native/biometricAuth";

type LockScreenStatus = "checking" | "prompting" | "error" | "device-not-secure";

interface LockScreenProps {
  onUnlocked: () => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<LockScreenStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Hata koduna göre çevrilmiş mesajı seçer. */
  const describeError = useCallback(
    (errorType: BiometryErrorType | null): string => {
      switch (errorType) {
        case BiometryErrorType.userCancel:
        case BiometryErrorType.appCancel:
        case BiometryErrorType.systemCancel:
          return t("lockScreen.errors.cancelled");
        case BiometryErrorType.biometryLockout:
          return t("lockScreen.errors.lockout");
        case BiometryErrorType.biometryNotEnrolled:
          return t("lockScreen.errors.notEnrolled");
        case BiometryErrorType.passcodeNotSet:
        case BiometryErrorType.noDeviceCredential:
          return t("lockScreen.errors.noDeviceCredential");
        default:
          return t("lockScreen.errors.generic");
      }
    },
    [t]
  );

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
      t("lockScreen.biometricPromptReason"),
      t("lockScreen.cancelButton")
    );

    if (result.success) {
      onUnlocked();
      return;
    }

    setErrorMessage(describeError(result.errorType));
    setStatus("error");
  }, [onUnlocked, t, describeError]);

  useEffect(() => {
    attemptUnlock();
  }, [attemptUnlock]);

  return (
    <div className="lock-screen">
      <div className="lock-screen__content">
        <h1 className="lock-screen__title">Bahçem Mobile</h1>

        {status === "checking" || status === "prompting" ? (
          <p className="lock-screen__status">{t("lockScreen.authenticating")}</p>
        ) : null}

        {status === "device-not-secure" ? (
          <div className="lock-screen__warning">
            <p>{t("lockScreen.deviceNotSecureWarning")}</p>
            <button
              type="button"
              className="lock-screen__button"
              onClick={() => onUnlocked()}
            >
              {t("lockScreen.continueButton")}
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
              {t("lockScreen.retryButton")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
