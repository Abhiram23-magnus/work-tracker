import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './app/App'
import { checkStorage, settingsService } from './services'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { applyTheme, systemTheme } from './components/theme/theme'
import { ErrorBoundary } from './components/layout/ErrorBoundary'

// Apply the saved theme before the first paint so the screen doesn't flash the wrong colours,
// and read the data once so any damaged records are reported on the first screen.
const [savedTheme] = await Promise.all([settingsService.getTheme(), checkStorage()])
applyTheme(savedTheme ?? systemTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider initial={savedTheme}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Cache the app so it opens without internet after the first visit.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline caching is a bonus; the app works online without it.
    })
  })
}
