const CACHE_NAME = 'povmusic-cache-v2';
const urlsToCache = [
  '/POVMusic/',
  '/POVMusic/index.html',
  '/POVMusic/manifest.json',
  'https://fonts.googleapis.com/css2?family=Circular+Std:wght@400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate & Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Cache First for assets, Network First with Cache Fallback for dynamic content/audio
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Jika permintaan berasal dari folder audio atau songs, gunakan strategi Cache First
  if (requestUrl.pathname.includes('/audio/') || requestUrl.pathname.includes('/Songs/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Putar dari cache saat offline
        }
        return fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(() => {
          // Fallback jika gagal dan offline total
          console.log('Gagal memuat file audio secara offline.');
        });
      })
    );
    return;
  }

  // Strategi untuk halaman utama / aset lainnya
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/POVMusic/');
        }
      });
    })
  );
});
