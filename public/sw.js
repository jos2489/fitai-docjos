// Service worker minimale: abilita l'installazione PWA e un caching base
// per l'uso offline dell'app (i dati utente restano in localStorage).
const CACHE = 'fitai-v10'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const isNavigation = e.request.mode === 'navigate'
  if (isNavigation) {
    // network-first per le pagine: gli aggiornamenti si vedono subito; offline -> cache
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
          return res
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('/index.html')))
    )
    return
  }
  // cache-first per gli asset (hashati e immutabili), con aggiornamento in background
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && e.request.url.startsWith(self.location.origin)) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
