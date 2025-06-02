const CACHE_NAME = 'Gomoku-cache-v2'; // Increment cache version
const urlsToCache = [
  './',             // Cache the root directory
  './Gomoku.html',   // Assuming the main HTML file is Gomoku.html (or change to index.html if renamed)
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install event: Cache the app shell
self.addEventListener('install', event => {
  console.log('Service Worker: Installing Gomoku Cache...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Use { cache: 'reload' } to bypass HTTP cache when fetching during install
        const cachePromises = urlsToCache.map(urlToCache => {
            try {
                return cache.add(new Request(urlToCache, {cache: 'reload'}));
            } catch (e) {
                console.error(`Service Worker: Failed to create request for ${urlToCache}`, e);
                return Promise.resolve();
            }
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Activate worker immediately
      .catch(error => {
          console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating Gomoku Cache...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Ensure we only delete caches related to this app and not the current one
          if (cache !== CACHE_NAME && cache.startsWith('Gomoku-cache-')) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of pages immediately
  );
});

// Fetch event: Serve from cache or network (Cache-first, update cache on network fetch)
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque') || (networkResponse.type === 'basic' && networkResponse.status !== 200)) {
              return networkResponse;
            }

            // Clone the response to use in cache
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Service Worker: Fetch failed:', error);
            // Fallback for navigation requests if fetch fails (e.g., offline)
            if (event.request.mode === 'navigate') {
                console.log('Service Worker: Fetch failed, returning offline page.');
                // Ensure this path matches the main HTML file listed in urlsToCache
                return caches.match('./Gomoku.html'); // Or './index.html' if you renamed it
            }
        });
      })
  );
});
