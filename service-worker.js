const CACHE_NAME = 'burpee-tracker-cache-v1';
// List of files to cache when the service worker is installed
const urlsToCache = [
    './', // Caches the root file (index.html)
    'index.html',
    'manifest.webmanifest'
];

// Installation: Caches the necessary assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching essential app shell assets');
                // Adds all listed files to the cache
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache during install:', error);
            })
    );
    // Forces the service worker to activate immediately
    self.skipWaiting();
});

// Activation: Cleans up old caches to save storage space
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete any caches that are not in the current whitelist
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of unmanaged clients
    );
});

// Fetch: Intercepts network requests and serves content from the cache first
self.addEventListener('fetch', (event) => {
    // Only intercept requests for files hosted by our origin
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache hit - return the cached response
                    if (response) {
                        return response;
                    }
                    // Cache miss - fetch from the network
                    return fetch(event.request);
                })
        );
    }
    // External requests (like the Tailwind CDN) are ignored by this handler
});

