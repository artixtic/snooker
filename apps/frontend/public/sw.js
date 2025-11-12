/**
 * Service Worker for API Response Caching
 * 
 * Caches API responses for offline access using Cache API.
 * This complements IndexedDB storage for better offline performance.
 */

const CACHE_NAME = 'snooker-pos-api-cache-v1';
// Note: Service Workers can't access process.env, so we'll detect API URLs from requests

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle API requests (requests to /api or external API domains)
  // Skip same-origin non-API requests and static assets
  if (url.origin === self.location.origin && !url.pathname.startsWith('/api')) {
    return; // Let browser handle non-API requests
  }
  
  // For external API requests, check if it's an API call
  // We'll cache any external requests that look like API calls
  const isApiRequest = url.pathname.startsWith('/api') || 
                       url.pathname.startsWith('/games') ||
                       url.pathname.startsWith('/tables') ||
                       url.pathname.startsWith('/products') ||
                       url.pathname.startsWith('/sales') ||
                       url.pathname.startsWith('/shifts');
  
  if (!isApiRequest) {
    return; // Let browser handle non-API requests
  }

  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // If cached and online, fetch fresh data in background
        if (cachedResponse && navigator.onLine) {
          fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
            })
            .catch(() => {
              // Ignore fetch errors in background update
            });
          return cachedResponse;
        }

        // If cached and offline, return cached response
        if (cachedResponse && !navigator.onLine) {
          return cachedResponse;
        }

        // If not cached, fetch and cache
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch((error) => {
            // If fetch fails and we have a cached version, return it
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          });
      });
    })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

