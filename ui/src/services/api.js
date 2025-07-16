import axios from 'axios';
import { withRetry, DEFAULT_RETRY_CONFIG, classifyError, ErrorTypes } from '../utils/retryWrapper';
import { cachedFetch, invalidateCache } from '../utils/cache';

const API_URL = import.meta.env.VITE_API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';
const TOKEN = import.meta.env.VITE_TOKEN || '';

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Remove Origin header - browsers set this automatically and don't allow manual override
    ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` })
  },
  withCredentials: false // Explicitly set to false for CORS
});

// Request interceptor for authentication and request logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        headers: config.headers,
        timeout: config.timeout
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and response logging
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = Date.now() - response.config.metadata.startTime;
    
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${responseTime}ms)`);
    }
    
    // Add response metadata
    response.metadata = {
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    return response;
  },
  (error) => {
    // Calculate response time if available
    const responseTime = error.config?.metadata ? 
      Date.now() - error.config.metadata.startTime : null;
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        message: error.message,
        responseTime: responseTime ? `${responseTime}ms` : 'unknown'
      });
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to auth page if not already there
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    
    // Enhance error with additional metadata
    error.metadata = {
      responseTime,
      timestamp: new Date().toISOString(),
      errorType: classifyError(error)
    };
    
    return Promise.reject(error);
  }
);

// Enhanced retry configuration for different API operations
const API_RETRY_CONFIG = {
  ...DEFAULT_RETRY_CONFIG,
  maxRetries: 2, // Reduce retries for API calls
  retryDelay: 1500,
  retryCondition: (error) => {
    const errorType = classifyError(error);
    
    // Don't retry client errors (4xx except 408, 429)
    if (errorType === ErrorTypes.CLIENT || 
        errorType === ErrorTypes.AUTHENTICATION || 
        errorType === ErrorTypes.AUTHORIZATION ||
        errorType === ErrorTypes.NOT_FOUND ||
        errorType === ErrorTypes.CONFLICT ||
        errorType === ErrorTypes.VALIDATION) {
      return false;
    }
    
    // Retry network, server, timeout, and rate limit errors
    return [
      ErrorTypes.NETWORK,
      ErrorTypes.SERVER,
      ErrorTypes.TIMEOUT,
      ErrorTypes.RATE_LIMIT
    ].includes(errorType);
  },
  onRetry: (error, attempt, maxRetries) => {
    console.log(`🔄 Retrying API call (${attempt}/${maxRetries}):`, {
      url: error.config?.url,
      method: error.config?.method,
      error: error.message
    });
  }
};

// Create retryable API instance
const createRetryableAPI = (apiInstance, config = API_RETRY_CONFIG) => {
  const retryableAPI = {};
  
  // Wrap common HTTP methods with retry logic
  ['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
    retryableAPI[method] = withRetry(
      (...args) => apiInstance[method](...args),
      config
    );
  });
  
  // Copy other properties
  Object.keys(apiInstance).forEach(key => {
    if (typeof apiInstance[key] !== 'function' || !['get', 'post', 'put', 'patch', 'delete'].includes(key)) {
      retryableAPI[key] = apiInstance[key];
    }
  });
  
  return retryableAPI;
};

// Create the retryable API instance
const retryableApi = createRetryableAPI(api);

// API endpoints using retryable instance for better reliability
export const authAPI = {
  sendOTP: (email, tenantId) => retryableApi.post('/api/auth/send-otp', { email, tenantId }),
  verifyOTP: (email, otp, tenantId) => retryableApi.post('/api/auth/verify-otp', { email, otp, tenantId }),
  logout: () => retryableApi.post('/api/auth/logout'),
  getMe: () => retryableApi.get('/api/auth/me')
};

