import OneSignal from 'react-onesignal';

class OneSignalService {
  constructor() {
    this.isInitialized = false;
    this.playerId = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize OneSignal
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
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
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('OneSignal initialization failed:', error);
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
    try {
      return await OneSignal.isSubscribed();
    } catch (error) {
      console.error('Error checking OneSignal subscription:', error);
      return false;
    }
  }

  async setUserEmail(email) {
    try {
      await OneSignal.setEmail(email);
      console.log('OneSignal email set:', email);
    } catch (error) {
      console.error('Error setting OneSignal email:', error);
    }
  }

  async setUserTags(tags) {
    try {
      await OneSignal.sendTags(tags);
      console.log('OneSignal tags set:', tags);
    } catch (error) {
      console.error('Error setting OneSignal tags:', error);
    }
  }

  async showNotification(title, message, url) {
    try {
      await OneSignal.showLocalNotification(title, message, url);
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }
}

export default new OneSignalService();
