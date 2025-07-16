import React, { useState } from 'react';
import { useToast } from './ToastContainer';
import { useLoading } from '../../contexts/LoadingContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import useEnhancedLoading from '../../hooks/useEnhancedLoading';
import ProgressIndicator from './ProgressIndicator';
import FeedbackModal from './FeedbackModal';
import ErrorReportingPanel from './ErrorReportingPanel';
import { withRetry, classifyError, ErrorTypes } from '../../utils/retryWrapper';
import { globalErrorHandler, EnhancedError, ErrorSeverity, ErrorCategory } from '../../utils/errorHandling';
import { entitiesAPI, feedbackAPI } from '../../services/api';

/**
 * Comprehensive demonstration component showing all error handling and loading features
 * This component serves as both a demo and reference implementation
 */
const ErrorHandlingDemo = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showErrorReporting, setShowErrorReporting] = useState(false);
  const [demoResults, setDemoResults] = useState([]);
  
  // Hook usage examples
  const { showSuccess, showError, showWarning, showInfo, showLoading } = useToast();
  const { startLoading, stopLoading, withLoading, withProgressLoading, isLoading } = useLoading();
  const { handleError, handleAsyncError } = useErrorHandler();
  const { 
    withEnhancedLoading, 
    withEnhancedProgressLoading, 
    withBatchLoading, 
    cancelOperation,
    getOperationStats,
    clearOperationHistory 
  } = useEnhancedLoading();

  // Demo functions for different error handling scenarios
  const demoToastNotifications = () => {
    showSuccess('Operation completed successfully!');
    setTimeout(() => showInfo('This is an informational message'), 1000);
    setTimeout(() => showWarning('This is a warning message'), 2000);
    setTimeout(() => showError('This is an error message'), 3000);
    
    // Loading toast that gets removed after 3 seconds
    const loadingToastId = showLoading('Processing your request...');
    setTimeout(() => {
      // In real usage, you'd remove this when the operation completes
      showSuccess('Loading completed!');
    }, 3000);
  };

  const demoBasicLoading = async () => {
    const loadingKey = 'basic-demo';
    startLoading(loadingKey, 'Performing basic operation...');
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Basic loading demo completed!');
      setDemoResults(prev => [...prev, 'Basic loading: Success']);
    } catch (error) {
      handleError(error);
      setDemoResults(prev => [...prev, 'Basic loading: Failed']);
    } finally {
      stopLoading(loadingKey);
    }
  };

  const demoProgressLoading = async () => {
    try {
      await withProgressLoading('progress-demo', async (updateProgress) => {
        for (let i = 0; i <= 100; i += 10) {
          updateProgress(i);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }, 'Processing with progress...');
      
      showSuccess('Progress loading demo completed!');
      setDemoResults(prev => [...prev, 'Progress loading: Success']);
    } catch (error) {
      handleError(error);
      setDemoResults(prev => [...prev, 'Progress loading: Failed']);
    }
  };

  const demoRetryMechanism = async () => {
    try {
      const retryableOperation = withRetry(async () => {
        // Simulate an operation that fails 2 times then succeeds
        const random = Math.random();
        if (random < 0.7) {
          throw new Error('Simulated network error');
        }
        return 'Success after retries!';
      }, {
        maxRetries: 3,
        retryDelay: 1000,
        onRetry: (error, attempt, maxRetries) => {
          showWarning(`Retry attempt ${attempt}/${maxRetries}: ${error.message}`);
        }
      });

      await withLoading('retry-demo', async () => {
        const result = await retryableOperation();
        showSuccess(result);
        setDemoResults(prev => [...prev, 'Retry mechanism: Success']);
      }, 'Testing retry mechanism...');
    } catch (error) {
      handleError(error, {
        customMessage: 'All retry attempts failed',
        onRetry: () => demoRetryMechanism()
      });
      setDemoResults(prev => [...prev, 'Retry mechanism: Failed']);
    }
  };

  const demoAPIErrorHandling = async () => {
    try {
      await handleAsyncError(async () => {
        // Simulate API call that might fail
        throw new Error('API endpoint not found');
      }, {
        context: 'API Demo',
        customMessage: 'Failed to fetch data from API',
        onRetry: () => demoAPIErrorHandling()
      });
    } catch (error) {
      setDemoResults(prev => [...prev, 'API error handling: Demonstrated']);
    }
  };

  const demoErrorClassification = () => {
    const errors = [
      { error: new Error('Network error'), response: null },
      { error: new Error('Server error'), response: { status: 500 } },
      { error: new Error('Not found'), response: { status: 404 } },
      { error: new Error('Unauthorized'), response: { status: 401 } },
      { error: new Error('Rate limited'), response: { status: 429 } }
    ];

    errors.forEach((errorObj, index) => {
      setTimeout(() => {
        const errorType = classifyError(errorObj);
        showInfo(`Error ${index + 1}: ${errorType}`, { duration: 2000 });
      }, index * 500);
    });

    setDemoResults(prev => [...prev, 'Error classification: Demonstrated']);
  };

  const demoRealAPICall = async () => {
    try {
      await withLoading('api-call-demo', async () => {
        // This will likely fail since we don't have real data, but demonstrates the pattern
        const response = await entitiesAPI.getAll('demo-tenant', 1, 5);
        showSuccess('Real API call succeeded!');
        setDemoResults(prev => [...prev, 'Real API call: Success']);
      }, 'Making real API call...');
    } catch (error) {
      handleError(error, {
        context: 'Real API Call Demo',
        onRetry: () => demoRealAPICall()
      });
      setDemoResults(prev => [...prev, 'Real API call: Error handled']);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await withLoading('feedback-submit', async () => {
        await feedbackAPI.submitFeedback(feedbackData);
        showSuccess('Feedback submitted successfully!');
        setDemoResults(prev => [...prev, 'Feedback submission: Success']);
      }, 'Submitting feedback...');
    } catch (error) {
      handleError(error, {
        context: 'Feedback Submission',
        customMessage: 'Failed to submit feedback. Please try again.'
      });
      setDemoResults(prev => [...prev, 'Feedback submission: Error handled']);
    }
  };

  const clearResults = () => {
    setDemoResults([]);
  };

  // Enhanced error handling demos
  const demoEnhancedError = async () => {
    try {
      // Create an enhanced error with custom metadata
      const enhancedError = new EnhancedError('This is a demo enhanced error', {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.BUSINESS_LOGIC,
        context: { demoType: 'enhanced-error', userId: 'demo-user' },
        userMessage: 'A demonstration error occurred with enhanced metadata'
      });
      
      await globalErrorHandler.handleError(enhancedError);
      setDemoResults(prev => [...prev, 'Enhanced error: Created and handled']);
    } catch (error) {
      setDemoResults(prev => [...prev, 'Enhanced error: Failed to create']);
    }
  };

  const demoEnhancedLoading = async () => {
    try {
      await withEnhancedLoading(
        'enhanced-demo',
        async (abortSignal) => {
          // Simulate long operation with abort support
          for (let i = 0; i < 5; i++) {
            if (abortSignal?.aborted) {
              throw new Error('Operation was aborted');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          return 'Enhanced loading completed!';
        },
        'Enhanced loading with timeout and abort...',
        {
          timeout: 10000,
          showSuccessToast: true,
          successMessage: 'Enhanced loading demo completed!'
        }
      );
      
      setDemoResults(prev => [...prev, 'Enhanced loading: Success']);
    } catch (error) {
      setDemoResults(prev => [...prev, `Enhanced loading: ${error.message}`]);
    }
  };

  const demoBatchLoading = async () => {
    const operations = [
      {
        key: 'op1',
        asyncFn: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return 'Operation 1 completed';
        },
        message: 'Running operation 1'
      },
      {
        key: 'op2',
        asyncFn: async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return 'Operation 2 completed';
        },
        message: 'Running operation 2'
      },
      {
        key: 'op3',
        asyncFn: async () => {
          await new Promise(resolve => setTimeout(resolve, 800));
          // Simulate one failure
          if (Math.random() < 0.5) {
            throw new Error('Operation 3 failed');
          }
          return 'Operation 3 completed';
        },
        message: 'Running operation 3'
      }
    ];

    try {
      const result = await withBatchLoading(operations, { continueOnError: true });
      showSuccess(`Batch completed: ${result.results.length} success, ${result.errors.length} errors`);
      setDemoResults(prev => [...prev, `Batch loading: ${result.success ? 'All success' : 'Some failures'}`]);
    } catch (error) {
      setDemoResults(prev => [...prev, 'Batch loading: Failed']);
    }
  };

  const demoOperationStats = () => {
    const stats = getOperationStats();
    showInfo(`Operations: ${stats.total} total, ${stats.successful} successful, ${stats.failed} failed`);
    setDemoResults(prev => [...prev, `Operation stats: ${JSON.stringify(stats)}`]);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Error Handling & Loading Demo</h2>
      <p>This component demonstrates all the error handling and loading features implemented in the application.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={demoToastNotifications}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Toast Notifications
        </button>

        <button 
          onClick={demoBasicLoading}
          disabled={isLoading('basic-demo')}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          {isLoading('basic-demo') ? 'Loading...' : 'Demo Basic Loading'}
        </button>

        <button 
          onClick={demoProgressLoading}
          disabled={isLoading('progress-demo')}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Progress Loading
        </button>

        <button 
          onClick={demoRetryMechanism}
          disabled={isLoading('retry-demo')}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Retry Mechanism
        </button>

        <button 
          onClick={demoAPIErrorHandling}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo API Error Handling
        </button>

        <button 
          onClick={demoErrorClassification}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Error Classification
        </button>

        <button 
          onClick={demoRealAPICall}
          disabled={isLoading('api-call-demo')}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Real API Call
        </button>

        <button 
          onClick={() => setShowFeedbackModal(true)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Feedback Modal
        </button>

        <button 
          onClick={() => setShowErrorReporting(true)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          View Error Reports
        </button>

        <button 
          onClick={demoEnhancedError}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Enhanced Error
        </button>

        <button 
          onClick={demoEnhancedLoading}
          disabled={isLoading('enhanced-demo')}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Enhanced Loading
        </button>

        <button 
          onClick={demoBatchLoading}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Demo Batch Loading
        </button>

        <button 
          onClick={demoOperationStats}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer' }}
        >
          Show Operation Stats
        </button>
      </div>

      {/* Loading indicators for active operations */}
      <div style={{ marginBottom: '2rem' }}>
        {isLoading('basic-demo') && (
          <ProgressIndicator 
            indeterminate={true}
            message="Basic loading in progress..."
            size="medium"
          />
        )}
        {isLoading('progress-demo') && (
          <ProgressIndicator 
            progress={0}
            message="Progress loading in progress..."
            size="medium"
            showPercentage={true}
          />
        )}
        {isLoading('retry-demo') && (
          <ProgressIndicator 
            indeterminate={true}
            message="Testing retry mechanism..."
            size="medium"
          />
        )}
        {isLoading('api-call-demo') && (
          <ProgressIndicator 
            indeterminate={true}
            message="Making API call..."
            size="medium"
          />
        )}
        {isLoading('feedback-submit') && (
          <ProgressIndicator 
            indeterminate={true}
            message="Submitting feedback..."
            size="medium"
          />
        )}
      </div>

      {/* Demo results */}
      {demoResults.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Demo Results:</h3>
            <button 
              onClick={clearResults}
              style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
            >
              Clear Results
            </button>
          </div>
          <ul style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', listStyle: 'none' }}>
            {demoResults.map((result, index) => (
              <li key={index} style={{ padding: '0.25rem 0', borderBottom: index < demoResults.length - 1 ? '1px solid #eee' : 'none' }}>
                {result}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Usage examples */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h3>Usage Examples:</h3>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.875rem' }}>
{`// Toast notifications
const { showSuccess, showError, showWarning, showInfo } = useToast();
showSuccess('Operation completed!');
showError('Something went wrong', { duration: 8000 });

// Loading states
const { withLoading, startLoading, stopLoading } = useLoading();
await withLoading('my-operation', async () => {
  // Your async operation here
}, 'Loading message...');

// Error handling
const { handleError, handleAsyncError } = useErrorHandler();
try {
  await handleAsyncError(async () => {
    // Your async operation that might fail
  }, { context: 'My Operation' });
} catch (error) {
  // Error was already handled and toast shown
}

// Retry mechanism
const retryableOperation = withRetry(myAsyncFunction, {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (error, attempt) => console.log(\`Retry \${attempt}\`)
});`}
        </pre>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        type="general"
      />

      {/* Error Reporting Panel */}
      <ErrorReportingPanel
        isOpen={showErrorReporting}
        onClose={() => setShowErrorReporting(false)}
      />
    </div>
  );
};

export default ErrorHandlingDemo;