export const entitiesAPI = {
  getAll: (tenantId, page = 1, limit = 20) => retryableApi.get(`/api/entities?page=${page}&limit=${limit}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  getById: (id, tenantId) => retryableApi.get(`/api/entities/${id}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  create: (data, tenantId) => retryableApi.post('/api/entities', data, {
    headers: { 'X-Tenant-ID': tenantId }
  }),
  update: (id, data, tenantId) => retryableApi.patch(`/api/entities/${id}`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  }),
  delete: (id, tenantId) => retryableApi.delete(`/api/entities/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  }),
  search: (query, tenantId, page = 1, limit = 20) => retryableApi.get(`/api/entities/search?q=${query}&page=${page}&limit=${limit}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  getMyEntities: (tenantId, page = 1, limit = 20) => retryableApi.get(`/api/my/entities?page=${page}&limit=${limit}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
};

export const categoriesAPI = {
  getAll: (tenantId) => retryableApi.get('/api/categories', {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  getEntitiesByCategory: (category, tenantId, page = 1, limit = 20) => retryableApi.get(`/api/categories/${category}/entities?page=${page}&limit=${limit}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  })
};

export const mediaAPI = {
  uploadToEntity: (entityId, files, tenantId, label) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }
    if (label) formData.append('label', label);
    
    // Use regular api for file uploads (no retry to avoid duplicate uploads)
    return api.post(`/api/entities/${entityId}/images`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'X-Tenant-ID': tenantId 
      }
    });
  },
  getEntityImages: (entityId, tenantId, size = 'medium') => retryableApi.get(`/api/entities/${entityId}/images?size=${size}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  deleteImage: (imageId, tenantId) => retryableApi.delete(`/api/images/${imageId}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  })
};

export const logsAPI = {
  // Get user's interaction logs
  getMyInteractions: (page = 1, limit = 50, eventType = null) => {
    let url = `/api/my/interactions?page=${page}&limit=${limit}`;
    if (eventType) url += `&event_type=${eventType}`;
    return retryableApi.get(url);
  },
  
  // Get logs for a specific entity (only accessible by entity owners)
  getEntityLogs: (entityId, page = 1, limit = 50, eventType = null) => {
    let url = `/api/entities/${entityId}/logs?page=${page}&limit=${limit}`;
    if (eventType) url += `&event_type=${eventType}`;
    return retryableApi.get(url);
  },
  
  // Log a custom interaction event
  logInteraction: (eventType, entityId = null, eventPayload = {}) => {
    return retryableApi.post('/api/interaction_logs', {
      eventType,
      entityId,
      eventPayload
    });
  }
};

