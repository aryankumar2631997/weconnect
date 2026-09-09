// Minimal service worker for WeConnect's customer-facing pages.
// Goal: make the site installable and let the app shell (HTML/CSS/JS)
// load instantly on repeat visits, even on a flaky connection — this
// does NOT try to cache API responses, since leads/services/config
// data must always be fresh.
const CACHE_NAME = 'weconnect-shell-v1';
const APP_SHELL = [
    '/index.html',
    '/services.html',
    '/request.html',
    '/css/reset.css',
    '/css/variables.css',
    '/css/layout.css',
    '/css/components.css',
    '/js/api.js',
    '/js/app.js',
    '/js/services.js',
    '/js/request.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Never cache API calls or the admin dashboard — always hit the network.
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
        return;
    }

    // App shell: cache-first, falling back to network (and caching the result).
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
