// Offline support: pages load from the network when possible and fall back to the cached app shell.
// Built files have hashed names, so serving them from cache first is safe.
const CACHE = 'worker-tracker-v2'

self.addEventListener('install', (event) => {
  // Cache the page plus the script, styles and icons it links, so the app opens offline from the very first install.
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const html = await (await fetch('./index.html', { cache: 'no-cache' })).text()
      const linked = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(['./', './index.html', ...linked])
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
