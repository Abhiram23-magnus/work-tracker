import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './app/App'
import { settingsService } from './services'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { applyTheme, systemTheme } from './components/theme/theme'

// Apply the saved theme before the first paint so the screen doesn't flash the wrong colours.
const savedTheme = await settingsService.getTheme()
applyTheme(savedTheme ?? systemTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider initial={savedTheme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
