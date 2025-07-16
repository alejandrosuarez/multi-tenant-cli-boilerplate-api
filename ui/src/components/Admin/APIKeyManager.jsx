import React, { useState, useEffect } from 'react';
import './APIKeyManager.css';

const APIKeyManager = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    description: '',
    permissions: [],
    rateLimit: 1000,
    expiresAt: ''
  });
  const [selectedKey, setSelectedKey] = useState(null);

  const permissions = [
    { id: 'entities.read', label: 'Read Entities', description: 'View entity data' },
    { id: 'entities.write', label: 'Write Entities', description: 'Create and update entities' },
    { id: 'entities.delete', label: 'Delete Entities', description: 'Remove entities' },
    { id: 'attributes.read', label: 'Read Attributes', description: 'View attribute requests' },
    { id: 'attributes.write', label: 'Write Attributes', description: 'Create attribute requests' },
    { id: 'notifications.send', label: 'Send Notifications', description: 'Send push notifications' },
    { id: 'analytics.read', label: 'Read Analytics', description: 'Access analytics data' },
    { id: 'admin.access', label: 'Admin Access', description: 'Full administrative access' }
  ];

  // Mock API keys for demonstration
  useEffect(() => {
    const mockKeys = [
      {
        id: 'key_1',
        name: 'Production API',
        description: 'Main production API key',
        key: 'pk_live_1234567890abcdef',
        permissions: ['entities.read', 'entities.write', 'notifications.send'],
        rateLimit: 5000,
        usage: { requests: 2847, limit: 5000 },
        createdAt: '2024-01-15T10:30:00Z',
        lastUsed: '2024-01-20T14:22:00Z',
        expiresAt: '2024-12-31T23:59:59Z',
        status: 'active'
      },
      {
        id: 'key_2',
        name: 'Development API',
        description: 'Development and testing',
        key: 'pk_test_abcdef1234567890',
        permissions: ['entities.read', 'entities.write', 'attributes.read'],
        rateLimit: 1000,
        usage: { requests: 156, limit: 1000 },
        createdAt: '2024-01-10T09:15:00Z',
        lastUsed: '2024-01-20T11:45:00Z',
        expiresAt: null,
        status: 'active'
      },
      {
        id: 'key_3',
        name: 'Analytics Only',
        description: 'Read-only analytics access',
        key: 'pk_analytics_9876543210fedcba',
        permissions: ['analytics.read'],
        rateLimit: 500,
        usage: { requests: 89, limit: 500 },
        createdAt: '2024-01-05T16:20:00Z',
        lastUsed: '2024-01-19T08:30:00Z',
        expiresAt: '2024-06-30T23:59:59Z',
        status: 'active'
      }
    ];
    setApiKeys(mockKeys);
  }, []);

  const handleCreateKey = () => {
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyForm.name,
      description: newKeyForm.description,
      key: `pk_${Math.random().toString(36).substr(2, 24)}`,
      permissions: newKeyForm.permissions,
      rateLimit: newKeyForm.rateLimit,
      usage: { requests: 0, limit: newKeyForm.rateLimit },
      createdAt: new Date().toISOString(),
      lastUsed: null,
      expiresAt: newKeyForm.expiresAt || null,
      status: 'active'
    };

    setApiKeys(prev => [...prev, newKey]);
    setNewKeyForm({
      name: '',
      description: '',
      permissions: [],
      rateLimit: 1000,
      expiresAt: ''
    });
    setShowCreateForm(false);
  };

  const handleRevokeKey = (keyId) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' } : key
    ));
  };

  const handleRegenerateKey = (keyId) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { ...key, key: `pk_${Math.random().toString(36).substr(2, 24)}` }
        : key
    ));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never expires';
    return new Date(dateString).toLocaleDateString();
  };

  const getUsagePercentage = (usage) => {
    return (usage.requests / usage.limit) * 100;
  };

  const getPermissionLabel = (permissionId) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.label : permissionId;
  };

  return (
    <div className="api-key-manager">
      <div className="manager-header">
        <div className="header-content">
          <h2>API Key Management</h2>
          <p>Manage API keys, permissions, and rate limiting</p>
        </div>
        
        <button
          className="create-key-btn"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Key
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-overlay">
          <div className="create-form">
            <div className="form-header">
              <h3>Create New API Key</h3>
              <button
                className="close-form"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label>Key Name</label>
                <input
                  type="text"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter key name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newKeyForm.description}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this key"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-grid">
                  {permissions.map(permission => (
                    <label key={permission.id} className="permission-item">
                      <input
                        type="checkbox"
                        checked={newKeyForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyForm(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.id]
                            }));
                          } else {
                            setNewKeyForm(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission.id)
                            }));
                          }
                        }}
                      />
                      <div className="permission-info">
                        <span className="permission-label">{permission.label}</span>
                        <span className="permission-description">{permission.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    value={newKeyForm.rateLimit}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                    min="1"
                    max="10000"
                  />
                </div>

                <div className="form-group">
                  <label>Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={newKeyForm.expiresAt}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="create-btn"
                  onClick={handleCreateKey}
                  disabled={!newKeyForm.name || newKeyForm.permissions.length === 0}
                >
                  Create API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="keys-list">
        {apiKeys.map(key => (
          <div key={key.id} className={`key-card ${key.status}`}>
            <div className="key-header">
              <div className="key-info">
                <h3>{key.name}</h3>
                <p className="key-description">{key.description}</p>
                <div className="key-meta">
                  <span className="key-id">ID: {key.id}</span>
                  <span className={`key-status ${key.status}`}>
                    {key.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="key-actions">
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(key.key)}
                  title="Copy API key"
                >
                  📋
                </button>
                <button
                  className="regenerate-btn"
                  onClick={() => handleRegenerateKey(key.id)}
                  title="Regenerate key"
                  disabled={key.status === 'revoked'}
                >
                  🔄
                </button>
                <button
                  className="revoke-btn"
                  onClick={() => handleRevokeKey(key.id)}
                  title="Revoke key"
                  disabled={key.status === 'revoked'}
                >
                  🚫
                </button>
              </div>
            </div>

            <div className="key-details">
              <div className="key-value">
                <label>API Key:</label>
                <div className="key-display">
                  <code>{key.key}</code>
                  <button
                    className="copy-key"
                    onClick={() => copyToClipboard(key.key)}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="key-stats">
                <div className="stat-item">
                  <label>Usage:</label>
                  <div className="usage-bar">
                    <div
                      className="usage-fill"
                      style={{ width: `${getUsagePercentage(key.usage)}%` }}
                    />
                    <span className="usage-text">
                      {key.usage.requests} / {key.usage.limit}
                    </span>
                  </div>
                </div>

                <div className="stat-item">
                  <label>Created:</label>
                  <span>{formatDate(key.createdAt)}</span>
                </div>

                <div className="stat-item">
                  <label>Last Used:</label>
                  <span>{key.lastUsed ? formatDate(key.lastUsed) : 'Never'}</span>
                </div>

                <div className="stat-item">
                  <label>Expires:</label>
                  <span>{formatDate(key.expiresAt)}</span>
                </div>
              </div>

              <div className="key-permissions">
                <label>Permissions:</label>
                <div className="permissions-list">
                  {key.permissions.map(permission => (
                    <span key={permission} className="permission-tag">
                      {getPermissionLabel(permission)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {apiKeys.length === 0 && (
          <div className="empty-state">
            <h3>No API Keys</h3>
            <p>Create your first API key to get started</p>
            <button
              className="create-first-key"
              onClick={() => setShowCreateForm(true)}
            >
              Create API Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIKeyManager;