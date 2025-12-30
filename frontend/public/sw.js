// Version - increment this to force cache refresh
// Use timestamp for automatic versioning on each deploy
const VERSION = 'v2.2.0-' + new Date().getTime();
const CACHE_NAME = `beermenu-${VERSION}`;
const RUNTIME_CACHE = `beermenu-runtime-${VERSION}`;
const DATA_CACHE = `beermenu-data-${VERSION}`;

// Max cache age: 5 minutes for HTML/JS/CSS (in milliseconds)
const MAX_CACHE_AGE = 5 * 60 * 1000;

// Only precache manifest - everything else network-first
const PRECACHE_URLS = [
  '/manifest.json'
];

// Files that should always be fetched from network first
const NETWORK_FIRST_URLS = [
  '/',
  '/index.html',
  '.js',
  '.css',
  '.tsx',
  '.ts'
];

// Install event - precache static assets and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Force immediate activation
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !name.includes(VERSION)) // Delete all old versions
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Taking control of all clients');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - aggressive network-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Always bypass cache for HTML, JS, CSS - force network
  const shouldBypassCache = NETWORK_FIRST_URLS.some(pattern => 
    url.pathname === pattern || url.pathname.endsWith(pattern)
  );

  if (shouldBypassCache) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          // Cache the fresh response
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Only use cache as last resort
          return caches.match(request);
        })
    );
    return;
  }

  // API requests - network first with short cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then(response => {
          // Clone and cache API responses with timestamp
          const responseClone = response.clone();
          caches.open(DATA_CACHE).then(cache => {
            const cacheResponse = new Response(responseClone.body, {
              status: responseClone.status,
              statusText: responseClone.statusText,
              headers: new Headers({
                ...Object.fromEntries(responseClone.headers.entries()),
                'sw-cached-at': Date.now().toString()
              })
            });
            cache.put(request, cacheResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            if (cached) {
              // Check cache age
              const cachedAt = cached.headers.get('sw-cached-at');
              if (cachedAt && (Date.now() - parseInt(cachedAt)) > MAX_CACHE_AGE) {
                // Cache too old, return error
                return new Response(
                  JSON.stringify({ error: 'Offline - data te oud' }),
                  { status: 503, headers: { 'Content-Type': 'application/json' } }
                );
              }
              return cached;
            }
            return new Response(
              JSON.stringify({ error: 'Offline - geen data beschikbaar' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Images and static assets - cache first for performance
  event.respondWith(
    caches.match(request).then(cached => {
      // Return cached version while fetching fresh in background
      const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Clear all caches on demand
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }).then(() => {
        // Notify client that cache is cleared
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
  
  // Get current version
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});
