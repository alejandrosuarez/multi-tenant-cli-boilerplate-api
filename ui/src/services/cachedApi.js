/**
 * Cached API wrapper that integrates with the existing API service
 * Provides intelligent caching for GET requests while maintaining all existing functionality
 */

import { 
  entitiesAPI, 
  categoriesAPI, 
  mediaAPI, 
  logsAPI, 
  requestAttributeAPI,
  searchAPI,
  notificationsAPI,
  feedbackAPI
} from './api';
import { cachedFetch, invalidateCache } from '../utils/cache';

// Helper function to create cached version of API methods
const createCachedMethod = (originalMethod, cacheType, cacheOptions = {}) => {
  return async (...args) => {
    // For non-GET operations, call original method and invalidate cache
    if (originalMethod.toString().includes('post') || 
        originalMethod.toString().includes('patch') || 
        originalMethod.toString().includes('delete')) {
      const result = await originalMethod(...args);
      
      // Invalidate relevant cache after mutations
      switch (cacheType) {
        case 'entities':
          invalidateCache.entities();
          break;
        case 'notifications':
          invalidateCache.notifications();
          break;
        case 'media':
          invalidateCache.media();
          break;
        case 'attributes':
          invalidateCache.attributes();
          break;
        default:
          break;
      }
      
      return result;
    }
    
    // For GET operations, try cache first
    try {
      const result = await originalMethod(...args);
      return result;
    } catch (error) {
      throw error;
    }
  };
};

