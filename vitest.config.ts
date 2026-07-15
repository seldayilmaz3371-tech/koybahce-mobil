import { defineConfig } from 'vitest/config'

/**
 * Test Yapılandırması — Üretim `vite.config.ts`'den BİLEREK AYRI
 * ==================================================================
 * bkz. vite.config.ts'deki mimari karar notu. Bu dosya SADECE
 * `npm run test` (vitest) çalıştırıldığında okunur; `npm run build`
 * veya `tsc -b` bu dosyayı hiç görmez — bu sayede üretim derlemesi,
 * `better-sqlite3` gibi test-özel bağımlılıkların kurulu olup
 * olmamasından tamamen bağımsızdır.
 *
 * React eklentisi burada BİLEREK YOK — bugünkü testler (repository/SQL
 * katmanı) hiç JSX/React bileşeni render etmiyor. İleride bileşen
 * testi yazılırsa (YAGNI: bugün eklenmiyor), o zaman eklenecek.
 */
export default defineConfig({
  test: {
    // 'node' zorunlu: better-sqlite3 native bir Node eklentisi,
    // tarayıcı/jsdom ortamında çalışmaz (bkz. testDatabaseExecutor.ts).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
