/**
 * Utility functions for handling retries and error recovery
 */

// Default retry configuration
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx server errors, and timeout errors
    if (!error.response) return true; // Network error
    if (error.response.status >= 500) return true; // Server error
    if (error.response.status === 408) return true; // Request timeout
    if (error.response.status === 429) return true; // Rate limited
    return false;
  }
};

/**
 * Wraps an async function with retry logic
 */
export const withRetry = (asyncFn, config = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await asyncFn(...args);
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry if this is the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }
        
        // Check if we should retry this error
        if (!retryConfig.retryCondition(error)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        
        // Call retry callback if provided
        if (retryConfig.onRetry) {
          retryConfig.onRetry(error, attempt + 1, retryConfig.maxRetries);
        }
      }
    }
    
    // If we get here, all retries failed
    if (retryConfig.onMaxRetriesReached) {
      retryConfig.onMaxRetriesReached(lastError, retryConfig.maxRetries);
    }
    
    throw lastError;
  };
};

/**
 * Creates a retry-enabled version of an API service
 */
export const createRetryableService = (service, config = {}) => {
  const retryableService = {};
  
  Object.keys(service).forEach(key => {
    if (typeof service[key] === 'function') {
      retryableService[key] = withRetry(service[key], config);
    } else {
      retryableService[key] = service[key];
    }
  });
  
  return retryableService;
};

/**
 * Error classification utilities
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNKNOWN: 'UNKNOWN'
};

export const classifyError = (error) => {
  if (!error.response) {
    return ErrorTypes.NETWORK;
  }
  
  const status = error.response.status;
  
  switch (true) {
    case status >= 500:
      return ErrorTypes.SERVER;
    case status === 429:
      return ErrorTypes.RATE_LIMIT;
    case status === 408:
      return ErrorTypes.TIMEOUT;
    case status === 401:
      return ErrorTypes.AUTHENTICATION;
    case status === 403:
      return ErrorTypes.AUTHORIZATION;
    case status === 404:
      return ErrorTypes.NOT_FOUND;
    case status === 409:
      return ErrorTypes.CONFLICT;
    case status >= 400 && status < 500:
      return status === 422 ? ErrorTypes.VALIDATION : ErrorTypes.CLIENT;
    default:
      return ErrorTypes.UNKNOWN;
  }
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  const errorType = classifyError(error);
  
  // Check if error has a custom message from the API
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Default messages based on error type
  const defaultMessages = {
    [ErrorTypes.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
    [ErrorTypes.SERVER]: 'Server error occurred. Please try again later.',
    [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
    [ErrorTypes.TIMEOUT]: 'Request timed out. Please try again.',
    [ErrorTypes.AUTHENTICATION]: 'Authentication required. Please log in again.',
    [ErrorTypes.AUTHORIZATION]: 'You do not have permission to perform this action.',
    [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorTypes.CONFLICT]: 'A conflict occurred. The resource may have been modified.',
    [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
    [ErrorTypes.CLIENT]: 'Invalid request. Please check your input.',
    [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
  };
  
  return defaultMessages[errorType] || defaultMessages[ErrorTypes.UNKNOWN];
};

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error) => {
  const errorType = classifyError(error);
  
  const retryableTypes = [
    ErrorTypes.NETWORK,
    ErrorTypes.SERVER,
    ErrorTypes.TIMEOUT,
    ErrorTypes.RATE_LIMIT
  ];
  
  return retryableTypes.includes(errorType);
};

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
  
  async execute(asyncFn, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await asyncFn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'CLOSED';
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return this.state;
  }
}