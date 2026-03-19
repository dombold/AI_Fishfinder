const CACHE_VERSION = 'v1'
const SHELL_CACHE = `fishfinder-shell-${CACHE_VERSION}`
const TILE_CACHE = `fishfinder-tiles-${CACHE_VERSION}`
const PLAN_CACHE = `fishfinder-plans-${CACHE_VERSION}`
const API_CACHE = `fishfinder-api-${CACHE_VERSION}`

const SHELL_ASSETS = [
  '/offline.html',
  '/favicon.svg',
  '/logo-mark.svg',
]

const TILE_MAX_ENTRIES = 200
const TILE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ─── Install ───────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate ──────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) =>
            key.startsWith('fishfinder-') &&
            ![SHELL_CACHE, TILE_CACHE, PLAN_CACHE, API_CACHE].includes(key)
          )
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Helpers ───────────────────────────────────────────────────────────────

function isMapTile(url) {
  return (
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('arcgisonline.com')
  )
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/')
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

function isApiGetRequest(request, url) {
  return url.pathname.startsWith('/api/') && request.method === 'GET'
}

async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE)
  const keys = await cache.keys()
  if (keys.length <= TILE_MAX_ENTRIES) return
  // Delete oldest entries (first-in-first-out via insertion order)
  const toDelete = keys.slice(0, keys.length - TILE_MAX_ENTRIES)
  await Promise.all(toDelete.map((key) => cache.delete(key)))
}

// ─── Fetch ─────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Static Next.js assets: cache-first (immutable, versioned filenames)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((c) => c.put(event.request, clone))
          }
          return response
        })
      )
    )
    return
  }

  // Map tiles: cache-first with LRU + TTL
  if (isMapTile(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) {
          const dateHeader = cached.headers.get('sw-cached-at')
          const age = dateHeader ? Date.now() - parseInt(dateHeader, 10) : Infinity
          if (age < TILE_MAX_AGE_MS) return cached
        }
        try {
          const response = await fetch(event.request)
          if (response.ok) {
            const headers = new Headers(response.headers)
            headers.set('sw-cached-at', String(Date.now()))
            const body = await response.arrayBuffer()
            const cached = new Response(body, { status: response.status, headers })
            await cache.put(event.request, cached.clone())
            trimTileCache()
            return cached
          }
          return response
        } catch {
          return cached || new Response('Tile unavailable offline', { status: 503 })
        }
      })
    )
    return
  }

  // Navigation requests: network-first, fall back to cached page, then offline.html
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(PLAN_CACHE).then((c) => c.put(event.request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          const offline = await caches.match('/offline.html')
          return offline || new Response('Offline', { status: 503 })
        })
    )
    return
  }

  // API GET requests: network-first, fall back to last cached response
  if (isApiGetRequest(event.request, url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then((c) => c.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Everything else: network only
  event.respondWith(fetch(event.request))
})

// ─── Background Sync (Chromium enhancement) ────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'pending-catches') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_CATCHES' }))
      })
    )
  }
})
