import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/admin';
import './TenantSettings.css';

const TenantSettings = () => {
  const { currentTenant, updateTenantSettings, canManageTenant } = useTenant();
  const { hasRole, ROLES } = useAuth();
  const [settings, setSettings] = useState({
    general: {
      name: '',
      description: '',
      timezone: 'UTC',
      language: 'en',
      contact_email: '',
      website: ''
    },
    features: {
      notifications_enabled: true,
      analytics_enabled: true,
      api_access_enabled: true,
      media_upload_enabled: true,
      bulk_operations_enabled: true,
      real_time_updates_enabled: true
    },
    limits: {
      max_users: 100,
      max_entities: 10000,
      max_storage_mb: 5000,
      api_rate_limit: 1000,
      notification_rate_limit: 100
    },
    customization: {
      theme: {
        primary_color: '#3b82f6',
        secondary_color: '#64748b',
        accent_color: '#06b6d4'
      },
      branding: {
        logo_url: '',
        favicon_url: '',
        custom_css: ''
      }
    },
    notifications: {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      notification_templates: {}
    },
    security: {
      require_2fa: false,
      session_timeout_minutes: 480,
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false
      },
      allowed_domains: [],
      ip_whitelist: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (currentTenant && canManageTenant()) {
      loadTenantSettings();
    }
  }, [currentTenant]);

  const loadTenantSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminAPI.getTenantById(currentTenant.id);
      const tenantData = response.data;
      
      setSettings(prevSettings => ({
        ...prevSettings,
        general: {
          ...prevSettings.general,
          name: tenantData.name || '',
          description: tenantData.description || '',
          timezone: tenantData.timezone || 'UTC',
          language: tenantData.language || 'en',
          contact_email: tenantData.contact_email || '',
          website: tenantData.website || ''
        },
        ...tenantData.settings
      }));
    } catch (err) {
      console.error('Error loading tenant settings:', err);
      setError('Failed to load tenant settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (section, subsection, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
  };

  const handleArraySettingChange = (section, key, index, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: prev[section][key].map((item, i) => i === index ? value : item)
      }
    }));
  };

  const addArrayItem = (section, key, defaultValue = '') => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: [...prev[section][key], defaultValue]
      }
    }));
  };

  const removeArrayItem = (section, key, index) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: prev[section][key].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateTenantSettings(settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      loadTenantSettings();
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'features', label: 'Features', icon: '🔧' },
    { id: 'limits', label: 'Limits', icon: '📊' },
    { id: 'customization', label: 'Customization', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' }
  ];

  if (!canManageTenant()) {
    return (
      <div className="tenant-settings">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage tenant settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tenant-settings">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tenant settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-settings">
      <div className="settings-header">
        <h1>Tenant Settings</h1>
        <div className="tenant-info">
          <h2>{currentTenant?.name}</h2>
          <p>Configure your tenant settings and preferences</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              
              <div className="form-group">
                <label>Tenant Name</label>
                <input
                  type="text"
                  value={settings.general.name}
                  onChange={(e) => handleSettingChange('general', 'name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={settings.general.description}
                  onChange={(e) => handleSettingChange('general', 'description', e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="form-select"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                    className="form-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={settings.general.contact_email}
                    onChange={(e) => handleSettingChange('general', 'contact_email', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={settings.general.website}
                    onChange={(e) => handleSettingChange('general', 'website', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="settings-section">
              <h3>Feature Settings</h3>
              
              <div className="feature-toggles">
                {Object.entries(settings.features).map(([key, value]) => (
                  <div key={key} className="toggle-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange('features', key, e.target.checked)}
                        className="toggle-input"
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="settings-section">
              <h3>Resource Limits</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Maximum Users</label>
                  <input
                    type="number"
                    value={settings.limits.max_users}
                    onChange={(e) => handleSettingChange('limits', 'max_users', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Entities</label>
                  <input
                    type="number"
                    value={settings.limits.max_entities}
                    onChange={(e) => handleSettingChange('limits', 'max_entities', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Storage Limit (MB)</label>
                  <input
                    type="number"
                    value={settings.limits.max_storage_mb}
                    onChange={(e) => handleSettingChange('limits', 'max_storage_mb', parseInt(e.target.value))}
                    className="form-input"
                    min="100"
                  />
                </div>

                <div className="form-group">
                  <label>API Rate Limit (per hour)</label>
                  <input
                    type="number"
                    value={settings.limits.api_rate_limit}
                    onChange={(e) => handleSettingChange('limits', 'api_rate_limit', parseInt(e.target.value))}
                    className="form-input"
                    min="100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notification Rate Limit (per hour)</label>
                <input
                  type="number"
                  value={settings.limits.notification_rate_limit}
                  onChange={(e) => handleSettingChange('limits', 'notification_rate_limit', parseInt(e.target.value))}
                  className="form-input"
                  min="10"
                />
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div className="settings-section">
              <h3>Theme Customization</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    value={settings.customization.theme.primary_color}
                    onChange={(e) => handleNestedSettingChange('customization', 'theme', 'primary_color', e.target.value)}
                    className="form-color"
                  />
                </div>

                <div className="form-group">
                  <label>Secondary Color</label>
                  <input
                    type="color"
                    value={settings.customization.theme.secondary_color}
                    onChange={(e) => handleNestedSettingChange('customization', 'theme', 'secondary_color', e.target.value)}
                    className="form-color"
                  />
                </div>

                <div className="form-group">
                  <label>Accent Color</label>
                  <input
                    type="color"
                    value={settings.customization.theme.accent_color}
                    onChange={(e) => handleNestedSettingChange('customization', 'theme', 'accent_color', e.target.value)}
                    className="form-color"
                  />
                </div>
              </div>

              <h4>Branding</h4>
              
              <div className="form-group">
                <label>Logo URL</label>
                <input
                  type="url"
                  value={settings.customization.branding.logo_url}
                  onChange={(e) => handleNestedSettingChange('customization', 'branding', 'logo_url', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Favicon URL</label>
                <input
                  type="url"
                  value={settings.customization.branding.favicon_url}
                  onChange={(e) => handleNestedSettingChange('customization', 'branding', 'favicon_url', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Custom CSS</label>
                <textarea
                  value={settings.customization.branding.custom_css}
                  onChange={(e) => handleNestedSettingChange('customization', 'branding', 'custom_css', e.target.value)}
                  className="form-textarea"
                  rows="6"
                  placeholder="/* Add your custom CSS here */"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              
              <div className="feature-toggles">
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email_notifications}
                      onChange={(e) => handleSettingChange('notifications', 'email_notifications', e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">Email Notifications</span>
                  </label>
                </div>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.push_notifications}
                      onChange={(e) => handleSettingChange('notifications', 'push_notifications', e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">Push Notifications</span>
                  </label>
                </div>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms_notifications}
                      onChange={(e) => handleSettingChange('notifications', 'sms_notifications', e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">SMS Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              
              <div className="toggle-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.security.require_2fa}
                    onChange={(e) => handleSettingChange('security', 'require_2fa', e.target.checked)}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">Require Two-Factor Authentication</span>
                </label>
              </div>

              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.session_timeout_minutes}
                  onChange={(e) => handleSettingChange('security', 'session_timeout_minutes', parseInt(e.target.value))}
                  className="form-input"
                  min="30"
                  max="1440"
                />
              </div>

              <h4>Password Policy</h4>
              
              <div className="form-group">
                <label>Minimum Length</label>
                <input
                  type="number"
                  value={settings.security.password_policy.min_length}
                  onChange={(e) => handleNestedSettingChange('security', 'password_policy', 'min_length', parseInt(e.target.value))}
                  className="form-input"
                  min="6"
                  max="32"
                />
              </div>

              <div className="password-requirements">
                {Object.entries(settings.security.password_policy).filter(([key]) => key.startsWith('require_')).map(([key, value]) => (
                  <div key={key} className="toggle-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleNestedSettingChange('security', 'password_policy', key, e.target.checked)}
                        className="toggle-input"
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">
                        {key.replace(/require_|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <h4>Access Control</h4>
              
              <div className="form-group">
                <label>Allowed Domains</label>
                <div className="array-input">
                  {settings.security.allowed_domains.map((domain, index) => (
                    <div key={index} className="array-item">
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => handleArraySettingChange('security', 'allowed_domains', index, e.target.value)}
                        className="form-input"
                        placeholder="example.com"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('security', 'allowed_domains', index)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('security', 'allowed_domains')}
                    className="btn btn-secondary btn-sm"
                  >
                    Add Domain
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>IP Whitelist</label>
                <div className="array-input">
                  {settings.security.ip_whitelist.map((ip, index) => (
                    <div key={index} className="array-item">
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => handleArraySettingChange('security', 'ip_whitelist', index, e.target.value)}
                        className="form-input"
                        placeholder="192.168.1.0/24"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('security', 'ip_whitelist', index)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('security', 'ip_whitelist')}
                    className="btn btn-secondary btn-sm"
                  >
                    Add IP Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn btn-secondary"
          onClick={resetToDefaults}
          disabled={saving}
        >
          Reset to Defaults
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default TenantSettings;