// API for requesting attribute information
export const requestAttributeAPI = {
  // Request more information about a specific attribute from entity owner
  requestAttributeInfo: (attributeName, entityId, tenantId) => {
    return retryableApi.post('/api/request-attribute', {
      attribute: attributeName,
      entityId: entityId
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Get all attribute requests for the current user
  getMyRequests: (tenantId, page = 1, limit = 20, status = null) => {
    let url = `/api/my/attribute-requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return retryableApi.get(url, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Respond to an attribute request
  respondToRequest: (requestId, response, tenantId) => {
    return retryableApi.patch(`/api/attribute-requests/${requestId}`, { response }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Get attribute requests for entities owned by the user
  getRequestsForMyEntities: (tenantId, page = 1, limit = 20, status = null) => {
    let url = `/api/my/entities/attribute-requests?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return retryableApi.get(url, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  }
};

// Enhanced entities API with bulk operations
export const bulkOperationsAPI = {
  // Bulk update entities (no retry for bulk operations to avoid duplicates)
  bulkUpdate: (entityIds, updates, tenantId) => {
    return api.patch('/api/entities/bulk', {
      entityIds,
      updates
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Bulk delete entities (no retry for bulk operations to avoid duplicates)
  bulkDelete: (entityIds, tenantId) => {
    return api.delete('/api/entities/bulk', {
      data: { entityIds },
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Bulk create entities (no retry for bulk operations to avoid duplicates)
  bulkCreate: (entities, tenantId) => {
    return api.post('/api/entities/bulk', { entities }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Get bulk operation status
  getBulkOperationStatus: (operationId, tenantId) => {
    return retryableApi.get(`/api/bulk-operations/${operationId}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Export entities data (no retry for exports to avoid duplicate downloads)
  exportEntities: (filters, format = 'csv', tenantId) => {
    return api.post('/api/entities/export', {
      filters,
      format
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {},
      responseType: 'blob'
    });
  },
  
  // Import entities data (no retry for imports to avoid duplicates)
  importEntities: (file, tenantId, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
    
    return api.post('/api/entities/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Tenant-ID': tenantId
      }
    });
  }
};

// Enhanced search API
export const searchAPI = {
  // Global search across all data types
  globalSearch: (query, tenantId, filters = {}, page = 1, limit = 20) => {
    return retryableApi.post('/api/search/global', {
      query,
      filters,
      page,
      limit
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Advanced search with complex filters
  advancedSearch: (searchConfig, tenantId) => {
    return retryableApi.post('/api/search/advanced', searchConfig, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Save search configuration
  saveSearch: (name, searchConfig, tenantId) => {
    return retryableApi.post('/api/search/saved', {
      name,
      config: searchConfig
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Get saved searches
  getSavedSearches: (tenantId) => {
    return retryableApi.get('/api/search/saved', {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Delete saved search
  deleteSavedSearch: (searchId, tenantId) => {
    return retryableApi.delete(`/api/search/saved/${searchId}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  },
  
  // Get search suggestions
  getSearchSuggestions: (query, tenantId) => {
    return retryableApi.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  }
};

// Notifications API
export const notificationsAPI = {
  // Get user notifications
  getNotifications: (page = 1, limit = 20, unreadOnly = false) => {
    return retryableApi.get(`/api/notifications?page=${page}&limit=${limit}&unread_only=${unreadOnly}`);
  },
  
  // Mark notification as read
  markAsRead: (notificationId) => {
    return retryableApi.patch(`/api/notifications/${notificationId}/read`);
  },
  
  // Mark all notifications as read
  markAllAsRead: () => {
    return retryableApi.patch('/api/notifications/read-all');
  },
  
  // Delete notification
  deleteNotification: (notificationId) => {
    return retryableApi.delete(`/api/notifications/${notificationId}`);
  },
  
  // Get notification preferences
  getPreferences: () => {
    return retryableApi.get('/api/notifications/preferences');
  },
  
  // Update notification preferences
  updatePreferences: (preferences) => {
    return retryableApi.patch('/api/notifications/preferences', preferences);
  },
  
  // Get push notification devices
  getDevices: () => {
    return retryableApi.get('/api/notifications/devices');
  },
  
  // Register push notification device
  registerDevice: (deviceInfo) => {
    return retryableApi.post('/api/notifications/devices', deviceInfo);
  },
  
  // Remove push notification device
  removeDevice: (deviceId) => {
    return retryableApi.delete(`/api/notifications/devices/${deviceId}`);
  },
  
  // Send test notification
  sendTestNotification: (type, deviceId = null) => {
    return retryableApi.post('/api/notifications/test', { type, deviceId });
  }
};

// Feedback API for user feedback collection
export const feedbackAPI = {
  // Submit user feedback
  submitFeedback: (feedbackData) => {
    return retryableApi.post('/api/feedback', feedbackData);
  },
  
  // Get feedback history (for admins)
  getFeedbackHistory: (page = 1, limit = 20, filters = {}) => {
    return retryableApi.get('/api/feedback', {
      params: { page, limit, ...filters }
    });
  },
  
  // Update feedback status (for admins)
  updateFeedbackStatus: (feedbackId, status, response = null) => {
    return retryableApi.patch(`/api/feedback/${feedbackId}`, { status, response });
  }
};

export default api;
