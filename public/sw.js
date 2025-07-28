const CACHE_NAME = 'ok-offline-v11'; // Bump version for Leaflet assets
const urlsToCache = [
  // Core app files
  '/',
  '/index.html',
  '/manifest.json',
  
  // PWA icons (all sizes for various devices)
  '/images/icon-16.png',
  '/images/icon-32.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/icon-1024.png',
  '/images/apple-touch-icon.png',
  
  // Data files for all years
  '/data/2023/camps.json',
  '/data/2023/art.json',
  '/data/2023/events.json',
  '/data/2024/camps.json',
  '/data/2024/art.json',
  '/data/2024/events.json',
  '/data/2025/camps.json',
  '/data/2025/art.json',
  '/data/2025/events.json',
  
  // GIS data for map functionality
  '/data/2025/gis/city_blocks.geojson',
  '/data/2025/gis/cpns.geojson',
  '/data/2025/gis/plazas.geojson',
  '/data/2025/gis/street_lines.geojson',
  '/data/2025/gis/trash_fence.geojson',
  
  // Leaflet map icons
  '/images/marker-icon.png',
  '/images/marker-icon-2x.png',
  '/images/marker-shadow.png',
  '/images/layers.png',
  '/images/layers-2x.png',
  
  // Note: The following assets have hashed filenames and are handled by
  // the service worker's runtime caching strategy:
  // - /assets/index-[hash].js (main app bundle)
  // - /assets/index-[hash].css (main styles)
  // - /assets/BerkeleyMono-*.woff2 (fonts)
];

// Map tile cache name (separate to manage size)
const TILE_CACHE_NAME = 'ok-offline-tiles-v1';
const MAX_TILE_CACHE_SIZE = 50; // Maximum number of tiles to cache

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache opened:', CACHE_NAME);
        
        // Cache files individually to identify failures
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.error('[Service Worker] Failed to cache:', url, error);
              // Continue with other files even if one fails
              // This ensures partial caching on install
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] All critical assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API requests (let them go to network)
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Handle OpenStreetMap tiles for Black Rock City area
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            return response;
          }
          
          // Fetch and cache the tile
          return fetch(request).then(response => {
            if (response.status === 200) {
              // Clone response before caching
              const responseToCache = response.clone();
              
              // Limit cache size by removing old tiles if needed
              cache.keys().then(keys => {
                if (keys.length >= MAX_TILE_CACHE_SIZE) {
                  // Remove oldest tile (FIFO)
                  cache.delete(keys[0]);
                }
                cache.put(request, responseToCache);
              });
            }
            return response;
          }).catch(() => {
            // Return a fallback tile or empty response when offline
            return new Response('', { status: 503, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // Cache strategy based on resource type
  if (request.method === 'GET') {
    // For hashed assets (immutable), use cache-first
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(
        caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            return fetch(request).then(response => {
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            });
          })
      );
      return;
    }

    // For data files (JSON, GeoJSON), use network-first with cache fallback
    if (url.pathname.includes('/data/') && 
        (url.pathname.endsWith('.json') || url.pathname.endsWith('.geojson'))) {
      event.respondWith(
        fetch(request)
          .then(response => {
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
      return;
    }

    // For navigation requests, use network-first
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .catch(() => caches.match('/'))
      );
      return;
    }

    // Default strategy: cache-first with network fallback
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }

          return fetch(request).then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful GET requests
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });

            return response;
          });
        })
        .catch(() => {
          // Offline fallback for navigation
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        })
    );
  }
});

// Background sync for data updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // This would be called when the device comes back online
  // The actual sync logic is handled by the app
  console.log('Background sync triggered');
}

// Push notifications for event reminders
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});