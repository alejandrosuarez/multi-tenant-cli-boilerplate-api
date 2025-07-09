import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN = import.meta.env.VITE_TOKEN || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` })
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (email, tenantId) => api.post('/api/auth/send-otp', { email, tenantId }),
  verifyOTP: (email, otp, tenantId) => api.post('/api/auth/verify-otp', { email, otp, tenantId }),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me')
};

export const entitiesAPI = {
  getAll: (tenantId, page = 1, limit = 20) => api.get(`/api/entities?page=${page}&limit=${limit}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  getById: (id, tenantId) => api.get(`/api/entities/${id}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  create: (data, tenantId) => api.post('/api/entities', data, {
    headers: { 'X-Tenant-ID': tenantId }
  }),
  update: (id, data, tenantId) => api.patch(`/api/entities/${id}`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  }),
  delete: (id, tenantId) => api.delete(`/api/entities/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  }),
  search: (query, tenantId, page = 1, limit = 20) => api.get(`/api/entities/search?q=${query}&page=${page}&limit=${limit}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  getMyEntities: (tenantId, page = 1, limit = 20) => api.get(`/api/my/entities?page=${page}&limit=${limit}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
};

export const categoriesAPI = {
  getAll: (tenantId) => api.get('/api/categories', {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  getEntitiesByCategory: (category, tenantId, page = 1, limit = 20) => api.get(`/api/categories/${category}/entities?page=${page}&limit=${limit}`, {
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
    
    return api.post(`/api/entities/${entityId}/images`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'X-Tenant-ID': tenantId 
      }
    });
  },
  getEntityImages: (entityId, tenantId, size = 'medium') => api.get(`/api/entities/${entityId}/images?size=${size}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  }),
  deleteImage: (imageId, tenantId) => api.delete(`/api/images/${imageId}`, {
    headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
  })
};

export const logsAPI = {
  // Get user's interaction logs
  getMyInteractions: (page = 1, limit = 50, eventType = null) => {
    let url = `/api/my/interactions?page=${page}&limit=${limit}`;
    if (eventType) url += `&event_type=${eventType}`;
    return api.get(url);
  },
  
  // Get logs for a specific entity (only accessible by entity owners)
  getEntityLogs: (entityId, page = 1, limit = 50, eventType = null) => {
    let url = `/api/entities/${entityId}/logs?page=${page}&limit=${limit}`;
    if (eventType) url += `&event_type=${eventType}`;
    return api.get(url);
  },
  
  // Log a custom interaction event
  logInteraction: (eventType, entityId = null, eventPayload = {}) => {
    return api.post('/api/interaction_logs', {
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
    return api.post('/api/request-attribute', {
      attribute: attributeName,
      entityId: entityId
    }, {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {}
    });
  }
};

export default api;
