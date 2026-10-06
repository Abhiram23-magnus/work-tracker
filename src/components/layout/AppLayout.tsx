import type { ReactNode } from 'react'
import { hrefFor, type Route } from '../../app/routes'

const NAV: { label: string; route: Route; active: (r: Route) => boolean }[] = [
  { label: 'Dashboard', route: { name: 'dashboard' }, active: (r) => r.name === 'dashboard' },
  { label: 'Workers', route: { name: 'workers' }, active: (r) => r.name === 'workers' || r.name === 'worker' },
  { label: 'History', route: { name: 'history' }, active: (r) => r.name === 'history' },
]

export function AppLayout({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Worker Tracker</span>
      </header>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Main">
        {NAV.map((item) => (
          <a
            key={item.label}
            href={hrefFor(item.route)}
            className="bottom-nav-link"
            aria-current={item.active(route) ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
