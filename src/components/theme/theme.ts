import type { Theme } from '../../services/settingsService'

const systemQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)')

export const systemTheme = (): Theme => (systemQuery()?.matches ? 'dark' : 'light')

/** Sets the theme on <html> so CSS tokens switch, and matches the phone's browser bar colour. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1712' : '#1f4d25')
}

export function onSystemThemeChange(listener: () => void): () => void {
  const query = systemQuery()
  query?.addEventListener('change', listener)
  return () => query?.removeEventListener('change', listener)
}
