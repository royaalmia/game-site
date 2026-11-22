// Minimal Cache-Falling-Back-to-Network Service Worker for PWA
const CACHE_NAME = 'ludustar-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle all API and socket requests directly
  if (event.request.url.includes('/api/') || event.request.url.includes('socket.io') || event.request.url.includes('onrender.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => fetch(event.request))
  );
});
