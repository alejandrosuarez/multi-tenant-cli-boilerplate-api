import OneSignal from 'react-onesignal';

class OneSignalService {
  constructor() {
    this.isInitialized = false;
    this.playerId = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Skip OneSignal initialization in development if not properly configured
    const isProduction = import.meta.env.PROD;
    const currentOrigin = window.location.origin;
    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    
    // Check if we're in development and OneSignal is not configured for localhost
    if (!isProduction && currentOrigin.includes('localhost')) {
      console.log('🔔 OneSignal disabled for localhost development environment');
      console.log('💡 To enable OneSignal in development, configure it for localhost in OneSignal dashboard');
      this.isInitialized = true; // Mark as initialized to prevent repeated attempts
      return;
    }

    if (!oneSignalAppId) {
      console.warn('⚠️  OneSignal App ID not configured, skipping initialization');
      this.isInitialized = true;
      return;
    }

    try {
      console.log('🔔 Initializing OneSignal for:', currentOrigin);
      
      // Initialize OneSignal
      await OneSignal.init({
        appId: oneSignalAppId,
        safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
        notifyButton: {
          enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
      });

      // Set up event listeners
      OneSignal.on('subscriptionChange', (isSubscribed) => {
        console.log('OneSignal subscription changed:', isSubscribed);
        if (isSubscribed) {
          this.handleSubscriptionChange();
        }
      });

      OneSignal.on('notificationPermissionChange', (permission) => {
        console.log('OneSignal notification permission changed:', permission);
      });

      this.isInitialized = true;
      console.log('✅ OneSignal initialized successfully');
    } catch (error) {
      console.error('❌ OneSignal initialization failed:', error);
      // Don't throw the error - just log it and continue
      this.isInitialized = true; // Mark as initialized to prevent repeated attempts
    }
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
