import type { CapacitorConfig } from '@capacitor/cli';
import { BRAND } from './src/config/brand';

const config: CapacitorConfig = {
  appId: BRAND.packageName,
  appName: BRAND.displayName,
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      // ADR 0004: Veritabanı SQLCipher ile şifreli açılır. Şifreleme
      // anahtarı src/data/db/encryptionKey.ts tarafından üretilip
      // Android Keystore korumalı güvenli depoya yazılıyor.
      androidIsEncryption: true,
      // Eklentinin kendi yerleşik biyometrik kilidini KULLANMIYORUZ:
      // uygulama açılışı kilidini kendi LockScreen bileşenimiz
      // (@aparajita/capacitor-biometric-auth ile) yönetiyor. İki ayrı
      // biyometrik doğrulama mekanizmasının çakışmasını önlemek için
      // burada kapalı tutuyoruz.
      androidBiometric: {
        biometricAuth: false,
      },
    },
  },
};

export default config;
