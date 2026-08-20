/**
 * RETRO CHAT — SERVICE WORKER
 */

const CACHE_NAME = 'retrochat-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/chat.css',
  './js/chat/store.js',
  './js/chat/audio.js',
  './js/chat/app.js',
  './js/utils/confetti.js',
  './manifest.json'
];

// Install Event: Cache Core Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup Old Caches Immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
