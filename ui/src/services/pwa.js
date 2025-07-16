// PWA Service for managing service worker and offline functionality

class PWAService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
    this.updateAvailable = false;
    this.listeners = {
      online: [],
      offline: [],
      update: [],
      installed: []
    };
    
    this.init();
  }

  async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Set up online/offline listeners
    this.setupNetworkListeners();
    
    // Set up beforeinstallprompt listener
    this.setupInstallPrompt();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration;
        
        console.log('Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                this.updateAvailable = true;
                this.emit('update', { registration, newWorker });
              } else {
                // First time install
                this.emit('installed', { registration });
              }
            }
          });
        });
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      console.log('App is online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
      console.log('App is offline');
    });
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Store the event so it can be triggered later
      this.installPromptEvent = event;
      
      console.log('PWA install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPromptEvent = null;
    });
  }

  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'SYNC_SUCCESS':
        console.log('Background sync successful:', data.action);
        break;
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.urls);
        break;
      default:
        console.log('Service Worker message:', data);
    }
  }

  // Event emitter methods
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // PWA installation methods
  async showInstallPrompt() {
    if (this.installPromptEvent) {
      const result = await this.installPromptEvent.prompt();
      console.log('Install prompt result:', result);
      
      this.installPromptEvent = null;
      return result;
    }
    return null;
  }

  canInstall() {
    return !!this.installPromptEvent;
  }

  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Service worker update methods
  async updateServiceWorker() {
    if (this.serviceWorker && this.updateAvailable) {
      const newWorker = this.serviceWorker.waiting;
      
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to use the new service worker
        window.location.reload();
      }
    }
  }

  // Offline functionality
  isOffline() {
    return !this.isOnline;
  }

  async cacheUrls(urls) {
    if (this.serviceWorker) {
      this.serviceWorker.active?.postMessage({
        type: 'CACHE_URLS',
        urls: urls
      });
    }
  }

  // Background sync for offline actions
  async scheduleBackgroundSync(action) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        // Store the action for background sync
        await this.storePendingAction(action);
        
        // Register background sync
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        
        console.log('Background sync scheduled');
      } catch (error) {
        console.error('Background sync registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Background sync not supported');
    }
  }

  async storePendingAction(action) {
    // Store in localStorage for now (should use IndexedDB in production)
    const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    
    const actionWithId = {
      ...action,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    };
    
    pendingActions.push(actionWithId);
    localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
    
    return actionWithId;
  }

  async getPendingActions() {
    return JSON.parse(localStorage.getItem('pendingActions') || '[]');
  }

  async removePendingAction(actionId) {
    const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    const filteredActions = pendingActions.filter(action => action.id !== actionId);
    localStorage.setItem('pendingActions', JSON.stringify(filteredActions));
  }

  // Push notification methods
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }
    return 'denied';
  }

  async subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
        });
        
        console.log('Push subscription:', subscription);
        return subscription;
      } catch (error) {
        console.error('Push subscription failed:', error);
        throw error;
      }
    }
    throw new Error('Push notifications not supported');
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility methods
  getNetworkStatus() {
    return {
      online: this.isOnline,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
      effectiveType: navigator.connection?.effectiveType || 'unknown'
    };
  }

  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return null;
  }

  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;