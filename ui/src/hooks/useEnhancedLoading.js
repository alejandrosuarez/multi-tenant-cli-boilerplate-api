/**
 * Enhanced loading hook with advanced features
 * Provides sophisticated loading state management with progress tracking,
 * timeout handling, and error recovery
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../components/UI/ToastContainer';
import { globalErrorHandler } from '../utils/errorHandling';

export const useEnhancedLoading = (defaultOptions = {}) => {
  const { 
    withLoading, 
    withProgressLoading, 
    startLoading, 
    stopLoading, 
    updateLoading, 
    isLoading 
  } = useLoading();
  const { showError, showWarning, showSuccess } = useToast();
  
  const [operationHistory, setOperationHistory] = useState([]);
  const timeoutsRef = useRef(new Map());
  const abortControllersRef = useRef(new Map());

  const options = {
    timeout: 30000, // 30 seconds default timeout
    showSuccessToast: false,
    showErrorToast: true,
    enableAbort: true,
    retryOnTimeout: true,
    maxRetries: 2,
    ...defaultOptions
  };

  // Cleanup timeouts and abort controllers on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      abortControllersRef.current.forEach(controller => controller.abort());
    };
  }, []);

  /**
   * Enhanced loading wrapper with timeout and abort support
   */
  const withEnhancedLoading = useCallback(async (
    key, 
    asyncFn, 
    message = 'Loading...', 
    operationOptions = {}
  ) => {
    const finalOptions = { ...options, ...operationOptions };
    let attempt = 0;
    let lastError = null;

    const executeOperation = async () => {
      attempt++;
      const operationId = `${key}_${Date.now()}_${attempt}`;
      
      try {
        // Create abort controller if enabled
        let abortController = null;
        if (finalOptions.enableAbort) {
          abortController = new AbortController();
          abortControllersRef.current.set(operationId, abortController);
        }

        // Set up timeout
        let timeoutId = null;
        if (finalOptions.timeout > 0) {
          timeoutId = setTimeout(() => {
            if (abortController) {
              abortController.abort();
            }
            stopLoading(key);
            
            const timeoutError = new Error(`Operation timed out after ${finalOptions.timeout}ms`);
            timeoutError.name = 'TimeoutError';
            throw timeoutError;
          }, finalOptions.timeout);
          
          timeoutsRef.current.set(operationId, timeoutId);
        }

        // Start loading
        startLoading(key, message, {
          timeout: finalOptions.timeout,
          attempt,
          maxRetries: finalOptions.maxRetries
        });

        // Execute the async function
        const startTime = Date.now();
        const result = await asyncFn(abortController?.signal);
        const duration = Date.now() - startTime;

        // Clean up
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutsRef.current.delete(operationId);
        }
        if (abortController) {
          abortControllersRef.current.delete(operationId);
        }

        // Record successful operation
        setOperationHistory(prev => [...prev.slice(-9), {
          key,
          message,
          status: 'success',
          duration,
          timestamp: new Date().toISOString(),
          attempt
        }]);

        // Show success toast if enabled
        if (finalOptions.showSuccessToast) {
          showSuccess(finalOptions.successMessage || 'Operation completed successfully');
        }

        return result;

      } catch (error) {
        lastError = error;
        
        // Clean up
        const timeoutId = timeoutsRef.current.get(operationId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutsRef.current.delete(operationId);
        }
        
        const abortController = abortControllersRef.current.get(operationId);
        if (abortController) {
          abortControllersRef.current.delete(operationId);
        }

        // Handle timeout errors with retry logic
        if (error.name === 'TimeoutError' && finalOptions.retryOnTimeout && attempt < finalOptions.maxRetries) {
          showWarning(`Operation timed out. Retrying... (${attempt}/${finalOptions.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          return executeOperation();
        }

        // Handle abort errors
        if (error.name === 'AbortError') {
          setOperationHistory(prev => [...prev.slice(-9), {
            key,
            message,
            status: 'aborted',
            timestamp: new Date().toISOString(),
            attempt
          }]);
          
          throw new Error('Operation was cancelled');
        }

        // Record failed operation
        setOperationHistory(prev => [...prev.slice(-9), {
          key,
          message,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
          attempt
        }]);

        // Handle error with global error handler
        await globalErrorHandler.handleError(error, {
          operation: key,
          message,
          attempt,
          maxRetries: finalOptions.maxRetries
        });

        // Show error toast if enabled
        if (finalOptions.showErrorToast) {
          showError(finalOptions.errorMessage || error.message);
        }

        throw error;
      } finally {
        stopLoading(key);
      }
    };

    return executeOperation();
  }, [
    startLoading, 
    stopLoading, 
    showError, 
    showWarning, 
    showSuccess, 
    options
  ]);

  /**
   * Enhanced progress loading with more detailed progress tracking
   */
  const withEnhancedProgressLoading = useCallback(async (
    key,
    asyncFn,
    message = 'Processing...',
    operationOptions = {}
  ) => {
    const finalOptions = { ...options, ...operationOptions };
    
    return withProgressLoading(key, async (updateProgress) => {
      const enhancedUpdateProgress = (progress, details = {}) => {
        updateProgress(progress);
        
        // Update loading state with additional details
        updateLoading(key, {
          progress,
          details,
          message: details.message || message
        });
      };

      try {
        const result = await asyncFn(enhancedUpdateProgress);
        
        // Record successful operation
        setOperationHistory(prev => [...prev.slice(-9), {
          key,
          message,
          status: 'success',
          timestamp: new Date().toISOString(),
          type: 'progress'
        }]);

        if (finalOptions.showSuccessToast) {
          showSuccess(finalOptions.successMessage || 'Operation completed successfully');
        }

        return result;
      } catch (error) {
        // Record failed operation
        setOperationHistory(prev => [...prev.slice(-9), {
          key,
          message,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
          type: 'progress'
        }]);

        await globalErrorHandler.handleError(error, {
          operation: key,
          message,
          type: 'progress'
        });

        if (finalOptions.showErrorToast) {
          showError(finalOptions.errorMessage || error.message);
        }

        throw error;
      }
    }, message);
  }, [withProgressLoading, updateLoading, showError, showSuccess, options]);

  /**
   * Batch loading for multiple operations
   */
  const withBatchLoading = useCallback(async (operations, batchOptions = {}) => {
    const batchKey = `batch_${Date.now()}`;
    const results = [];
    const errors = [];
    
    try {
      startLoading(batchKey, `Processing ${operations.length} operations...`);
      
      for (let i = 0; i < operations.length; i++) {
        const { key, asyncFn, message } = operations[i];
        
        try {
          updateLoading(batchKey, {
            progress: (i / operations.length) * 100,
            message: `Processing ${i + 1}/${operations.length}: ${message}`
          });
          
          const result = await asyncFn();
          results.push({ key, result, status: 'success' });
        } catch (error) {
          errors.push({ key, error, status: 'error' });
          
          if (!batchOptions.continueOnError) {
            throw error;
          }
        }
      }
      
      updateLoading(batchKey, {
        progress: 100,
        message: 'Batch operation completed'
      });
      
      return { results, errors, success: errors.length === 0 };
      
    } finally {
      stopLoading(batchKey);
    }
  }, [startLoading, stopLoading, updateLoading]);

  /**
   * Cancel a loading operation
   */
  const cancelOperation = useCallback((key) => {
    // Find and abort the operation
    for (const [operationId, controller] of abortControllersRef.current.entries()) {
      if (operationId.startsWith(key)) {
        controller.abort();
        abortControllersRef.current.delete(operationId);
      }
    }
    
    // Clear any timeouts
    for (const [operationId, timeoutId] of timeoutsRef.current.entries()) {
      if (operationId.startsWith(key)) {
        clearTimeout(timeoutId);
        timeoutsRef.current.delete(operationId);
      }
    }
    
    stopLoading(key);
  }, [stopLoading]);

  /**
   * Get operation statistics
   */
  const getOperationStats = useCallback(() => {
    const stats = {
      total: operationHistory.length,
      successful: operationHistory.filter(op => op.status === 'success').length,
      failed: operationHistory.filter(op => op.status === 'error').length,
      aborted: operationHistory.filter(op => op.status === 'aborted').length,
      recent: operationHistory.slice(-5)
    };
    
    return stats;
  }, [operationHistory]);

  /**
   * Clear operation history
   */
  const clearOperationHistory = useCallback(() => {
    setOperationHistory([]);
  }, []);

  return {
    // Enhanced loading methods
    withEnhancedLoading,
    withEnhancedProgressLoading,
    withBatchLoading,
    
    // Operation management
    cancelOperation,
    
    // Statistics and history
    operationHistory,
    getOperationStats,
    clearOperationHistory,
    
    // Original loading methods (for compatibility)
    withLoading,
    withProgressLoading,
    startLoading,
    stopLoading,
    updateLoading,
    isLoading
  };
};

export default useEnhancedLoading;