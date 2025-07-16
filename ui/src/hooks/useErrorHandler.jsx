import React, { useCallback } from 'react';
import { useToast } from '../components/UI/ToastContainer';
import { getErrorMessage, classifyError, ErrorTypes } from '../utils/retryWrapper';

/**
 * Custom hook for centralized error handling
 */
export const useErrorHandler = () => {
  const { showError, showWarning, showInfo } = useToast();

  const handleError = useCallback((error, options = {}) => {
    const {
      showToast = true,
      customMessage = null,
      onRetry = null,
      context = null,
      silent = false
    } = options;

    // Log error for debugging
    console.error('Error occurred:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });

    // Don't show toast if silent mode is enabled
    if (silent) return;

    const errorType = classifyError(error);
    const message = customMessage || getErrorMessage(error);

    // Determine toast type based on error classification
    let toastType = 'error';
    if (errorType === ErrorTypes.RATE_LIMIT) {
      toastType = 'warning';
    } else if (errorType === ErrorTypes.NETWORK) {
      toastType = 'warning';
    }

    // Show appropriate toast
    if (showToast) {
      const toastOptions = {
        duration: 6000,
        ...(onRetry && {
          action: {
            label: 'Retry',
            onClick: onRetry
          }
        })
      };

      if (toastType === 'error') {
        showError(message, toastOptions);
      } else if (toastType === 'warning') {
        showWarning(message, toastOptions);
      } else {
        showInfo(message, toastOptions);
      }
    }

    // Return error details for further handling
    return {
      type: errorType,
      message,
      originalError: error
    };
  }, [showError, showWarning, showInfo]);

  const handleAsyncError = useCallback(async (asyncFn, options = {}) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw so calling code can handle it
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};

/**
 * Higher-order component for error boundary integration
 */
export const withErrorHandler = (Component) => {
  return function WrappedComponent(props) {
    const { handleError } = useErrorHandler();
    
    return (
      <Component 
        {...props} 
        onError={handleError}
      />
    );
  };
};

export default useErrorHandler;