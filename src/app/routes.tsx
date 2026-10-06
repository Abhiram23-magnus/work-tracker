import { useEffect, useState } from 'react'

export type Route =
  | { name: 'dashboard' }
  | { name: 'workers' }
  | { name: 'worker'; id: string }
  | { name: 'history' }

/** Hash routes (#/workers, #/workers/<id>) work offline and from any static host without server config. */
export function parseRoute(hash: string): Route {
  const [section, id] = hash.replace(/^#\/?/, '').split('/')
  if (section === 'workers' && id) return { name: 'worker', id: decodeURIComponent(id) }
  if (section === 'workers') return { name: 'workers' }
  if (section === 'history') return { name: 'history' }
  return { name: 'dashboard' }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'dashboard':
      return '#/'
    case 'workers':
      return '#/workers'
    case 'worker':
      return `#/workers/${encodeURIComponent(route.id)}`
    case 'history':
      return '#/history'
  }
}

export function navigate(route: Route) {
  window.location.hash = hrefFor(route)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
