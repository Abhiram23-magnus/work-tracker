import { useTheme } from './themeContext'
import type { Theme } from '../../services/settingsService'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="theme-toggle" role="group" aria-label="Screen theme">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" aria-pressed={theme === o.value} onClick={() => setTheme(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
