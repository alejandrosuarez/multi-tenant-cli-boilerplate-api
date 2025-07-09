import OneSignal from 'react-onesignal';

class OneSignalService {
  constructor() {
    this.isInitialized = false;
    this.playerId = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    const isProduction = import.meta.env.PROD;
    const currentOrigin = window.location.origin;
    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    
    // Skip initialization in development if not configured for localhost
    if (!isProduction && currentOrigin.includes('localhost')) {
      console.log('🔔 OneSignal disabled for localhost development environment');
      console.log('💡 To enable OneSignal in development, configure it for localhost in OneSignal dashboard');
      this.isInitialized = true;
      return;
    }

    if (!oneSignalAppId) {
      console.warn('⚠️  OneSignal App ID not configured, skipping initialization');
      this.isInitialized = true;
      return;
    }

    try {
      console.log('🔔 Initializing OneSignal with native bell for:', currentOrigin);
      
      // Initialize OneSignal with native bell enabled
      await OneSignal.init({
        appId: oneSignalAppId,
        safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
        notifyButton: {
          enable: true,
          size: 'medium',
          theme: 'default',
          position: 'bottom-right',
          colors: {
            'circle.background': '#0078ff',
            'circle.foreground': 'white',
            'badge.background': '#ff0000',
            'badge.foreground': 'white'
          }
        },
        allowLocalhostAsSecureOrigin: true,
        autoRegister: true,
        autoResubscribe: true,
      });

      // Set up event listeners for debugging
      OneSignal.on('subscriptionChange', (isSubscribed) => {
        console.log('🔔 OneSignal subscription changed:', isSubscribed);
        if (isSubscribed) {
          this.handleSubscriptionChange();
        }
      });

      OneSignal.on('notificationPermissionChange', (permission) => {
        console.log('🔔 OneSignal notification permission changed:', permission);
      });

      // Log current subscription status
      setTimeout(async () => {
        try {
          const isSubscribed = await OneSignal.isSubscribed();
          const playerId = await OneSignal.getPlayerId();
          console.log('📊 OneSignal Status Check:');
          console.log('  - Subscribed:', isSubscribed);
          console.log('  - Player ID:', playerId);
          console.log('  - Permission:', Notification.permission);
        } catch (error) {
          console.error('🚫 Error checking OneSignal status:', error);
        }
      }, 3000);

      this.isInitialized = true;
      console.log('✅ OneSignal initialized successfully with native bell');
    } catch (error) {
      console.error('❌ OneSignal initialization failed:', error);
      this.isInitialized = true;
    }
    
    // ORIGINAL CODE COMMENTED OUT FOR FUTURE REFERENCE
    /*
    const isProduction = import.meta.env.PROD;
    const currentOrigin = window.location.origin;
    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    
    if (!isProduction && currentOrigin.includes('localhost')) {
      console.log('🔔 OneSignal disabled for localhost development environment');
      this.isInitialized = true;
      return;
    }

    if (!oneSignalAppId) {
      console.warn('⚠️  OneSignal App ID not configured, skipping initialization');
      this.isInitialized = true;
      return;
    }

    try {
      await OneSignal.init({
        appId: oneSignalAppId,
        safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
        path: '/',
        autoRegister: true,
        autoResubscribe: true,
      });

      OneSignal.on('subscriptionChange', (isSubscribed) => {
        if (isSubscribed) {
          this.handleSubscriptionChange();
        }
      });

      this.isInitialized = true;
      console.log('✅ OneSignal initialized successfully');
    } catch (error) {
      console.error('❌ OneSignal initialization failed:', error);
      this.isInitialized = true;
    }
    */
  }

  async handleSubscriptionChange() {
    try {
      const playerId = await OneSignal.getPlayerId();
      this.playerId = playerId;
      console.log('OneSignal Player ID:', playerId);
      
      // Register the device with our backend
      if (playerId) {
        await this.registerDevice(playerId);
      }
    } catch (error) {
      console.error('Error getting OneSignal player ID:', error);
    }
  }
  
  async setExternalUserId(userId) {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping setExternalUserId');
      return;
    }
    
