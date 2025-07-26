/*
 * Service worker for the Burning Man 2025 offline guide.
 *
 * This script implements two caching strategies:
 *  - Core assets (HTML, CSS, JS, GeoJSON and third‑party libraries) are
 *    precached during installation and served from the cache when
 *    requested.  If they aren’t in cache they fall back to the network.
 *  - Requests to the Burning Man Public API use a network‑first strategy
 *    so that fresh data is returned when online.  Responses are stored in
 *    a separate data cache and used when offline.
 */

const CACHE_NAME = 'bm25-shell-v1';
const DATA_CACHE_NAME = 'bm25-data-v1';

// Files that make up the application shell.  These should be
// versioned or hashed in a production environment.  Additional
// geojson files can be added here when downloaded for offline use.
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/example.geojson',
  'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  const { request } = evt;
  const url = new URL(request.url);
  // If the request is to the Burning Man API use a network‑first
  if (url.origin === 'https://api.burningman.org' || url.pathname.includes('/api/v1/')) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // On network failure return from cache if available
            return cache.match(request.url);
          });
      })
    );
    return;
  }
  // Otherwise use cache‑first strategy for application shell
  evt.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).catch(() => {
          // As a fallback you could return an offline page here
          // but for this simple app we just fail silently.
        })
      );
    })
  );
});