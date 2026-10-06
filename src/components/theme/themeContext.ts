import { createContext, useContext } from 'react'
import type { Theme } from '../../services/settingsService'

export interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeState>({ theme: 'light', setTheme: () => {} })

export const useTheme = () => useContext(ThemeContext)
