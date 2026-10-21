// Offline support: keeps the app working in the gym with no signal.
const CACHE = 'formwork-c20f89e8';
const ASSETS = ['./', 'index.html', 'app.js?v=c20f89e8', 'three.min.js', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, res) => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') { e.respondWith(fetch(req).then(r => put('index.html', r)).catch(() => caches.match('index.html'))); return; }
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r)).catch(() => hit)));
  }
});