    try {
      await OneSignal.setExternalUserId(userId);
      console.log('OneSignal External User ID set:', userId);
    } catch (error) {
      console.error('Error setting OneSignal external user ID:', error);
    }
  }

  async registerDevice(playerId) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          deviceToken: playerId,
          tenantId: 'default' // You can make this dynamic based on user context
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Device registered successfully:', data);
      } else {
        console.error('Device registration failed:', data);
      }
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }

  async requestPermission() {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping permission request');
      return false;
    }
    
    try {
      const permission = await OneSignal.requestPermission();
      console.log('OneSignal permission granted:', permission);
      return permission;
    } catch (error) {
      console.error('OneSignal permission request failed:', error);
      return false;
    }
  }

  async getPlayerId() {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping getPlayerId');
      return null;
    }
    
    try {
      const playerId = await OneSignal.getPlayerId();
      this.playerId = playerId;
      return playerId;
    } catch (error) {
      console.error('Error getting OneSignal player ID:', error);
      return null;
    }
  }

  async isSubscribed() {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping isSubscribed');
      return false;
    }
    
    try {
      return await OneSignal.isSubscribed();
    } catch (error) {
      console.error('Error checking OneSignal subscription:', error);
      return false;
    }
  }

  async setUserEmail(email) {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping setUserEmail');
      return;
    }
    
    try {
      await OneSignal.setEmail(email);
      console.log('OneSignal email set:', email);
    } catch (error) {
      console.error('Error setting OneSignal email:', error);
    }
  }

  async setUserTags(tags) {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping setUserTags');
      return;
    }
    
    try {
      await OneSignal.sendTags(tags);
      console.log('OneSignal tags set:', tags);
    } catch (error) {
      console.error('Error setting OneSignal tags:', error);
    }
  }

  async showNotification(title, message, url) {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized, skipping showNotification');
      return;
    }
    
    try {
      await OneSignal.showLocalNotification(title, message, url);
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }
  
  // Debug method to check detailed subscription status
  async debugSubscriptionStatus() {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized');
      return;
    }
    
    try {
      console.log('\n🔍 OneSignal Debug Status:');
      console.log('=' .repeat(50));
      
      const isSubscribed = await OneSignal.isSubscribed();
      const playerId = await OneSignal.getPlayerId();
      const permission = await OneSignal.getNotificationPermission();
      const isPushSupported = OneSignal.isPushNotificationsSupported();
      
      console.log('Subscription Status:', isSubscribed);
      console.log('Player ID:', playerId);
      console.log('Permission:', permission);
      console.log('Push Supported:', isPushSupported);
      console.log('Browser Permission:', Notification.permission);
      
      // Check if service worker is registered
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('Service Worker Registrations:', registrations.length);
        registrations.forEach((reg, index) => {
          console.log(`  SW ${index + 1}:`, reg.scope);
        });
      }
      
      console.log('=' .repeat(50));
      
      return {
        isSubscribed,
        playerId,
        permission,
        isPushSupported,
        browserPermission: Notification.permission
      };
    } catch (error) {
      console.error('Error debugging OneSignal status:', error);
      return { error: error.message };
    }
  }
  
  // Method to manually trigger subscription (for debugging)
  async forceSubscription() {
    if (!this.isInitialized) {
      console.log('OneSignal not initialized');
      return;
    }
    
    try {
      console.log('🔔 Attempting to force subscription...');
      const permission = await OneSignal.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission) {
        // Wait a bit and check status
        setTimeout(async () => {
          const status = await this.debugSubscriptionStatus();
          console.log('Status after force subscription:', status);
        }, 2000);
      }
      
      return permission;
    } catch (error) {
      console.error('Error forcing subscription:', error);
      return false;
    }
  }
}

const oneSignalService = new OneSignalService();

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  window.OneSignalDebug = {
    service: oneSignalService,
    debugStatus: () => oneSignalService.debugSubscriptionStatus(),
    forceSubscription: () => oneSignalService.forceSubscription(),
    checkSubscription: () => oneSignalService.isSubscribed(),
    getPlayerId: () => oneSignalService.getPlayerId(),
    setExternalUserId: (id) => oneSignalService.setExternalUserId(id),
    setUserEmail: (email) => oneSignalService.setUserEmail(email)
  };
  
  console.log('🔔 OneSignal Debug Tools Available:');
  console.log('- window.OneSignalDebug.debugStatus()');
  console.log('- window.OneSignalDebug.forceSubscription()');
  console.log('- window.OneSignalDebug.checkSubscription()');
  console.log('- window.OneSignalDebug.getPlayerId()');
}

export default oneSignalService;
