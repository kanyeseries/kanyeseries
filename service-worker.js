importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

const PRECACHE_URLS = [
  './',
  './index.html',
  './products.html',
  './product.html',
  './cart.html',
  './checkout.html',
  './orders.html',
  './wishlist.html',
  './profile.html',
  './login.html',
  './signup.html',
  './forgot-password.html',
  './special-orders.html',
  './offline.html',
  './manifest.json',
  './screenshots/screen-phone.png',
  './screenshots/screen-desk.png',
  './images/logo.png',
  './images/logo2.png',
  './images/logo3.png',
  './admin-index.html',
  './admin-products.html',
  './admin-orders.html',
  './admin-users.html',
  './admin-special-orders.html',
  './admin-wishlist.html',
  './admin-cart.html',
  './admin-sales.html',
  './admin-profile.html',
  './admin-login.html',
  './admin-add-product.html',
  './admin-edit-product.html',
  './admin-order-details.html',
  './admin-user-details.html',
  './admin-categories.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => !['kanye-series-pages', 'kanye-series-static', 'kanye-series-cloudinary', 'kanye-series-images', 'kanye-series-runtime'].includes(name))
          .map((name) => caches.delete(name))
      ))
    ])
  );
});

if ('workbox' in self) {
  workbox.setConfig({ debug: false });
  workbox.core.setCacheNameDetails({ prefix: 'kanye-series-pwa', suffix: 'v1' });
  workbox.precaching.precacheAndRoute(PRECACHE_URLS.map((url) => ({ url, revision: null })));

  workbox.routing.registerRoute(
    ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin,
    new workbox.strategies.NetworkFirst({
      cacheName: 'kanye-series-pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ],
      fetchOptions: { credentials: 'same-origin' },
      matchOptions: { ignoreSearch: true }
    })
  );

  workbox.routing.registerRoute(
    ({ request, url }) => {
      if (request.method !== 'GET') return false;
      return /\.(?:css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico|avif)$/i.test(url.pathname);
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'kanye-series-static',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 250,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://res.cloudinary.com' || /cloudinary\.com/.test(url.hostname),
    new workbox.strategies.CacheFirst({
      cacheName: 'kanye-series-cloudinary',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 45 * 24 * 60 * 60,
          purgeOnQuotaError: true
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );

  workbox.routing.registerRoute(
    ({ url }) => /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(url.hostname),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'kanye-series-runtime',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true
        })
      ]
    })
  );

  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.mode === 'navigate') {
      return caches.match('./offline.html');
    }
    return Response.error();
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_SAFE_REQUEST') {
    event.waitUntil(
      fetch(event.data.url, { method: event.data.method || 'GET', headers: event.data.headers || {} })
        .then((response) => response.ok)
        .catch(() => false)
    );
  }
});

if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'refresh-public-content') {
      event.waitUntil(
        fetch('./products.html', { cache: 'no-store' }).catch(() => undefined)
      );
    }
  });
}
