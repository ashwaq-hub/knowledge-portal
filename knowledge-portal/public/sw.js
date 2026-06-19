const CACHE = 'knowledge-portal-v1';
const STATIC_CACHE = 'knowledge-portal-static-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/site.webmanifest',
        '/favicon.svg',
        '/pwa-icon-192.svg',
        '/pwa-icon-512.svg',
        '/og-default.svg',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  const expected = [CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => !expected.includes(k)).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navFetch(event));
    return;
  }

  const isStatic = /\.(css|js|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|eot|ico)$/i.test(url.pathname);
  if (isStatic) {
    event.respondWith(cacheFirst(event));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(networkFirst(event));
});

async function navFetch(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

async function networkFirst(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
