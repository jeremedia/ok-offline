const buildRevision = new URL(self.location.href).searchParams.get('build') || 'development'
const APP_CACHE = `ok-offline-app-${buildRevision}`
const DATA_CACHE = `ok-offline-data-${buildRevision}`
const TILE_CACHE = `ok-offline-tiles-${buildRevision}`
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/apple-touch-icon.png'
]
const MAX_TILE_CACHE_SIZE = 500

async function cacheShell() {
  const cache = await caches.open(APP_CACHE)
  await cache.addAll(SHELL)
}

self.addEventListener('install', event => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('ok-offline-') && ![APP_CACHE, DATA_CACHE, TILE_CACHE].includes(name)) {
        await caches.delete(name)
      }
    }
    await self.clients.claim()
  })())
})

async function networkFirst(request, cacheName, fallback = null) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch (error) {
    return (await cache.match(request, { ignoreVary: true })) || fallback || Promise.reject(error)
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  // These caches contain only same-origin, revisioned resources. Preview and
  // proxy servers may add `Vary: Origin`; ignoring it prevents an equivalent
  // offline subresource request from missing the response cached by the worker.
  const cached = await cache.match(request, { ignoreVary: true })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

async function tileResponse(request) {
  const cache = await caches.open(TILE_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const keys = await cache.keys()
      const overflow = keys.length - MAX_TILE_CACHE_SIZE + 1
      if (overflow > 0) await Promise.all(keys.slice(0, overflow).map(key => cache.delete(key)))
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503, statusText: 'Tile unavailable offline' })
  }
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) return

  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(tileResponse(request))
    return
  }

  // Published season files may change at each release phase. Always try the
  // network first and fall back to the selected-season cache when offline.
  if (url.origin === self.location.origin && url.pathname.startsWith('/data/')) {
    const unavailable = new Response(JSON.stringify({ error: 'Data unavailable offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
    event.respondWith(networkFirst(request, DATA_CACHE, unavailable))
    return
  }

  // Vite assets are content-hashed and immutable.
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, APP_CACHE))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, APP_CACHE, caches.match('/')))
    return
  }

  if (url.origin === self.location.origin || url.hostname.includes('burningman.widen.net')) {
    event.respondWith(cacheFirst(request, APP_CACHE).catch(() => new Response('', { status: 503 })))
  }
})

self.addEventListener('message', event => {
  const respond = payload => event.ports?.[0]?.postMessage(payload)
  const message = event.data || {}
  event.waitUntil((async () => {
    try {
      if (message.type === 'CACHE_DATA') {
        const cache = await caches.open(DATA_CACHE)
        await Promise.all(message.data.map(async url => {
          const response = await fetch(url, { cache: 'no-store' })
          if (!response.ok) throw new Error(`${url} returned ${response.status}`)
          await cache.put(url, response)
        }))
      } else if (message.type === 'CACHE_ASSETS') {
        const cache = await caches.open(APP_CACHE)
        await Promise.all(message.data.map(async rawUrl => {
          const url = new URL(rawUrl, self.location.origin)
          if (url.origin !== self.location.origin || !url.pathname.startsWith('/assets/')) {
            throw new Error(`Refusing to cache non-build asset: ${url.pathname}`)
          }
          const response = await fetch(url, { cache: 'no-store' })
          if (!response.ok) throw new Error(`${url.pathname} returned ${response.status}`)
          await cache.put(url, response)
        }))
      } else if (message.type === 'CLEAR_CACHE') {
        await caches.delete(message.data === 'data' ? DATA_CACHE : APP_CACHE)
      } else if (message.type === 'SKIP_WAITING') {
        await self.skipWaiting()
      }
      respond({ ok: true, buildRevision })
    } catch (error) {
      respond({ error: error.message })
    }
  })())
})