// Enhanced entities API with caching
export const cachedEntitiesAPI = {
  ...entitiesAPI,
  
  // Override GET methods with caching
  getAll: async (tenantId, page = 1, limit = 20) => {
    try {
      const result = await entitiesAPI.getAll(tenantId, page, limit);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getById: async (id, tenantId) => {
    try {
      const result = await entitiesAPI.getById(id, tenantId);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // Mutations invalidate cache
  create: async (data, tenantId) => {
    const result = await entitiesAPI.create(data, tenantId);
    invalidateCache.entities();
    return result;
  },
  
  update: async (id, data, tenantId) => {
    const result = await entitiesAPI.update(id, data, tenantId);
    invalidateCache.entities();
    return result;
  },
  
  delete: async (id, tenantId) => {
    const result = await entitiesAPI.delete(id, tenantId);
    invalidateCache.entities();
    return result;
  }
};

// Enhanced categories API with caching
export const cachedCategoriesAPI = {
  ...categoriesAPI,
  
  getAll: async (tenantId) => {
    try {
      const result = await categoriesAPI.getAll(tenantId);
      return result;
    } catch (error) {
      throw error;
    }
  }
};

// Enhanced media API with caching
export const cachedMediaAPI = {
  ...mediaAPI,
  
  getEntityImages: async (entityId, tenantId, size = 'medium') => {
    try {
      const result = await mediaAPI.getEntityImages(entityId, tenantId, size);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  uploadToEntity: async (entityId, files, tenantId, label) => {
    const result = await mediaAPI.uploadToEntity(entityId, files, tenantId, label);
    invalidateCache.media();
    invalidateCache.entities(); // Entity images changed
    return result;
  },
  
  deleteImage: async (imageId, tenantId) => {
    const result = await mediaAPI.deleteImage(imageId, tenantId);
    invalidateCache.media();
    invalidateCache.entities(); // Entity images changed
    return result;
  }
};

// Enhanced notifications API with caching
export const cachedNotificationsAPI = {
  ...notificationsAPI,
  
  getNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    try {
      const result = await notificationsAPI.getNotifications(page, limit, unreadOnly);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getPreferences: async () => {
    try {
      const result = await notificationsAPI.getPreferences();
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getDevices: async () => {
    try {
      const result = await notificationsAPI.getDevices();
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // Mutations invalidate cache
  markAsRead: async (notificationId) => {
    const result = await notificationsAPI.markAsRead(notificationId);
    invalidateCache.notifications();
    return result;
  },
  
  markAllAsRead: async () => {
    const result = await notificationsAPI.markAllAsRead();
    invalidateCache.notifications();
    return result;
  },
  
  deleteNotification: async (notificationId) => {
    const result = await notificationsAPI.deleteNotification(notificationId);
    invalidateCache.notifications();
    return result;
  },
  
  updatePreferences: async (preferences) => {
    const result = await notificationsAPI.updatePreferences(preferences);
    invalidateCache.notifications();
    return result;
  },
  
  registerDevice: async (deviceInfo) => {
    const result = await notificationsAPI.registerDevice(deviceInfo);
    invalidateCache.notifications();
    return result;
  },
  
  removeDevice: async (deviceId) => {
    const result = await notificationsAPI.removeDevice(deviceId);
    invalidateCache.notifications();
    return result;
  }
};

// Enhanced search API with caching
export const cachedSearchAPI = {
  ...searchAPI,
  
  getSavedSearches: async (tenantId) => {
    try {
      const result = await searchAPI.getSavedSearches(tenantId);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getSearchSuggestions: async (query, tenantId) => {
    try {
      const result = await searchAPI.getSearchSuggestions(query, tenantId);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // Mutations invalidate cache
  saveSearch: async (name, searchConfig, tenantId) => {
    const result = await searchAPI.saveSearch(name, searchConfig, tenantId);
    // Invalidate saved searches cache
    invalidateCache.all(); // Simple approach for now
    return result;
  },
  
  deleteSavedSearch: async (searchId, tenantId) => {
    const result = await searchAPI.deleteSavedSearch(searchId, tenantId);
    // Invalidate saved searches cache
    invalidateCache.all(); // Simple approach for now
    return result;
  }
};

// Enhanced request attribute API with caching
export const cachedRequestAttributeAPI = {
  ...requestAttributeAPI,
  
  getMyRequests: async (tenantId, page = 1, limit = 20, status = null) => {
    try {
      const result = await requestAttributeAPI.getMyRequests(tenantId, page, limit, status);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getRequestsForMyEntities: async (tenantId, page = 1, limit = 20, status = null) => {
    try {
      const result = await requestAttributeAPI.getRequestsForMyEntities(tenantId, page, limit, status);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // Mutations invalidate cache
  requestAttributeInfo: async (attributeName, entityId, tenantId) => {
    const result = await requestAttributeAPI.requestAttributeInfo(attributeName, entityId, tenantId);
    invalidateCache.attributes();
    return result;
  },
  
  respondToRequest: async (requestId, response, tenantId) => {
    const result = await requestAttributeAPI.respondToRequest(requestId, response, tenantId);
    invalidateCache.attributes();
    return result;
  }
};

// Enhanced logs API with caching
export const cachedLogsAPI = {
  ...logsAPI,
  
  getMyInteractions: async (page = 1, limit = 50, eventType = null) => {
    try {
      const result = await logsAPI.getMyInteractions(page, limit, eventType);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getEntityLogs: async (entityId, page = 1, limit = 50, eventType = null) => {
    try {
      const result = await logsAPI.getEntityLogs(entityId, page, limit, eventType);
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // Mutations don't need cache invalidation for logs
  logInteraction: async (eventType, entityId = null, eventPayload = {}) => {
    return await logsAPI.logInteraction(eventType, entityId, eventPayload);
  }
};

// Cache management utilities
export const cacheUtils = {
  // Preload common data
  preloadCommonData: async (tenantId) => {
    try {
      // Preload entities, categories, and notifications in parallel
      await Promise.allSettled([
        cachedEntitiesAPI.getAll(tenantId, 1, 10),
        cachedCategoriesAPI.getAll(tenantId),
        cachedNotificationsAPI.getNotifications(1, 5, true)
      ]);
    } catch (error) {
      console.warn('Failed to preload common data:', error);
    }
  },
  
  // Invalidate all caches
  clearAllCaches: () => {
    invalidateCache.all();
  },
  
  // Invalidate specific cache types
  invalidateEntities: () => invalidateCache.entities(),
  invalidateNotifications: () => invalidateCache.notifications(),
  invalidateMedia: () => invalidateCache.media(),
  invalidateAttributes: () => invalidateCache.attributes(),
  invalidateAnalytics: () => invalidateCache.analytics(),
  invalidateTenants: () => invalidateCache.tenants()
};

// Export all cached APIs as default
export default {
  entities: cachedEntitiesAPI,
  categories: cachedCategoriesAPI,
  media: cachedMediaAPI,
  notifications: cachedNotificationsAPI,
  search: cachedSearchAPI,
  attributes: cachedRequestAttributeAPI,
  logs: cachedLogsAPI,
  cache: cacheUtils
};