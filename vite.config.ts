import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// MİMARİ KARAR (2026-07-14): Test yapılandırması (vitest) BİLEREK bu
// dosyada DEĞİL, ayrı bir vitest.config.ts'de tutuluyor. Gerekçe: bu
// dosya hem `vite build` (üretim) hem `tsc -b` (tsconfig.node.json
// üzerinden) tarafından okunuyor — eğer buraya vitest'e özel bir
// referans/alan eklenirse, ÜRETİM DERLEMESİ test araçlarının (vitest,
// better-sqlite3) kurulu olmasına bağımlı hale gelir. Bu, gerçek bir
// kullanıcı ortamında (Windows, native derleme araçları eksik)
// `npm run build`'ın kırılmasına neden oldu — düzeltildi.
export default defineConfig({
  plugins: [react()],
})
