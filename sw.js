const CACHE_NAME = 'snowwhite-v1';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/telegram.js',
  '/manifest.json'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(res => {
      return res || fetch(evt.request);
    })
  );
});
