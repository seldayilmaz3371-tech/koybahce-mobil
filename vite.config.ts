/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // 'node' zorunlu: better-sqlite3 native bir Node eklentisi,
    // tarayıcı/jsdom ortamında çalışmaz (bkz. testDatabaseExecutor.ts).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
