import type { ReactNode } from 'react'
import { hrefFor, type Route } from '../../app/routes'
import { FieldScene } from './FieldScene'
import { ThemeToggle } from '../theme/ThemeToggle'
import { StorageNotice } from './StorageNotice'

// Simple line icons help farmers who read slowly find the right tab.
const ICONS = {
  // Sprout: today on the farm
  dashboard: 'M12 21v-8m0 0c0-4 3-6 7-6 0 4-3 6-7 6Zm0-2C12 8 9.5 6 5 6c0 4 2.5 5 7 5Z',
  // Two people
  workers: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .7 3 2.8 3 6',
  // Notebook with lines
  history: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM9 3v18M12 8h4M12 12h4M12 16h4',
}

const NAV: { label: string; icon: keyof typeof ICONS; route: Route; active: (r: Route) => boolean }[] = [
  { label: 'Dashboard', icon: 'dashboard', route: { name: 'dashboard' }, active: (r) => r.name === 'dashboard' },
  { label: 'Workers', icon: 'workers', route: { name: 'workers' }, active: (r) => r.name === 'workers' || r.name === 'worker' },
  { label: 'History', icon: 'history', route: { name: 'history' }, active: (r) => r.name === 'history' },
]

export function AppLayout({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="app">
      <header className={`app-header${route.name === 'dashboard' ? ' app-header-tall' : ''}`}>
        <FieldScene />
        <div className="app-header-text">
          <span className="app-title">Worker Tracker</span>
          <span className="app-tagline">Farm worker notebook</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="app-main">
        <StorageNotice />
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Main">
        {NAV.map((item) => (
          <a
            key={item.label}
            href={hrefFor(item.route)}
            className="bottom-nav-link"
            aria-current={item.active(route) ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" className="nav-icon" aria-hidden="true">
              <path d={ICONS[item.icon]} />
            </svg>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
