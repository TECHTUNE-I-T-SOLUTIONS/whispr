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
  try {
    console.log('Push received');

    let data = {};
    try {
      if (event.data) data = event.data.json();
    } catch (e) {
      // Not JSON or malformed; try text
      try { data = { body: event.data.text() } } catch (_) { data = {} }
    }

    const options = {
      body: data.body || 'You have a new notification from Whispr',
      icon: data.icon || '/logotype.png',
      badge: data.badge || '/logotype.png',
      image: data.image || undefined,
      tag: data.tag || 'whispr-notification',
      requireInteraction: !!data.requireInteraction,
      silent: !!data.silent,
      data: {
        url: data.url || '/',
        type: data.type || 'general',
      },
      actions: Array.isArray(data.actions) ? data.actions : [
        { action: 'view', title: 'View', icon: '/logotype.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    event.waitUntil((async () => {
      try {
        await self.registration.showNotification(data.title || 'Whispr', options);
        // Also notify any open clients (tabs) so they can update UI in realtime
        try {
          const allClients = await clients.matchAll({ includeUncontrolled: true, type: 'window' })
          for (const client of allClients) {
            try {
              client.postMessage({ type: 'push', payload: data })
            } catch (e) {}
          }
        } catch (e) {}
      } catch (showErr) {
        // showNotification may fail in some contexts; log and swallow
        console.error('ServiceWorker: showNotification failed', showErr);
      }
    })());
  } catch (err) {
    console.error('ServiceWorker push handler error', err);
  }
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

// Listen for messages from clients (e.g., thank-you-share)
self.addEventListener('message', (event) => {
  try {
    const data = event.data
    if (!data || data.type !== 'thank-you-share') return
    const payload = data.payload || {}
    const title = payload.title || 'Thanks!'
    const options = {
      body: payload.message || 'Thanks for sharing Whispr!',
      icon: '/logotype.png',
      tag: 'whispr-thank-you',
      data: { url: '/' }
    }
    self.registration.showNotification(title, options).catch(()=>{})
  } catch (e) {}
})

async function doBackgroundSync() {
  // Handle any background sync tasks here
  console.log('Performing background sync...');
}
