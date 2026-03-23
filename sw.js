/* ===========================
   Weather Now – Service Worker
   =========================== */

// Bump on each deploy to bust stale cached assets\nconst CACHE_NAME = 'wx-cache-v1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './assets/images/logo.svg',
    './assets/images/favicon-32x32.png',
    './assets/images/icon-search.svg',
    './assets/images/icon-units.svg',
    './assets/images/icon-dropdown.svg',
    './assets/images/icon-checkmark.svg',
    './assets/images/icon-loading.svg',
    './assets/images/icon-error.svg',
    './assets/images/icon-retry.svg',
    './assets/images/bg-today-large.svg',
    './assets/images/bg-today-small.svg',
    './assets/images/icon-sunny.webp',
    './assets/images/icon-partly-cloudy.webp',
    './assets/images/icon-overcast.webp',
    './assets/images/icon-fog.webp',
    './assets/images/icon-drizzle.webp',
    './assets/images/icon-rain.webp',
    './assets/images/icon-snow.webp',
    './assets/images/icon-storm.webp',
];

const API_ORIGINS = [
    'geocoding-api.open-meteo.com',
    'api.open-meteo.com',
    'nominatim.openstreetmap.org',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    const isApi = API_ORIGINS.some(origin => url.hostname.includes(origin));

    if (isApi) {
        event.respondWith(networkFirst(request));
    } else {
        event.respondWith(cacheFirst(request));
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached ?? new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
