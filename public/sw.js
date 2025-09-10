// Service Worker for Push Notifications
const CACHE_NAME = 'whispr-push-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  let data = {};

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'You have a new notification from Whispr',
  icon: '/logotype.png',
  badge: '/logotype.png',
  image: data.image || '/logotype.png',
    tag: data.tag || 'whispr-notification',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      url: data.url || '/',
      type: data.type || 'general'
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/logotype.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Whispr', options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const notificationData = event.notification.data;
  let url = '/';

  if (event.action === 'view' && notificationData.url) {
    url = notificationData.url;
  } else if (notificationData.url) {
    url = notificationData.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for failed requests (optional)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any background sync tasks here
  console.log('Performing background sync...');
}
