// Service Worker for ADHD Task Manager PWA
const CACHE_NAME = 'adhd-task-manager-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const STATIC_CACHE = 'static-cache-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/offline.html'
];

// Dynamic cache strategies
const CACHE_STRATEGIES = {
  networkFirst: [
    '/api/',
    '/auth/'
  ],
  cacheFirst: [
    '/static/',
    '/assets/',
    '.js',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ],
  staleWhileRevalidate: [
    '/data/',
    '.json'
  ]
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/offline.html'));
    }).then(() => {
      // Cache offline page separately to handle errors
      return caches.open(STATIC_CACHE).then((cache) => {
        return fetch('/offline.html').then(response => {
          if (response.ok) {
            return cache.put('/offline.html', response);
          }
        }).catch(() => {
          console.log('[ServiceWorker] Offline page not available');
        });
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE && 
                   cacheName !== STATIC_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network First Strategy (API calls)
  if (CACHE_STRATEGIES.networkFirst.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache First Strategy (static assets)
  if (CACHE_STRATEGIES.cacheFirst.some(pattern => 
    url.pathname.includes(pattern) || url.pathname.endsWith(pattern)
  )) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale While Revalidate Strategy (data)
  if (CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => 
    url.pathname.includes(pattern) || url.pathname.endsWith(pattern)
  )) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default strategy - Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// Cache strategies implementation
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || offlineResponse();
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return offlineResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || offlineResponse();
  }
}

function offlineResponse() {
  return caches.match('/offline.html').then(response => {
    return response || new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  });
}

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    const cache = await caches.open('pending-tasks');
    const requests = await cache.keys();
    
    const promises = requests.map(async (request) => {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[ServiceWorker] Sync failed for:', request.url);
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('[ServiceWorker] Background sync error:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Task',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ADHD Task Manager', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync for reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

async function checkReminders() {
  // Check for pending reminders and show notifications
  try {
    const response = await fetch('/api/reminders/pending');
    if (response.ok) {
      const reminders = await response.json();
      reminders.forEach(reminder => {
        self.registration.showNotification('Task Reminder', {
          body: reminder.message,
          icon: '/logo192.png',
          tag: `reminder-${reminder.id}`
        });
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to check reminders:', error);
  }
}

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});