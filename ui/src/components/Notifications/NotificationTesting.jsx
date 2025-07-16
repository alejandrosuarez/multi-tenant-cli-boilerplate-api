import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationTesting.css';

const NotificationTesting = () => {
  const [testType, setTestType] = useState('basic');
  const [customNotification, setCustomNotification] = useState({
    title: '',
    message: '',
    type: 'system_alert',
    priority: 'normal',
    data: {}
  });
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [sending, setSending] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { NOTIFICATION_TYPES } = useNotifications();

  const predefinedTests = [
    {
      id: 'basic',
      name: 'Basic Notification',
      description: 'Simple notification with title and message',
      notification: {
        title: 'Test Notification',
        message: 'This is a basic test notification to verify your setup is working correctly.',
        type: 'system_alert',
        priority: 'normal'
      }
    },
    {
      id: 'entity_created',
      name: 'Entity Created',
      description: 'Notification for when a new entity is created',
      notification: {
        title: 'New Entity Created',
        message: 'A new entity "Sample Product" has been created in your workspace.',
        type: 'entity_created',
        priority: 'normal',
        data: {
          entityId: 'test-123',
          entityName: 'Sample Product',
          entityType: 'product'
        }
      }
    },
    {
      id: 'attribute_request',
      name: 'Attribute Request',
      description: 'Notification for attribute information requests',
      notification: {
        title: 'Attribute Information Requested',
        message: 'Someone has requested more information about the "price" attribute for your entity.',
        type: 'attribute_request',
        priority: 'high',
        data: {
          entityId: 'test-123',
          attributeName: 'price',
          requesterName: 'Test User'
        }
      }
    },
    {
      id: 'interaction',
      name: 'Interaction Received',
      description: 'Notification for new interactions',
      notification: {
        title: 'New Interaction',
        message: 'You have received a new interaction on your entity "Sample Product".',
        type: 'interaction_received',
        priority: 'normal',
        data: {
          entityId: 'test-123',
          interactionType: 'comment',
          fromUser: 'Test User'
        }
      }
    },
    {
      id: 'system_alert',
      name: 'System Alert',
      description: 'High priority system notification',
      notification: {
        title: 'System Maintenance',
        message: 'Scheduled maintenance will begin in 30 minutes. Please save your work.',
        type: 'system_alert',
        priority: 'high'
      }
    },
    {
      id: 'bulk_complete',
      name: 'Bulk Operation Complete',
      description: 'Notification for completed bulk operations',
      notification: {
        title: 'Bulk Operation Complete',
        message: 'Your bulk update operation has been completed successfully. 25 entities were updated.',
        type: 'bulk_operation_complete',
        priority: 'normal',
        data: {
          operationId: 'bulk-123',
          affectedCount: 25,
          operationType: 'update'
        }
      }
    }
  ];

  useEffect(() => {
    loadDevices();
    loadTestHistory();
  }, [currentTenant]);

  const loadDevices = async () => {
    try {
      const response = await notificationsAPI.getDevices();
      setDevices(response.data.devices || []);
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  };

  const loadTestHistory = () => {
    const history = JSON.parse(localStorage.getItem('notificationTestHistory') || '[]');
    setTestHistory(history.slice(0, 10)); // Keep only last 10 tests
  };

  const saveTestToHistory = (test, result) => {
    const history = JSON.parse(localStorage.getItem('notificationTestHistory') || '[]');
    const newTest = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      test,
      result,
      device: selectedDevice
    };
    
    const updatedHistory = [newTest, ...history].slice(0, 10);
    localStorage.setItem('notificationTestHistory', JSON.stringify(updatedHistory));
    setTestHistory(updatedHistory);
  };

  const sendTestNotification = async () => {
    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      let notificationData;
      
      if (testType === 'custom') {
        notificationData = {
          ...customNotification,
          data: customNotification.data || {}
        };
      } else {
        const predefined = predefinedTests.find(t => t.id === testType);
        notificationData = predefined.notification;
      }

      // Add test metadata
      notificationData.isTest = true;
      notificationData.testId = Date.now();

      const deviceId = selectedDevice === 'all' ? null : selectedDevice;
      
      const response = await notificationsAPI.sendTestNotification(
        notificationData.type,
        deviceId
      );

      if (response.data.success) {
        setSuccess(`Test notification sent successfully! ${deviceId ? 'Check the selected device.' : 'Check all your registered devices.'}`);
        saveTestToHistory(notificationData, 'success');
      } else {
        throw new Error(response.data.message || 'Failed to send test notification');
      }

    } catch (err) {
      console.error('Error sending test notification:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send test notification';
      setError(errorMessage);
      saveTestToHistory(testType === 'custom' ? customNotification : predefinedTests.find(t => t.id === testType)?.notification, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCustomDataChange = (key, value) => {
    setCustomNotification(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value
      }
    }));
  };

  const addCustomDataField = () => {
    const key = prompt('Enter data field name:');
    if (key && key.trim()) {
      handleCustomDataChange(key.trim(), '');
    }
  };

  const removeCustomDataField = (key) => {
    setCustomNotification(prev => {
      const newData = { ...prev.data };
      delete newData[key];
      return {
        ...prev,
        data: newData
      };
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTestResultIcon = (result) => {
    return result === 'success' ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger';
  };

  return (
    <div className="notification-testing">
      <div className="testing-header">
        <h2>
          <i className="fas fa-flask"></i>
          Notification Testing
        </h2>
        <p>Test different types of notifications to ensure they're working correctly across your devices.</p>
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

      <div className="testing-content">
        <div className="test-configuration">
          <div className="config-section">
            <h3>Test Configuration</h3>
            
            <div className="form-group">
              <label>Test Type:</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="form-control"
              >
                {predefinedTests.map(test => (
                  <option key={test.id} value={test.id}>
                    {test.name}
                  </option>
                ))}
                <option value="custom">Custom Notification</option>
              </select>
              {testType !== 'custom' && (
                <small className="form-text">
                  {predefinedTests.find(t => t.id === testType)?.description}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Target Device:</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="form-control"
              >
                <option value="all">All Devices</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name || `${device.browser} on ${device.platform}`}
                  </option>
                ))}
              </select>
              <small className="form-text">
                {devices.length === 0 
                  ? 'No devices registered. Enable notifications to register this device.'
                  : `${devices.length} device(s) available for testing`
                }
              </small>
            </div>
          </div>

          {testType === 'custom' && (
            <div className="custom-notification-form">
              <h4>Custom Notification</h4>
              
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={customNotification.title}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
                  className="form-control"
                  placeholder="Enter notification title"
                />
              </div>

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={customNotification.message}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, message: e.target.value }))}
                  className="form-control"
                  rows="3"
                  placeholder="Enter notification message"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={customNotification.type}
                    onChange={(e) => setCustomNotification(prev => ({ ...prev, type: e.target.value }))}
                    className="form-control"
                  >
                    {Object.values(NOTIFICATION_TYPES).map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority:</label>
                  <select
                    value={customNotification.priority}
                    onChange={(e) => setCustomNotification(prev => ({ ...prev, priority: e.target.value }))}
                    className="form-control"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="custom-data-section">
                <div className="section-header">
                  <label>Additional Data:</label>
                  <button
                    type="button"
                    onClick={addCustomDataField}
                    className="btn btn-sm btn-outline"
                  >
                    <i className="fas fa-plus"></i>
                    Add Field
                  </button>
                </div>
                
                {Object.entries(customNotification.data).map(([key, value]) => (
                  <div key={key} className="data-field">
                    <input
                      type="text"
                      value={key}
                      readOnly
                      className="form-control field-key"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleCustomDataChange(key, e.target.value)}
                      className="form-control field-value"
                      placeholder="Field value"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomDataField(key)}
                      className="btn btn-sm btn-danger-outline"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="test-actions">
            <button
              onClick={sendTestNotification}
              disabled={sending || devices.length === 0 || (testType === 'custom' && (!customNotification.title || !customNotification.message))}
              className="btn btn-primary btn-lg"
            >
              {sending ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending Test...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Test Notification
                </>
              )}
            </button>
          </div>
        </div>

        <div className="test-preview">
          <h3>Preview</h3>
          <div className="notification-preview">
            {testType === 'custom' ? (
              <div className="preview-notification">
                <div className="preview-icon">
                  <i className="fas fa-bell"></i>
                </div>
                <div className="preview-content">
                  <h4>{customNotification.title || 'Notification Title'}</h4>
                  <p>{customNotification.message || 'Notification message will appear here...'}</p>
                  {Object.keys(customNotification.data).length > 0 && (
                    <div className="preview-data">
                      {Object.entries(customNotification.data).map(([key, value]) => (
                        <span key={key} className="data-tag">
                          <strong>{key}:</strong> {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="preview-meta">
                  <span className={`priority-badge ${customNotification.priority}`}>
                    {customNotification.priority}
                  </span>
                </div>
              </div>
            ) : (
              (() => {
                const test = predefinedTests.find(t => t.id === testType);
                return test ? (
                  <div className="preview-notification">
                    <div className="preview-icon">
                      <i className="fas fa-bell"></i>
                    </div>
                    <div className="preview-content">
                      <h4>{test.notification.title}</h4>
                      <p>{test.notification.message}</p>
                      {test.notification.data && Object.keys(test.notification.data).length > 0 && (
                        <div className="preview-data">
                          {Object.entries(test.notification.data).map(([key, value]) => (
                            <span key={key} className="data-tag">
                              <strong>{key}:</strong> {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="preview-meta">
                      <span className={`priority-badge ${test.notification.priority}`}>
                        {test.notification.priority}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()
            )}
          </div>
        </div>
      </div>

      {testHistory.length > 0 && (
        <div className="test-history">
          <h3>Recent Tests</h3>
          <div className="history-list">
            {testHistory.map(test => (
              <div key={test.id} className="history-item">
                <div className="history-icon">
                  <i className={getTestResultIcon(test.result)}></i>
                </div>
                <div className="history-content">
                  <h4>{test.test.title}</h4>
                  <p>{test.test.message}</p>
                  <div className="history-meta">
                    <span className="test-time">{formatTimestamp(test.timestamp)}</span>
                    <span className="test-device">
                      {test.device === 'all' ? 'All devices' : devices.find(d => d.id === test.device)?.name || 'Unknown device'}
                    </span>
                    <span className={`test-result ${test.result}`}>
                      {test.result}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTesting;