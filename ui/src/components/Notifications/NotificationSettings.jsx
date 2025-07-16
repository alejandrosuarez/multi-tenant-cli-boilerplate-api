import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import oneSignalService from '../../services/onesignal';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const {
    preferences,
    updatePreferences,
    requestNotificationPermission,
    NOTIFICATION_TYPES
  } = useNotifications();
  
  const { user } = useAuth();
  
  
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [permissionState, setPermissionState] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
    checkNotificationStatus();
  }, [preferences]);

  const checkNotificationStatus = async () => {
    try {
      const subscribed = await oneSignalService.isSubscribed();
      setIsSubscribed(subscribed);
      setPermissionState(Notification.permission);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleGlobalToggle = (type, enabled) => {
    setLocalPreferences(prev => ({
      ...prev,
      [type]: enabled
    }));
  };

  const handleTypeToggle = (notificationType, channel, enabled) => {
    setLocalPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [notificationType]: {
          ...prev.types[notificationType],
          [channel]: enabled
        }
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await updatePreferences(localPreferences);
      
      if (result.success) {
        setSuccess('Notification preferences saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const enablePushNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        await checkNotificationStatus();
        setSuccess('Push notifications enabled successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      setError('Failed to enable push notifications');
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
        setSuccess('Test notification sent! Check your browser notifications.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to send test notification: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Error sending test notification');
    }
  };

  const notificationTypeLabels = {
    entity_created: 'Entity Created',
    entity_updated: 'Entity Updated', 
    entity_deleted: 'Entity Deleted',
    attribute_request: 'Attribute Request',
    attribute_response: 'Attribute Response',
    interaction_received: 'Interaction Received',
    system_alert: 'System Alert',
    tenant_update: 'Tenant Update',
    user_mention: 'User Mention',
    bulk_operation_complete: 'Bulk Operation Complete'
  };

  const hasUnsavedChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h2>
          <i className="fas fa-cog"></i>
          Notification Preferences
        </h2>
        <p>Customize how and when you receive notifications across different channels.</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      <div className="settings-content">
        {/* Push Notification Status */}
        <div className="settings-section">
          <h3>Push Notification Status</h3>
          <div className="status-card">
            <div className="status-info">
              <div className="status-icon">
                <i className={`fas ${isSubscribed ? 'fa-bell' : 'fa-bell-slash'}`}></i>
              </div>
              <div className="status-details">
                <h4>{isSubscribed ? 'Push Notifications Enabled' : 'Push Notifications Disabled'}</h4>
                <p>
                  {isSubscribed 
                    ? 'You will receive push notifications on this device.'
                    : 'Enable push notifications to receive real-time updates.'
                  }
                </p>
                <span className={`status-badge ${permissionState}`}>
                  {permissionState === 'granted' ? 'Granted' : 
                   permissionState === 'denied' ? 'Denied' : 'Not Requested'}
                </span>
              </div>
            </div>
            {!isSubscribed && permissionState !== 'denied' && (
              <button
                className="btn btn-primary"
                onClick={enablePushNotifications}
              >
                <i className="fas fa-bell"></i>
                Enable Push Notifications
              </button>
            )}
          </div>
        </div>

        {/* Global Settings */}
        <div className="settings-section">
          <h3>Global Settings</h3>
          <div className="setting-group">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Push Notifications</h4>
                <p>Receive notifications as browser push notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localPreferences.enablePush}
                  onChange={(e) => handleGlobalToggle('enablePush', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Email Notifications</h4>
                <p>Receive notifications via email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localPreferences.enableEmail}
                  onChange={(e) => handleGlobalToggle('enableEmail', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>In-App Notifications</h4>
                <p>Show notifications within the application</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localPreferences.enableInApp}
                  onChange={(e) => handleGlobalToggle('enableInApp', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="settings-section">
          <h3>Quiet Hours</h3>
          <div className="setting-group">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Enable Quiet Hours</h4>
                <p>Suppress notifications during specified hours</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localPreferences.quietHours.enabled}
                  onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {localPreferences.quietHours.enabled && (
              <div className="quiet-hours-config">
                <div className="time-inputs">
                  <div className="time-input">
                    <label>Start Time:</label>
                    <input
                      type="time"
                      value={localPreferences.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    />
                  </div>
                  <div className="time-input">
                    <label>End Time:</label>
                    <input
                      type="time"
                      value={localPreferences.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div className="settings-section">
          <h3>Notification Types</h3>
          <p className="section-description">
            Configure which types of notifications you want to receive through each channel.
          </p>
          
          <div className="notification-types">
            <div className="types-header">
              <div className="type-name">Notification Type</div>
              <div className="channel-headers">
                <span>Push</span>
                <span>Email</span>
                <span>In-App</span>
              </div>
            </div>

            {Object.values(NOTIFICATION_TYPES).map(type => (
              <div key={type} className="notification-type-row">
                <div className="type-info">
                  <h4>{notificationTypeLabels[type] || type}</h4>
                  <p>{getTypeDescription(type)}</p>
                </div>
                <div className="channel-toggles">
                  <label className="toggle-switch small">
                    <input
                      type="checkbox"
                      checked={localPreferences.types[type]?.push || false}
                      onChange={(e) => handleTypeToggle(type, 'push', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="toggle-switch small">
                    <input
                      type="checkbox"
                      checked={localPreferences.types[type]?.email || false}
                      onChange={(e) => handleTypeToggle(type, 'email', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="toggle-switch small">
                    <input
                      type="checkbox"
                      checked={localPreferences.types[type]?.inApp || false}
                      onChange={(e) => handleTypeToggle(type, 'inApp', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Notifications */}
        <div className="settings-section">
          <h3>Test Notifications</h3>
          <div className="test-section">
            <p>Send a test notification to verify your settings are working correctly.</p>
            <button
              className="btn btn-outline"
              onClick={sendTestNotification}
            >
              <i className="fas fa-paper-plane"></i>
              Send Test Notification
            </button>
          </div>
        </div>
      </div>

      {/* Save Actions */}
      {hasUnsavedChanges && (
        <div className="save-actions">
          <div className="unsaved-changes">
            <i className="fas fa-exclamation-circle"></i>
            You have unsaved changes
          </div>
          <div className="action-buttons">
            <button
              className="btn btn-outline"
              onClick={() => setLocalPreferences(preferences)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={savePreferences}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function getTypeDescription(type) {
    const descriptions = {
      entity_created: 'When new entities are created',
      entity_updated: 'When entities are modified',
      entity_deleted: 'When entities are removed',
      attribute_request: 'When someone requests attribute information',
      attribute_response: 'When attribute requests are answered',
      interaction_received: 'When you receive interactions on your entities',
      system_alert: 'Important system announcements and alerts',
      tenant_update: 'Updates related to your tenant or organization',
      user_mention: 'When you are mentioned in comments or discussions',
      bulk_operation_complete: 'When bulk operations finish processing'
    };
    return descriptions[type] || 'Notification type';
  }
};

export default NotificationSettings;
