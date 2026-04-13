// Telos Client Portal Service Worker
// Handles push notifications and basic caching

var CACHE_NAME = 'telos-v1';
var STATIC_ASSETS = [
  '/client-dashboard',
  '/manifest.json',
  '/images/telos-icon-192.png',
  '/images/telos-icon-512.png'
];

// Install - cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first for API, cache first for static
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API calls - network only (don't cache)
  if (url.pathname.startsWith('/api/')) return;

  // Fonts - cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        });
      })
    );
    return;
  }

  // Static assets - network first with cache fallback
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

// Push notification handler
self.addEventListener('push', function(event) {
  var data = {};
  if (event.data) {
    try { data = event.data.json(); } catch(e) {
      data = { title: 'Telos', body: event.data.text() };
    }
  }

  var title = data.title || 'Telos';
  var options = {
    body: data.body || '',
    icon: '/images/telos-icon-192.png',
    badge: '/images/telos-icon-192.png',
    tag: data.tag || 'telos-notification',
    data: { url: data.url || '/client-dashboard' },
    vibrate: [50, 30, 50]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/client-dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      // Focus existing window if open
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url.indexOf('/client-dashboard') !== -1) {
          return clients[i].focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
