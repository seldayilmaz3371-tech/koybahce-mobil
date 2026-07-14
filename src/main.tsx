import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initI18n } from './i18n/i18n'
import { BRAND } from './config/brand'

document.title = BRAND.displayName

/**
 * i18n, ilk render'dan ÖNCE başlatılmalıdır — kilit ekranı bile doğru
 * dilde gösterilmelidir (bkz. src/i18n/i18n.ts). Bu yüzden render,
 * initI18n() tamamlanana kadar bekletilir.
 */
initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
