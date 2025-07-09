import OneSignal from 'react-onesignal';

class OneSignalService {
  constructor() {
    this.isInitialized = false;
    this.playerId = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // DISABLED: Let OneSignal handle native bell notification system
    // OneSignal provides a better built-in bell UI that handles subscription flow
    console.log('🔔 OneSignal custom implementation disabled');
    console.log('💡 OneSignal native bell will handle subscriptions automatically');
    console.log('🎯 Users can subscribe via OneSignal bell widget');
    
    this.isInitialized = true;
    return;
    
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
}

export default new OneSignalService();
