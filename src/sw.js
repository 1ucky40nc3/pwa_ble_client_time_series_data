/**
 * Service Worker (sw.js)
 *
 * This service worker implements a "Network First, then Cache Fallback" caching strategy.
 *
 * - **Installation (`install` event):** Pre-caches essential application shell files.
 * `self.skipWaiting()` is used to activate the new service worker immediately.
 *
 * - **Activation (`activate` event):** Cleans up old caches and claims control
 * of existing client tabs using `self.clients.claim()` to ensure immediate
 * adoption of the new service worker.
 *
 * - **Fetch (`fetch` event):** Intercepts network requests.
 * 1. Attempts to fetch the resource from the network first.
 * 2. If successful, the network response is returned and also cached for future offline use.
 * 3. If the network request fails (e.g., offline), it falls back to serving the cached version of the resource.
 * Only GET requests are handled; other methods are ignored.
 *
 * To update cached files:
 * - For application shell updates (e.g., new `app.js`, `styles.css`), simply
 * upload the new files. The "Network First" strategy will fetch and cache
 * the latest version when the user is online.
 * - To force a re-caching of all pre-cached assets (e.g., if you change the
 * list of pre-cached files), increment the `CACHE_NAME` constant.
 */
const CACHE_NAME = "v1"; // Use a constant for cache name for easier updates

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/utils.js",
        "/app.js",
        "/manifest.json",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png",
      ]);
    })
  );
  // Force the waiting service worker to become active.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Delete old caches if any
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Claim clients to immediately control open tabs
  );
});

self.addEventListener("fetch", (event) => {
  // We only want to handle GET requests, not POST or others
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the network request was successful, update the cache and return the response
        // Only cache successful responses (status 200) and specific types
        if (networkResponse.ok) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});
