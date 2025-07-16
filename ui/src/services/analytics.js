import api from './api.js';

// Analytics service for metrics and reporting API calls
export const analyticsAPI = {
  // Get dashboard metrics
  getDashboardMetrics: (tenantId, timeRange = '7d') => {
    return api.get(`/api/analytics/dashboard?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get entity analytics
  getEntityAnalytics: (tenantId, filters = {}) => {
    return api.post('/api/analytics/entities', filters, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get interaction analytics
  getInteractionAnalytics: (tenantId, timeRange = '30d', groupBy = 'day') => {
    return api.get(`/api/analytics/interactions?range=${timeRange}&group_by=${groupBy}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get attribute request analytics
  getAttributeRequestAnalytics: (tenantId, timeRange = '30d') => {
    return api.get(`/api/analytics/attribute-requests?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get user activity analytics
  getUserActivityAnalytics: (tenantId, timeRange = '30d') => {
    return api.get(`/api/analytics/user-activity?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get notification analytics
  getNotificationAnalytics: (tenantId, timeRange = '30d') => {
    return api.get(`/api/analytics/notifications?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get media usage analytics
  getMediaAnalytics: (tenantId, timeRange = '30d') => {
    return api.get(`/api/analytics/media?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get search analytics
  getSearchAnalytics: (tenantId, timeRange = '30d') => {
    return api.get(`/api/analytics/search?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get performance metrics
  getPerformanceMetrics: (timeRange = '24h') => {
    return api.get(`/api/analytics/performance?range=${timeRange}`);
  },

  // Get real-time metrics
  getRealTimeMetrics: (tenantId) => {
    return api.get('/api/analytics/realtime', {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Generate custom report
  generateReport: (reportConfig, tenantId) => {
    return api.post('/api/analytics/reports', reportConfig, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get report status
  getReportStatus: (reportId, tenantId) => {
    return api.get(`/api/analytics/reports/${reportId}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Download report
  downloadReport: (reportId, tenantId, format = 'pdf') => {
    return api.get(`/api/analytics/reports/${reportId}/download?format=${format}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {},
      responseType: 'blob'
    });
  },

  // Get saved reports
  getSavedReports: (tenantId, page = 1, limit = 20) => {
    return api.get(`/api/analytics/reports?page=${page}&limit=${limit}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Delete report
  deleteReport: (reportId, tenantId) => {
    return api.delete(`/api/analytics/reports/${reportId}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Schedule report
  scheduleReport: (reportConfig, schedule, tenantId) => {
    return api.post('/api/analytics/reports/schedule', {
      ...reportConfig,
      schedule
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get scheduled reports
  getScheduledReports: (tenantId) => {
    return api.get('/api/analytics/reports/scheduled', {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Update scheduled report
  updateScheduledReport: (scheduleId, updates, tenantId) => {
    return api.patch(`/api/analytics/reports/scheduled/${scheduleId}`, updates, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Delete scheduled report
  deleteScheduledReport: (scheduleId, tenantId) => {
    return api.delete(`/api/analytics/reports/scheduled/${scheduleId}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get trend analysis
  getTrendAnalysis: (metric, tenantId, timeRange = '90d', granularity = 'day') => {
    return api.get(`/api/analytics/trends/${metric}?range=${timeRange}&granularity=${granularity}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get comparative analytics
  getComparativeAnalytics: (metrics, tenantId, timeRange = '30d', compareWith = 'previous_period') => {
    return api.post('/api/analytics/compare', {
      metrics,
      timeRange,
      compareWith
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get funnel analysis
  getFunnelAnalysis: (funnelConfig, tenantId) => {
    return api.post('/api/analytics/funnel', funnelConfig, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get cohort analysis
  getCohortAnalysis: (cohortConfig, tenantId) => {
    return api.post('/api/analytics/cohort', cohortConfig, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Get retention analysis
  getRetentionAnalysis: (tenantId, timeRange = '90d') => {
    return api.get(`/api/analytics/retention?range=${timeRange}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },

  // Export analytics data
  exportAnalyticsData: (dataType, filters, format = 'csv', tenantId) => {
    return api.post('/api/analytics/export', {
      dataType,
      filters,
      format
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {},
      responseType: 'blob'
    });
  },

  // Get interaction logs (for InteractionAnalytics)
  getInteractionLogs: (tenantId, filters = {}) => {
    return api.post('/api/analytics/interaction-logs', filters, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  }
};

export default analyticsAPI;