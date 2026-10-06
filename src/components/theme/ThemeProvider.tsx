import { useEffect, useState, type ReactNode } from 'react'
import type { Theme } from '../../services/settingsService'
import { settingsService } from '../../services'
import { applyTheme, onSystemThemeChange, systemTheme } from './theme'
import { ThemeContext } from './themeContext'

/** Uses the saved choice if there is one, otherwise follows the phone's light/dark setting. */
export function ThemeProvider({ initial, children }: { initial?: Theme; children: ReactNode }) {
  const [choice, setChoice] = useState<Theme | undefined>(initial)
  const [system, setSystem] = useState<Theme>(systemTheme)
  const theme = choice ?? system

  useEffect(() => onSystemThemeChange(() => setSystem(systemTheme())), [])
  useEffect(() => applyTheme(theme), [theme])

  const setTheme = (next: Theme) => {
    setChoice(next)
    void settingsService.setTheme(next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
