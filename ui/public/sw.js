// Enhanced Service Worker for PWA functionality and intelligent caching
const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `api-cache-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `image-cache-${CACHE_VERSION}`;

// Cache size limits
const CACHE_LIMITS = {
  [DYNAMIC_CACHE_NAME]: 50,
  [API_CACHE_NAME]: 100,
  [IMAGE_CACHE_NAME]: 200
};

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/placeholder.svg'
];

// API endpoints to cache with different strategies
const API_CACHE_CONFIG = {
  // Long-term cache (30 minutes)
  longTerm: {
    patterns: [/\/api\/categories/, /\/api\/tenants/],
    maxAge: 30 * 60 * 1000
  },
  // Medium-term cache (10 minutes)
  mediumTerm: {
    patterns: [/\/api\/entities/, /\/api\/media/],
    maxAge: 10 * 60 * 1000
  },
  // Short-term cache (2 minutes)
  shortTerm: {
    patterns: [/\/api\/notifications/, /\/api\/analytics/],
    maxAge: 2 * 60 * 1000
  },
  // No cache
  noCache: {
    patterns: [/\/api\/auth/, /\/api\/logs/, /\/api\/feedback/],
    maxAge: 0
  }
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('Service Worker: Caching static files');
          return cache.addAll(STATIC_FILES);
        }),
      // Initialize other caches
      caches.open(DYNAMIC_CACHE_NAME),
      caches.open(API_CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME)
    ])
    .then(() => {
      console.log('Service Worker: Static files cached');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('Service Worker: Failed to cache static files', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Route to appropriate handler
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

// Get cache configuration for API endpoint
function getApiCacheConfig(url) {
  for (const [key, config] of Object.entries(API_CACHE_CONFIG)) {
    if (config.patterns.some(pattern => pattern.test(url.pathname))) {
      return { type: key, ...config };
    }
  }
  return { type: 'default', patterns: [], maxAge: 5 * 60 * 1000 };
}

// Check if cached response is still valid
function isCacheValid(response, maxAge) {
  if (!response) return false;
  
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return false;
  
  return Date.now() - parseInt(cachedTime) < maxAge;
}

// Add cache metadata to response
function addCacheMetadata(response) {
  const newResponse = response.clone();
  newResponse.headers.set('sw-cached-time', Date.now().toString());
  return newResponse;
}

// Handle API requests with intelligent caching
async function handleApiRequest(request) {
  // Temporarily bypass service worker for API requests to debug CORS issues
  console.log('Service Worker: Bypassing cache for API request:', request.url);
  return fetch(request);
  
  /* Original caching logic - disabled for debugging
  const url = new URL(request.url);
  const cacheConfig = getApiCacheConfig(url);
  
  // Don't cache certain endpoints
  if (cacheConfig.maxAge === 0) {
    return fetch(request);
  }
  */
  
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still valid
  if (cachedResponse && isCacheValid(cachedResponse, cacheConfig.maxAge)) {
    console.log('Service Worker: Serving from API cache', url.pathname);
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseToCache = addCacheMetadata(networkResponse);
      cache.put(request, responseToCache);
      
      // Limit cache size
      await limitCacheSize(API_CACHE_NAME, CACHE_LIMITS[API_CACHE_NAME]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request', error);
    
    // Return stale cache if available
    if (cachedResponse) {
      console.log('Service Worker: Serving stale cache for', url.pathname);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable and no cached data',
        offline: true,
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('Service Worker: Serving image from cache');
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(IMAGE_CACHE_NAME, CACHE_LIMITS[IMAGE_CACHE_NAME]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch image', error);
    
    // Return placeholder image
    return caches.match('/placeholder.svg');
  }
}

// Limit cache size by removing oldest entries
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`Service Worker: Cleaned ${keysToDelete.length} entries from ${cacheName}`);
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses in dynamic cache
      const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
      dynamicCache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE_NAME, CACHE_LIMITS[DYNAMIC_CACHE_NAME]);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static resource', error);
    
    // Return fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from pending list
        await removePendingAction(action.id);
        
        // Notify clients of successful sync
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              action: action
            });
          });
        });
      } catch (error) {
        console.error('Background sync failed for action:', action, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Helper functions for managing pending actions
async function getPendingActions() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingAction(actionId) {
  // This would typically remove from IndexedDB
  console.log('Removing pending action:', actionId);
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Entity Management', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
  
  if (event.data && event.data.type === 'CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('Service Worker: All caches cleared');
}

console.log('Service Worker: Enhanced version loaded');