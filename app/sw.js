// Chekd Cars service worker: cache-first app shell, network-first for Supabase, offline fallback.
const VERSION = 'chekd-app-v1.0.0';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './js/motion.js', './js/core.js', './js/views.js', './js/ui.js', './js/detail.js', './js/forms.js', './js/spin.js',
  './manifest.webmanifest', './data/listings.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/favicon-64.png', './icons/apple-touch-icon.png',
];
const LAZY = ['./img/hero.webp', './img/doorstep.webp', './img/mechanic.webp'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).then(() => c.addAll(LAZY).catch(() => {}))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('chekd-app-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && res.ok && res.type !== 'opaque') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; };

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return; // lead POSTs go straight to the network
  // Supabase: network-first, cached copy only when offline
  if (url.hostname.endsWith('.supabase.co')) {
    e.respondWith(fetch(req).then((r) => put(req, r)).catch(() => caches.match(req).then((m) => m || new Response('[]', { status: 503, headers: { 'Content-Type': 'application/json' } }))));
    return;
  }
  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((m) => { const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => m); return m || net; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // listings: network-first so prices stay fresh, cache as fallback
  if (url.pathname.endsWith('/data/listings.json')) {
    e.respondWith(fetch(req).then((r) => put(req, r)).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // navigations: serve the cached shell, fall back to it offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => put('./index.html', r)).catch(() => caches.match('./index.html')));
    return;
  }
  // everything else in scope: cache-first
  e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => put(req, r)).catch(() => (req.destination === 'image'
    ? new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#161c25"/></svg>', { headers: { 'Content-Type': 'image/svg+xml' } })
    : Response.error()))));
});
