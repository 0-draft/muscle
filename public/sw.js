// Network first with a short timeout, cache fallback: current when online, and it still opens
// quickly on the weak signal of a basement gym.
const CACHE = 'muscle-v2';
const TIMEOUT_MS = 3000;
// Hashed /_astro/ files change on every deploy; keep the cache from growing forever.
const MAX_ENTRIES = 120;

async function put(request, response) {
  const cache = await caches.open(CACHE);
  await cache.put(request, response);
  const keys = await cache.keys(); // insertion order, oldest first
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((k) => cache.delete(k)));
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const cacheable = url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;

  const network = fetch(request).then((res) => {
    // Only cache real successes; fonts are requested with CORS so their status is visible.
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(put(request, copy));
    }
    return res;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
  e.respondWith(
    Promise.race([network, timeout.then(() => caches.match(request))])
      .then((res) => res ?? network)
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
