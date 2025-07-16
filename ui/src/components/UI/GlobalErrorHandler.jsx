import { useEffect } from 'react';
import { useToast } from './ToastContainer';
import { getErrorMessage, classifyError, ErrorTypes } from '../../utils/retryWrapper';

/**
 * Global error handler component that catches unhandled errors and shows user-friendly notifications
 */
const GlobalErrorHandler = () => {
  const { showError, showWarning } = useToast();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason;
      const errorType = classifyError(error);
      const message = getErrorMessage(error);
      
      // Show appropriate toast based on error type
      if (errorType === ErrorTypes.NETWORK) {
        showWarning('Connection issue detected. Please check your internet connection.', {
          duration: 8000
        });
      } else if (errorType === ErrorTypes.SERVER) {
        showError('Server error occurred. Our team has been notified.', {
          duration: 6000
        });
      } else {
        showError(message, {
          duration: 5000
        });
      }
      
      // Prevent the default browser error handling
      event.preventDefault();
    };

    // Handle JavaScript errors
    const handleError = (event) => {
      console.error('JavaScript error:', event.error);
      
      // Don't show toast for script loading errors or minor issues
      if (event.error && event.error.message) {
        const message = event.error.message.toLowerCase();
        
        // Skip common non-critical errors
        if (message.includes('script error') || 
            message.includes('non-error promise rejection') ||
            message.includes('loading chunk')) {
          return;
        }
      }
      
      showError('An unexpected error occurred. Please refresh the page if issues persist.', {
        duration: 6000
      });
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [showError, showWarning]);

  // This component doesn't render anything
  return null;
};

export default GlobalErrorHandler;