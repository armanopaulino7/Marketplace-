const CACHE_NAME = 'cashluanda-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://picsum.photos/seed/cashluanda/192/192',
  'https://picsum.photos/seed/cashluanda/512/512'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback for offline if needed
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Push Event (for notifications)
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'CashLuanda';
  const options = {
    body: data.message || 'Você recebeu uma nova notificação.',
    icon: 'https://picsum.photos/seed/cashluanda/192/192',
    badge: 'https://picsum.photos/seed/cashluanda/192/192',
    data: {
      link: data.link || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const link = event.notification.data.link;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === link && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
