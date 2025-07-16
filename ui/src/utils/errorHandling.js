/**
 * Comprehensive error handling utilities
 * Provides centralized error handling, logging, and user feedback
 */

import { getErrorMessage, classifyError, ErrorTypes } from './retryWrapper';

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories for better organization
export const ErrorCategory = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  USER_INPUT: 'user_input',
  EXTERNAL_SERVICE: 'external_service'
};

/**
 * Enhanced error object with additional metadata
 */
export class EnhancedError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'EnhancedError';
    this.timestamp = new Date().toISOString();
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.category = options.category || ErrorCategory.SYSTEM;
    this.context = options.context || {};
    this.userMessage = options.userMessage || message;
    this.retryable = options.retryable !== false;
    this.reportable = options.reportable !== false;
    this.originalError = options.originalError || null;
    this.errorId = this.generateErrorId();
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      errorId: this.errorId,
      retryable: this.retryable,
      reportable: this.reportable,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Error handler class for centralized error management
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableLogging: options.enableLogging !== false,
      enableReporting: options.enableReporting !== false,
      enableUserFeedback: options.enableUserFeedback !== false,
      logLevel: options.logLevel || 'error',
      reportingEndpoint: options.reportingEndpoint || '/api/errors',
      maxRetries: options.maxRetries || 3,
      ...options
    };
    
    this.errorQueue = [];
    this.listeners = [];
  }

  /**
   * Handle an error with comprehensive processing
   */
  async handleError(error, context = {}) {
    const enhancedError = this.enhanceError(error, context);
    
    // Log the error
    if (this.options.enableLogging) {
      this.logError(enhancedError);
    }
    
    // Report the error if it's reportable
    if (this.options.enableReporting && enhancedError.reportable) {
      await this.reportError(enhancedError);
    }
    
    // Notify listeners
    this.notifyListeners(enhancedError);
    
    // Add to error queue for batch processing
    this.errorQueue.push(enhancedError);
    
    return enhancedError;
  }

  /**
   * Enhance a regular error with additional metadata
   */
  enhanceError(error, context = {}) {
    if (error instanceof EnhancedError) {
      return error;
    }

    const errorType = classifyError(error);
    const severity = this.determineSeverity(error, errorType);
    const category = this.determineCategory(error, errorType);
    
    return new EnhancedError(error.message, {
      severity,
      category,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorType
      },
      userMessage: getErrorMessage(error),
      retryable: this.isRetryable(error, errorType),
      reportable: this.isReportable(error, errorType),
      originalError: error
    });
  }

  /**
   * Determine error severity based on error type and context
   */
  determineSeverity(error, errorType) {
    switch (errorType) {
      case ErrorTypes.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorTypes.SERVER:
        return ErrorSeverity.HIGH;
      case ErrorTypes.AUTHENTICATION:
      case ErrorTypes.AUTHORIZATION:
        return ErrorSeverity.MEDIUM;
      case ErrorTypes.VALIDATION:
      case ErrorTypes.CLIENT:
        return ErrorSeverity.LOW;
      case ErrorTypes.TIMEOUT:
      case ErrorTypes.RATE_LIMIT:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Determine error category based on error type
   */
  determineCategory(error, errorType) {
    switch (errorType) {
      case ErrorTypes.NETWORK:
        return ErrorCategory.NETWORK;
      case ErrorTypes.AUTHENTICATION:
        return ErrorCategory.AUTHENTICATION;
      case ErrorTypes.AUTHORIZATION:
        return ErrorCategory.AUTHORIZATION;
      case ErrorTypes.VALIDATION:
        return ErrorCategory.VALIDATION;
      case ErrorTypes.SERVER:
        return ErrorCategory.SYSTEM;
      default:
        return ErrorCategory.SYSTEM;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error, errorType) {
    const nonRetryableTypes = [
      ErrorTypes.AUTHENTICATION,
      ErrorTypes.AUTHORIZATION,
      ErrorTypes.VALIDATION,
      ErrorTypes.NOT_FOUND,
      ErrorTypes.CONFLICT
    ];
    
    return !nonRetryableTypes.includes(errorType);
  }

  /**
   * Check if error should be reported
   */
  isReportable(error, errorType) {
    // Don't report client-side validation errors or expected errors
    const nonReportableTypes = [
      ErrorTypes.VALIDATION,
      ErrorTypes.NOT_FOUND
    ];
    
    return !nonReportableTypes.includes(errorType);
  }

  /**
   * Log error to console with appropriate level
   */
  logError(error) {
    const logData = {
      errorId: error.errorId,
      message: error.message,
      severity: error.severity,
      category: error.category,
      context: error.context,
      timestamp: error.timestamp
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('🔵 Low severity error:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('🟡 Medium severity error:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('🔴 High severity error:', logData);
        break;
      case ErrorSeverity.CRITICAL:
        console.error('💥 CRITICAL ERROR:', logData);
        break;
      default:
        console.error('❌ Error:', logData);
    }
  }

  /**
   * Report error to external service
   */
  async reportError(error) {
    try {
      const reportData = {
        ...error.toJSON(),
        environment: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION || 'unknown'
      };

      await fetch(this.options.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Add error listener
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of error
   */
  notifyListeners(error) {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {},
      byCategory: {},
      recent: this.errorQueue.slice(-10)
    };

    this.errorQueue.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error queue
   */
  clearErrors() {
    this.errorQueue = [];
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler({
  enableLogging: true,
  enableReporting: import.meta.env.PROD,
  enableUserFeedback: true
});

/**
 * Utility functions for common error handling patterns
 */

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const enhancedError = await globalErrorHandler.handleError(error, {
        functionName: asyncFn.name,
        arguments: args,
        ...options.context
      });
      
      if (options.rethrow !== false) {
        throw enhancedError;
      }
      
      return options.fallbackValue;
    }
  };
};

/**
 * Create error boundary HOC for React components
 * Note: This should be used in .jsx files, not .js files
 */
export const withErrorBoundary = (Component) => {
  // This function should be used in React components (.jsx files)
  // where JSX syntax is available
  console.warn('withErrorBoundary should be used in .jsx files with React import');
  return Component; // Return original component as fallback
};

/**
 * Validation error helper
 */
export const createValidationError = (field, message, value = null) => {
  return new EnhancedError(`Validation failed for ${field}: ${message}`, {
    severity: ErrorSeverity.LOW,
    category: ErrorCategory.VALIDATION,
    context: { field, value },
    userMessage: message,
    retryable: false,
    reportable: false
  });
};

/**
 * Network error helper
 */
export const createNetworkError = (message, originalError = null) => {
  return new EnhancedError(message, {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.NETWORK,
    userMessage: 'Network connection issue. Please check your internet connection.',
    retryable: true,
    originalError
  });
};

/**
 * Business logic error helper
 */
export const createBusinessLogicError = (message, context = {}) => {
  return new EnhancedError(message, {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.BUSINESS_LOGIC,
    context,
    userMessage: message,
    retryable: false
  });
};

export default globalErrorHandler;