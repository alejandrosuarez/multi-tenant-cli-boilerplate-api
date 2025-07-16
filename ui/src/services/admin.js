import api from './api.js';

// Admin service for system administration endpoints
export const adminAPI = {
  // System Health and Monitoring
  getSystemHealth: () => {
    return api.get('/api/admin/system/health');
  },

  getSystemMetrics: (timeRange = '24h') => {
    return api.get(`/api/admin/system/metrics?range=${timeRange}`);
  },

  getSystemLogs: (level = 'all', page = 1, limit = 100) => {
    return api.get(`/api/admin/system/logs?level=${level}&page=${page}&limit=${limit}`);
  },

  getErrorLogs: (page = 1, limit = 50, severity = 'all') => {
    return api.get(`/api/admin/system/errors?page=${page}&limit=${limit}&severity=${severity}`);
  },

  // User Management
  getAllUsers: (page = 1, limit = 20, search = '', role = 'all') => {
    return api.get(`/api/admin/users?page=${page}&limit=${limit}&search=${search}&role=${role}`);
  },

  getUserById: (userId) => {
    return api.get(`/api/admin/users/${userId}`);
  },

  createUser: (userData) => {
    return api.post('/api/admin/users', userData);
  },

  updateUser: (userId, updates) => {
    return api.patch(`/api/admin/users/${userId}`, updates);
  },

  deleteUser: (userId) => {
    return api.delete(`/api/admin/users/${userId}`);
  },

  suspendUser: (userId, reason) => {
    return api.patch(`/api/admin/users/${userId}/suspend`, { reason });
  },

  unsuspendUser: (userId) => {
    return api.patch(`/api/admin/users/${userId}/unsuspend`);
  },

  resetUserPassword: (userId) => {
    return api.post(`/api/admin/users/${userId}/reset-password`);
  },

  getUserActivity: (userId, timeRange = '30d') => {
    return api.get(`/api/admin/users/${userId}/activity?range=${timeRange}`);
  },

  // Tenant Management
  getAllTenants: (page = 1, limit = 20, search = '', status = 'all') => {
    return api.get(`/api/admin/tenants?page=${page}&limit=${limit}&search=${search}&status=${status}`);
  },

  getTenantById: (tenantId) => {
    return api.get(`/api/admin/tenants/${tenantId}`);
  },

  createTenant: (tenantData) => {
    return api.post('/api/admin/tenants', tenantData);
  },

  updateTenant: (tenantId, updates) => {
    return api.patch(`/api/admin/tenants/${tenantId}`, updates);
  },

  deleteTenant: (tenantId) => {
    return api.delete(`/api/admin/tenants/${tenantId}`);
  },

  suspendTenant: (tenantId, reason) => {
    return api.patch(`/api/admin/tenants/${tenantId}/suspend`, { reason });
  },

  unsuspendTenant: (tenantId) => {
    return api.patch(`/api/admin/tenants/${tenantId}/unsuspend`);
  },

  getTenantUsers: (tenantId, page = 1, limit = 20) => {
    return api.get(`/api/admin/tenants/${tenantId}/users?page=${page}&limit=${limit}`);
  },

  getTenantEntities: (tenantId, page = 1, limit = 20) => {
    return api.get(`/api/admin/tenants/${tenantId}/entities?page=${page}&limit=${limit}`);
  },

  getTenantAnalytics: (tenantId, timeRange = '30d') => {
    return api.get(`/api/admin/tenants/${tenantId}/analytics?range=${timeRange}`);
  },

  // Entity Management (Admin Level)
  getAllEntities: (page = 1, limit = 20, search = '', tenantId = null) => {
    let url = `/api/admin/entities?page=${page}&limit=${limit}&search=${search}`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    return api.get(url);
  },

  getEntityById: (entityId) => {
    return api.get(`/api/admin/entities/${entityId}`);
  },

  deleteEntity: (entityId, reason) => {
    return api.delete(`/api/admin/entities/${entityId}`, {
      data: { reason }
    });
  },

  flagEntity: (entityId, reason, severity = 'medium') => {
    return api.patch(`/api/admin/entities/${entityId}/flag`, { reason, severity });
  },

  unflagEntity: (entityId) => {
    return api.patch(`/api/admin/entities/${entityId}/unflag`);
  },

  getEntityHistory: (entityId) => {
    return api.get(`/api/admin/entities/${entityId}/history`);
  },

  // API Management
  getAPIStats: (timeRange = '24h') => {
    return api.get(`/api/admin/api/stats?range=${timeRange}`);
  },

  getAPIEndpoints: () => {
    return api.get('/api/admin/api/endpoints');
  },

  testAPIEndpoint: (endpoint, method, payload = null) => {
    return api.post('/api/admin/api/test', {
      endpoint,
      method,
      payload
    });
  },

  getAPIKeys: (page = 1, limit = 20) => {
    return api.get(`/api/admin/api/keys?page=${page}&limit=${limit}`);
  },

  createAPIKey: (keyData) => {
    return api.post('/api/admin/api/keys', keyData);
  },

  revokeAPIKey: (keyId) => {
    return api.delete(`/api/admin/api/keys/${keyId}`);
  },

  updateAPIKey: (keyId, updates) => {
    return api.patch(`/api/admin/api/keys/${keyId}`, updates);
  },

  getAPIUsage: (keyId, timeRange = '30d') => {
    return api.get(`/api/admin/api/keys/${keyId}/usage?range=${timeRange}`);
  },

  // Rate Limiting
  getRateLimits: () => {
    return api.get('/api/admin/rate-limits');
  },

  updateRateLimit: (endpoint, limits) => {
    return api.patch(`/api/admin/rate-limits/${endpoint}`, limits);
  },

  getRateLimitViolations: (page = 1, limit = 50, timeRange = '24h') => {
    return api.get(`/api/admin/rate-limits/violations?page=${page}&limit=${limit}&range=${timeRange}`);
  },

  // Configuration Management
  getSystemConfig: () => {
    return api.get('/api/admin/config');
  },

  updateSystemConfig: (config) => {
    return api.patch('/api/admin/config', config);
  },

  getFeatureFlags: () => {
    return api.get('/api/admin/feature-flags');
  },

  updateFeatureFlag: (flagName, enabled) => {
    return api.patch(`/api/admin/feature-flags/${flagName}`, { enabled });
  },

  // Maintenance and Operations
  performMaintenance: (maintenanceType, options = {}) => {
    return api.post('/api/admin/maintenance', {
      type: maintenanceType,
      options
    });
  },

  getMaintenanceStatus: () => {
    return api.get('/api/admin/maintenance/status');
  },

  scheduleMaintenanceWindow: (schedule) => {
    return api.post('/api/admin/maintenance/schedule', schedule);
  },

  getScheduledMaintenance: () => {
    return api.get('/api/admin/maintenance/scheduled');
  },

  cancelScheduledMaintenance: (scheduleId) => {
    return api.delete(`/api/admin/maintenance/scheduled/${scheduleId}`);
  },

  // Database Operations
  getDatabaseStats: () => {
    return api.get('/api/admin/database/stats');
  },

  runDatabaseMaintenance: (operation) => {
    return api.post('/api/admin/database/maintenance', { operation });
  },

  createDatabaseBackup: (options = {}) => {
    return api.post('/api/admin/database/backup', options);
  },

  getBackupHistory: (page = 1, limit = 20) => {
    return api.get(`/api/admin/database/backups?page=${page}&limit=${limit}`);
  },

  restoreFromBackup: (backupId) => {
    return api.post(`/api/admin/database/restore/${backupId}`);
  },

  // Security and Audit
  getSecurityEvents: (page = 1, limit = 50, severity = 'all') => {
    return api.get(`/api/admin/security/events?page=${page}&limit=${limit}&severity=${severity}`);
  },

  getAuditLogs: (page = 1, limit = 50, action = 'all', userId = null) => {
    let url = `/api/admin/audit/logs?page=${page}&limit=${limit}&action=${action}`;
    if (userId) url += `&user_id=${userId}`;
    return api.get(url);
  },

  getLoginAttempts: (page = 1, limit = 50, status = 'all') => {
    return api.get(`/api/admin/security/login-attempts?page=${page}&limit=${limit}&status=${status}`);
  },

  blockIP: (ipAddress, reason, duration = null) => {
    return api.post('/api/admin/security/block-ip', {
      ipAddress,
      reason,
      duration
    });
  },

  unblockIP: (ipAddress) => {
    return api.delete(`/api/admin/security/block-ip/${ipAddress}`);
  },

  getBlockedIPs: (page = 1, limit = 50) => {
    return api.get(`/api/admin/security/blocked-ips?page=${page}&limit=${limit}`);
  },

  // Notification Management (Admin Level)
  getAllNotifications: (page = 1, limit = 50, type = 'all', status = 'all') => {
    return api.get(`/api/admin/notifications?page=${page}&limit=${limit}&type=${type}&status=${status}`);
  },

  sendBroadcastNotification: (notification) => {
    return api.post('/api/admin/notifications/broadcast', notification);
  },

  getNotificationTemplates: () => {
    return api.get('/api/admin/notifications/templates');
  },

  createNotificationTemplate: (template) => {
    return api.post('/api/admin/notifications/templates', template);
  },

  updateNotificationTemplate: (templateId, updates) => {
    return api.patch(`/api/admin/notifications/templates/${templateId}`, updates);
  },

  deleteNotificationTemplate: (templateId) => {
    return api.delete(`/api/admin/notifications/templates/${templateId}`);
  },

  getNotificationStats: (timeRange = '30d') => {
    return api.get(`/api/admin/notifications/stats?range=${timeRange}`);
  },

  // Media Management (Admin Level)
  getAllMedia: (page = 1, limit = 50, type = 'all') => {
    return api.get(`/api/admin/media?page=${page}&limit=${limit}&type=${type}`);
  },

  getMediaStats: () => {
    return api.get('/api/admin/media/stats');
  },

  deleteMedia: (mediaId, reason) => {
    return api.delete(`/api/admin/media/${mediaId}`, {
      data: { reason }
    });
  },

  getOrphanedMedia: (page = 1, limit = 50) => {
    return api.get(`/api/admin/media/orphaned?page=${page}&limit=${limit}`);
  },

  cleanupOrphanedMedia: () => {
    return api.post('/api/admin/media/cleanup-orphaned');
  },

  optimizeMedia: (mediaId) => {
    return api.post(`/api/admin/media/${mediaId}/optimize`);
  },

  bulkOptimizeMedia: (filters = {}) => {
    return api.post('/api/admin/media/bulk-optimize', filters);
  }
};

export default adminAPI;