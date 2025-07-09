import { useState, useEffect } from 'react';
import oneSignalService from '../../services/onesignal';

const NotificationSettings = ({ user }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [permissionState, setPermissionState] = useState('default');
  const [loading, setLoading] = useState(false); // No loading since we're using native bell

  // DISABLED: Let OneSignal native bell handle subscription
  // useEffect(() => {
  //   checkNotificationStatus();
  // }, []);

  const checkNotificationStatus = async () => {
    try {
      const subscribed = await oneSignalService.isSubscribed();
      const playerIdValue = await oneSignalService.getPlayerId();
      
      setIsSubscribed(subscribed);
      setPlayerId(playerIdValue);
      setPermissionState(Notification.permission);
      setLoading(false);
    } catch (error) {
      console.error('Error checking notification status:', error);
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      const permission = await oneSignalService.requestPermission();
      if (permission) {
        await checkNotificationStatus();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          userId: user.id || user.email,
          tenantId: user.tenantId || 'default',
          title: 'Test Notification',
          message: 'This is a test notification from your app!',
          type: 'test'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Test notification sent! Check your browser notifications.');
      } else {
        alert('Failed to send test notification: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending test notification');
    }
  };

  if (loading) {
    return (
      <div className="notification-settings loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h4>Push Notifications</h4>
      
      <div className="notification-native-info">
        <div className="alert alert-info">
          <i className="fas fa-bell"></i>
          <strong>Native OneSignal Bell Active</strong>
          <p>Push notifications are now handled by OneSignal's native bell widget. Look for the notification bell icon on your screen to subscribe and manage your notification preferences.</p>
        </div>
      </div>

      <div className="notification-actions mt-3">
        <button 
          className="btn btn-success me-2" 
          onClick={sendTestNotification}
          disabled={loading}
        >
          <i className="fas fa-paper-plane"></i> Send Test Notification
        </button>
        
        <button 
          className="btn btn-info me-2" 
          onClick={async () => {
            if (window.OneSignalDebug) {
              await window.OneSignalDebug.debugStatus();
            } else {
              console.log('OneSignal Debug not available');
            }
          }}
          disabled={loading}
        >
          <i className="fas fa-bug"></i> Debug Status
        </button>
        
        <button 
          className="btn btn-warning me-2" 
          onClick={async () => {
            if (window.OneSignalDebug) {
              await window.OneSignalDebug.forceSubscription();
            } else {
              console.log('OneSignal Debug not available');
            }
          }}
          disabled={loading}
        >
          <i className="fas fa-bell"></i> Force Subscribe
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          <i className="fas fa-sync"></i> Refresh Page
        </button>
      </div>

      <div className="notification-help mt-3">
        <small className="text-muted">
          <i className="fas fa-info-circle"></i> 
          OneSignal's native bell provides a better user experience for managing push notification subscriptions.
        </small>
      </div>

      <style jsx>{`
        .notification-settings {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          margin: 20px 0;
        }
        
        .notification-status {
          margin: 15px 0;
        }
        
        .status-item {
          margin: 10px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .status-item strong {
          min-width: 100px;
        }
        
        .notification-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .notification-help {
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
        
        code {
          font-size: 0.8em;
          background: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;
