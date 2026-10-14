// Cache only the connection-help page. Never cache sheets, snapshots or app code:
// normal HTTP fetching keeps existing live-data and release behavior intact.
const OFFLINE_CACHE = 'lcc-offline-v1';
const OFFLINE_URL = new URL('offline.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add(new Request(OFFLINE_URL, {cache:'reload'}))).then(() => self.skipWaiting()));
});
// Reuse this registration for PWA navigation and FCM; never install a competing worker.
if (self.registration.pushManager && self.registration.showNotification) importScripts('./push-worker.js');
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('lcc-offline-') && key !== OFFLINE_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.mode !== 'navigate' || !event.request.url.startsWith(self.registration.scope))return;
  event.respondWith(fetch(event.request).catch(async () => {
    const fallback = await caches.match(OFFLINE_URL, {cacheName:OFFLINE_CACHE});
    return fallback || new Response('LCC needs an internet connection. Please reconnect and reload.', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
