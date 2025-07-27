// Enhanced Service Worker for OK-OFFLINE
// Optimized for fast initial load and better onboarding experience

const CACHE_VERSION = 'v7'; // Increment for v3.2.0 mobile-enhanced release
const CACHE_NAMES = {
  static: `ok-offline-static-${CACHE_VERSION}`,
  data: `ok-offline-data-${CACHE_VERSION}`,
  images: `ok-offline-images-${CACHE_VERSION}`,
  api: `ok-offline-api-${CACHE_VERSION}`
};

// Critical resources for fast initial load
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/style.css',
  '/src/main.js',
  '/src/App.vue',
  '/src/components/WelcomeScreen.vue',
  '/src/components/GuidedTour.vue',
  '/src/components/ProgressiveLoader.vue',
  '/src/components/ToastNotification.vue'
];

// Data files for progressive loading
const DATA_RESOURCES = [
  '/data/2024/camps.json',
  '/data/2024/art.json', 
  '/data/2024/events.json',
  '/data/2025/camps.json',
  '/data/2025/art.json',
  '/data/2025/events.json',
  '/data/2023/camps.json',
  '/data/2023/art.json',
  '/data/2023/events.json'
];

// Install event - aggressive caching for critical resources
self.addEventListener('install', event => {
  console.log('[SW] Installing enhanced service worker');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources immediately
      caches.open(CACHE_NAMES.static).then(cache => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Pre-cache current year data (2024) for faster onboarding
      caches.open(CACHE_NAMES.data).then(cache => {
        console.log('[SW] Pre-caching 2024 data');
        const currentYearData = DATA_RESOURCES.filter(url => url.includes('/2024/'));
        return cache.addAll(currentYearData).catch(err => {
          console.warn('[SW] Some 2024 data files not available:', err);
        });
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('[SW] Activating enhanced service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const validCacheNames = Object.values(CACHE_NAMES);
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCacheNames.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete, controlling all clients');
    })
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different resource types with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/data/')) {
    // Data files - cache first (they don't change often)
    event.respondWith(handleDataRequest(request));
  } else if (isImageRequest(request)) {
    // Images - cache first with network fallback
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    // Static assets - cache first
    event.respondWith(handleStaticRequest(request));
  } else {
    // Navigation requests - cache first with network fallback
    event.respondWith(handleNavigationRequest(request));
  }
});

// API request handler - network first, cache for offline
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAMES.api);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses with short TTL
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[SW] API network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a basic error response
    return new Response(
      JSON.stringify({ error: 'Offline - please try again when connected' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Data request handler - cache first, update in background
async function handleDataRequest(request) {
  const cache = await caches.open(CACHE_NAMES.data);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    console.log('[SW] Serving data from cache:', request.url);
    
    // Update cache in background if needed
    updateDataInBackground(request, cache);
    
    return cachedResponse;
  }
  
  // No cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch data:', request.url);
    return new Response('Data not available offline', { status: 404 });
  }
}

// Static asset handler - cache first, long TTL
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    // Return the main app for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/');
    }
    throw error;
  }
}

// Image handler - cache first with compression
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder for failed images
    return new Response('', { status: 404 });
  }
}

// Navigation handler - app shell pattern
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  
  try {
    // Try cache first for faster loading
    const cachedResponse = await cache.match('/');
    if (cachedResponse) {
      // Update in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Ignore network errors for navigation
      });
      
      return cachedResponse;
    }
    
    // No cache, try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put('/', networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Last resort - return basic HTML
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>OK-OFFLINE</title></head>
      <body>
        <h1>OK-OFFLINE</h1>
        <p>Loading... Please check your connection.</p>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}

// Background data update
async function updateDataInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
      console.log('[SW] Updated cache in background:', request.url);
    }
  } catch (error) {
    // Ignore background update errors
    console.log('[SW] Background update failed:', request.url);
  }
}

// Helper functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname.startsWith('/src/') ||
         url.pathname.startsWith('/fonts/');
}

// Background sync for data updates
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  } else if (event.tag === 'sync-app-data') {
    event.waitUntil(syncAppData());
  }
});

async function syncUserData() {
  // Sync user favorites, schedule, etc. when back online
  console.log('[SW] Syncing user data...');
  try {
    // Notify main app that sync is available
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_AVAILABLE', data: 'user' });
    });
  } catch (error) {
    console.error('[SW] User data sync failed:', error);
  }
}

async function syncAppData() {
  // Sync latest BM data when back online
  console.log('[SW] Syncing app data...');
  try {
    // Clear old data cache to force refresh
    await caches.delete(CACHE_NAMES.data);
    
    // Notify main app
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_AVAILABLE', data: 'app' });
    });
  } catch (error) {
    console.error('[SW] App data sync failed:', error);
  }
}

// Push notifications for schedule reminders
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'OK-OFFLINE', options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// Notification interaction handlers
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Open the app to the relevant page
  event.waitUntil(
    clients.openWindow(data.url || '/')
  );
});

// Message handler for communication with main app
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_DATA':
      // Pre-cache specific data files
      event.waitUntil(cacheDataFiles(data));
      break;
      
    case 'CLEAR_CACHE':
      // Clear specific cache
      event.waitUntil(clearCache(data));
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function cacheDataFiles(files) {
  const cache = await caches.open(CACHE_NAMES.data);
  return Promise.all(
    files.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          return cache.put(url, response);
        }
      }).catch(err => console.warn('[SW] Failed to cache:', url))
    )
  );
}

async function clearCache(cacheName) {
  const fullCacheName = CACHE_NAMES[cacheName];
  if (fullCacheName) {
    return caches.delete(fullCacheName);
  }
}

console.log('[SW] Enhanced service worker loaded');