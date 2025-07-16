import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import oneSignalService from '../../services/onesignal';
import './DeviceManager.css';

const DeviceManager = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [testingDevice, setTestingDevice] = useState(null);
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  useEffect(() => {
    loadDevices();
    checkCurrentDevice();
  }, [currentTenant]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getDevices();
      setDevices(response.data.devices || []);
      setError(null);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentDevice = async () => {
    try {
      const isSubscribed = await oneSignalService.isSubscribed();
      const playerId = await oneSignalService.getPlayerId();
      
      if (isSubscribed && playerId) {
        setCurrentDevice({
          playerId,
          isSubscribed,
          browser: getBrowserInfo(),
          platform: getPlatformInfo()
        });
      }
    } catch (error) {
      console.error('Error checking current device:', error);
    }
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getPlatformInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
  };

  const registerCurrentDevice = async () => {
    try {
      setRegistering(true);
      
      // Request permission and subscribe
      const permission = await oneSignalService.requestPermission();
      if (!permission) {
        throw new Error('Notification permission denied');
      }

      const playerId = await oneSignalService.getPlayerId();
      if (!playerId) {
        throw new Error('Failed to get device ID');
      }

      // Register device with backend
      const deviceInfo = {
        playerId,
        browser: getBrowserInfo(),
        platform: getPlatformInfo(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      await notificationsAPI.registerDevice(deviceInfo);
      
      // Reload devices and current device info
      await Promise.all([loadDevices(), checkCurrentDevice()]);
      
      setError(null);
    } catch (err) {
      console.error('Error registering device:', err);
      setError(err.message || 'Failed to register device');
    } finally {
      setRegistering(false);
    }
  };

  const removeDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to remove this device? You will no longer receive push notifications on this device.')) {
      return;
    }

    try {
      await notificationsAPI.removeDevice(deviceId);
      await loadDevices();
      
      // If removing current device, update current device state
      if (currentDevice && currentDevice.playerId === deviceId) {
        setCurrentDevice(null);
      }
    } catch (err) {
      console.error('Error removing device:', err);
      setError('Failed to remove device');
    }
  };

  const testDevice = async (deviceId) => {
    try {
      setTestingDevice(deviceId);
      await notificationsAPI.sendTestNotification('device_test', deviceId);
      
      // Show success message
      const deviceName = devices.find(d => d.id === deviceId)?.name || 'device';
      alert(`Test notification sent to ${deviceName}! Check your notifications.`);
    } catch (err) {
      console.error('Error testing device:', err);
      alert('Failed to send test notification');
    } finally {
      setTestingDevice(null);
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (browser, platform) => {
    if (platform === 'iOS') return 'fab fa-apple';
    if (platform === 'Android') return 'fab fa-android';
    if (browser === 'Chrome') return 'fab fa-chrome';
    if (browser === 'Firefox') return 'fab fa-firefox';
    if (browser === 'Safari') return 'fab fa-safari';
    if (browser === 'Edge') return 'fab fa-edge';
    return 'fas fa-desktop';
  };

  const getDeviceStatus = (device) => {
    if (!device.lastSeen) return 'inactive';
    
    const lastSeen = new Date(device.lastSeen);
    const now = new Date();
    const diffHours = (now - lastSeen) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'active';
    if (diffHours < 24) return 'recent';
    return 'inactive';
  };

  if (loading) {
    return (
      <div className="device-manager loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="device-manager">
      <div className="device-manager-header">
        <h2>
          <i className="fas fa-mobile-alt"></i>
          Push Notification Devices
        </h2>
        <p>Manage devices that can receive push notifications for your account.</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      <div className="current-device-section">
        <h3>Current Device</h3>
        {currentDevice ? (
          <div className="current-device-card">
            <div className="device-info">
              <div className="device-icon">
                <i className={getDeviceIcon(currentDevice.browser, currentDevice.platform)}></i>
              </div>
              <div className="device-details">
                <h4>This Device</h4>
                <p>{currentDevice.browser} on {currentDevice.platform}</p>
                <span className="device-status active">
                  <i className="fas fa-circle"></i>
                  Active
                </span>
              </div>
            </div>
            <div className="device-actions">
              <button
                className="btn btn-outline"
                onClick={() => testDevice(currentDevice.playerId)}
                disabled={testingDevice === currentDevice.playerId}
              >
                {testingDevice === currentDevice.playerId ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Testing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Test
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="no-current-device">
            <div className="no-device-content">
              <i className="fas fa-mobile-alt"></i>
              <h4>No Active Device</h4>
              <p>Enable push notifications on this device to receive real-time updates.</p>
              <button
                className="btn btn-primary"
                onClick={registerCurrentDevice}
                disabled={registering}
              >
                {registering ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Enabling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bell"></i>
                    Enable Notifications
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="registered-devices-section">
        <h3>Registered Devices ({devices.length})</h3>
        
        {devices.length === 0 ? (
          <div className="no-devices">
            <i className="fas fa-mobile-alt"></i>
            <h4>No Registered Devices</h4>
            <p>Register devices to receive push notifications across all your devices.</p>
          </div>
        ) : (
          <div className="devices-grid">
            {devices.map((device) => (
              <div key={device.id} className="device-card">
                <div className="device-header">
                  <div className="device-icon">
                    <i className={getDeviceIcon(device.browser, device.platform)}></i>
                  </div>
                  <div className="device-info">
                    <h4>{device.name || `${device.browser} on ${device.platform}`}</h4>
                    <p className="device-details">
                      {device.browser} • {device.platform}
                    </p>
                    <span className={`device-status ${getDeviceStatus(device)}`}>
                      <i className="fas fa-circle"></i>
                      {getDeviceStatus(device) === 'active' ? 'Active' : 
                       getDeviceStatus(device) === 'recent' ? 'Recent' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="device-metadata">
                  <div className="metadata-item">
                    <span className="label">Last Seen:</span>
                    <span className="value">{formatLastSeen(device.lastSeen)}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Registered:</span>
                    <span className="value">{new Date(device.createdAt).toLocaleDateString()}</span>
                  </div>
                  {device.language && (
                    <div className="metadata-item">
                      <span className="label">Language:</span>
                      <span className="value">{device.language}</span>
                    </div>
                  )}
                  {device.timezone && (
                    <div className="metadata-item">
                      <span className="label">Timezone:</span>
                      <span className="value">{device.timezone}</span>
                    </div>
                  )}
                </div>

                <div className="device-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => testDevice(device.id)}
                    disabled={testingDevice === device.id}
                  >
                    {testingDevice === device.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Testing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Test
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-danger-outline"
                    onClick={() => removeDevice(device.id)}
                  >
                    <i className="fas fa-trash"></i>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="device-help">
        <h3>Need Help?</h3>
        <div className="help-items">
          <div className="help-item">
            <i className="fas fa-question-circle"></i>
            <div>
              <h4>Not receiving notifications?</h4>
              <p>Make sure notifications are enabled in your browser settings and that you haven't blocked notifications for this site.</p>
            </div>
          </div>
          <div className="help-item">
            <i className="fas fa-sync"></i>
            <div>
              <h4>Device not showing up?</h4>
              <p>Try refreshing the page or clearing your browser cache. You may need to re-enable notifications.</p>
            </div>
          </div>
          <div className="help-item">
            <i className="fas fa-shield-alt"></i>
            <div>
              <h4>Privacy & Security</h4>
              <p>Device information is used only for delivering notifications. You can remove devices at any time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceManager;