/**
 * Intelligent caching utility for API responses
 * Supports memory cache, localStorage, and cache invalidation strategies
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheConfig = {
      // Default cache durations in milliseconds
      default: 5 * 60 * 1000, // 5 minutes
      entities: 10 * 60 * 1000, // 10 minutes
      analytics: 2 * 60 * 1000, // 2 minutes
      notifications: 30 * 1000, // 30 seconds
      media: 30 * 60 * 1000, // 30 minutes
      tenants: 15 * 60 * 1000, // 15 minutes
      system: 60 * 1000, // 1 minute
    };
    this.maxMemoryItems = 100;
    this.storagePrefix = 'app_cache_';
  }

  /**
   * Generate cache key from URL and parameters
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${url}${paramString ? '?' + paramString : ''}`;
  }

  /**
   * Get cache duration based on data type
   */
  getCacheDuration(type = 'default') {
    return this.cacheConfig[type] || this.cacheConfig.default;
  }

  /**
   * Check if cache entry is valid
   */
  isValid(entry) {
    if (!entry || !entry.timestamp) return false;
    return Date.now() - entry.timestamp < entry.duration;
  }

  /**
   * Get from memory cache
   */
  getFromMemory(key) {
    const entry = this.memoryCache.get(key);
    if (entry && this.isValid(entry)) {
      // Update access time for LRU
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  /**
   * Set in memory cache with LRU eviction
   */
  setInMemory(key, data, duration) {
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const oldestKey = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)[0][0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      duration
    });
  }

  /**
   * Get from localStorage
   */
  getFromStorage(key) {
    try {
      const stored = localStorage.getItem(this.storagePrefix + key);
      if (stored) {
        const entry = JSON.parse(stored);
        if (this.isValid(entry)) {
          return entry.data;
        } else {
          localStorage.removeItem(this.storagePrefix + key);
        }
      }
    } catch (error) {
      console.warn('Cache storage read error:', error);
    }
    return null;
  }

  /**
   * Set in localStorage
   */
  setInStorage(key, data, duration) {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        duration
      };
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache storage write error:', error);
      // If localStorage is full, try to clear old entries
      this.cleanupStorage();
    }
  }

  /**
   * Get cached data (memory first, then storage)
   */
  get(url, params = {}, type = 'default') {
    const key = this.generateKey(url, params);
    
    // Try memory cache first
    let data = this.getFromMemory(key);
    if (data) {
      return data;
    }

    // Try localStorage
    data = this.getFromStorage(key);
    if (data) {
      // Promote to memory cache
      const duration = this.getCacheDuration(type);
      this.setInMemory(key, data, duration);
      return data;
    }

    return null;
  }

  /**
   * Set cached data (both memory and storage)
   */
  set(url, params = {}, data, type = 'default', options = {}) {
    const key = this.generateKey(url, params);
    const duration = options.duration || this.getCacheDuration(type);
    
    // Always set in memory
    this.setInMemory(key, data, duration);
    
    // Set in storage if persistent
    if (options.persistent !== false) {
      this.setInStorage(key, data, duration);
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern) {
    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from storage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.storagePrefix) && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Cleanup old storage entries
   */
  cleanupStorage() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.storagePrefix));
      
      for (const key of cacheKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (!this.isValid(entry)) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let storageSize = 0;
    
    try {
      const keys = Object.keys(localStorage);
      storageSize = keys.filter(key => key.startsWith(this.storagePrefix)).length;
    } catch (error) {
      console.warn('Cache stats error:', error);
    }

    return {
      memorySize,
      storageSize,
      maxMemoryItems: this.maxMemoryItems
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Cache-aware fetch wrapper
 */
export const cachedFetch = async (url, options = {}) => {
  const {
    method = 'GET',
    cacheType = 'default',
    cacheOptions = {},
    ...fetchOptions
  } = options;

  // Only cache GET requests
  if (method.toUpperCase() !== 'GET') {
    return fetch(url, { method, ...fetchOptions });
  }

  const params = fetchOptions.params || {};
  
  // Try to get from cache first
  const cached = cacheManager.get(url, params, cacheType);
  if (cached) {
    return {
      ok: true,
      json: () => Promise.resolve(cached),
      data: cached,
      fromCache: true
    };
  }

  // Fetch from network
  try {
    const response = await fetch(url, { method, ...fetchOptions });
    
    if (response.ok) {
      const data = await response.json();
      
      // Cache the response
      cacheManager.set(url, params, data, cacheType, cacheOptions);
      
      return {
        ...response,
        data,
        fromCache: false
      };
    }
    
    return response;
  } catch (error) {
    // Return cached data if network fails and we have it
    const staleData = cacheManager.get(url, params, cacheType);
    if (staleData) {
      console.warn('Network failed, returning stale cache data:', error);
      return {
        ok: true,
        json: () => Promise.resolve(staleData),
        data: staleData,
        fromCache: true,
        stale: true
      };
    }
    throw error;
  }
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  entities: () => cacheManager.invalidate('/api/entities'),
  attributes: () => cacheManager.invalidate('/api/attributes'),
  notifications: () => cacheManager.invalidate('/api/notifications'),
  media: () => cacheManager.invalidate('/api/media'),
  analytics: () => cacheManager.invalidate('/api/analytics'),
  tenants: () => cacheManager.invalidate('/api/tenants'),
  all: () => cacheManager.clear()
};

/**
 * React hook for cache management
 */
export const useCache = () => {
  return {
    get: cacheManager.get.bind(cacheManager),
    set: cacheManager.set.bind(cacheManager),
    invalidate: cacheManager.invalidate.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    stats: cacheManager.getStats.bind(cacheManager)
  };
};

export default cacheManager;