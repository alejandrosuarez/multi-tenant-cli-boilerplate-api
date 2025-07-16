import React, { useState, useEffect } from 'react';
import { globalErrorHandler } from '../../utils/errorHandling';
import { useToast } from './ToastContainer';
import { feedbackAPI } from '../../services/api';
import './ErrorReportingPanel.css';

/**
 * Error reporting panel component for displaying error statistics
 * and allowing users to report issues
 */
const ErrorReportingPanel = ({ isOpen, onClose }) => {
  const [errorStats, setErrorStats] = useState(null);
  const [selectedError, setSelectedError] = useState(null);
  const [reportingError, setReportingError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadErrorStats();
    }
  }, [isOpen]);

  const loadErrorStats = () => {
    const stats = globalErrorHandler.getErrorStats();
    setErrorStats(stats);
  };

  const handleReportError = async (error) => {
    setIsSubmitting(true);
    setReportingError(null);

    try {
      await feedbackAPI.submitFeedback({
        type: 'error',
        category: 'Bug Report',
        rating: 1,
        message: `Error Report: ${error.message}`,
        systemInfo: {
          errorId: error.errorId,
          errorDetails: error.toJSON(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });

      showSuccess('Error report submitted successfully');
      setSelectedError(null);
    } catch (err) {
      setReportingError(err.message);
      showError('Failed to submit error report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearErrors = () => {
    globalErrorHandler.clearErrors();
    setErrorStats(null);
    setSelectedError(null);
    showSuccess('Error history cleared');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      case 'critical': return '#8e44ad';
      default: return '#95a5a6';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="error-reporting-overlay" onClick={onClose}>
      <div className="error-reporting-panel" onClick={e => e.stopPropagation()}>
        <div className="error-reporting-header">
          <h3>Error Reporting Panel</h3>
          <button 
            className="error-reporting-close"
            onClick={onClose}
            aria-label="Close error reporting panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="error-reporting-content">
          {!errorStats ? (
            <div className="error-reporting-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>No errors recorded</p>
              <small>Error statistics will appear here when errors occur</small>
            </div>
          ) : (
            <>
              {/* Error Statistics */}
              <div className="error-stats-section">
                <h4>Error Statistics</h4>
                <div className="error-stats-grid">
                  <div className="error-stat-card">
                    <div className="error-stat-number">{errorStats.total}</div>
                    <div className="error-stat-label">Total Errors</div>
                  </div>
                  
                  {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="error-stat-card">
                      <div 
                        className="error-stat-number"
                        style={{ color: getSeverityColor(severity) }}
                      >
                        {count}
                      </div>
                      <div className="error-stat-label">
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="error-categories">
                  <h5>By Category</h5>
                  <div className="error-category-list">
                    {Object.entries(errorStats.byCategory).map(([category, count]) => (
                      <div key={category} className="error-category-item">
                        <span className="error-category-name">
                          {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="error-category-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Errors */}
              <div className="recent-errors-section">
                <div className="recent-errors-header">
                  <h4>Recent Errors</h4>
                  <button 
                    className="clear-errors-button"
                    onClick={handleClearErrors}
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="recent-errors-list">
                  {errorStats.recent.map((error, index) => (
                    <div 
                      key={error.errorId || index} 
                      className="error-item"
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="error-item-header">
                        <div 
                          className="error-severity-indicator"
                          style={{ backgroundColor: getSeverityColor(error.severity) }}
                        />
                        <div className="error-item-title">{error.message}</div>
                        <div className="error-item-time">
                          {formatTimestamp(error.timestamp)}
                        </div>
                      </div>
                      <div className="error-item-details">
                        <span className="error-category-badge">
                          {error.category?.replace(/_/g, ' ')}
                        </span>
                        {error.context?.url && (
                          <span className="error-url">
                            {new URL(error.context.url).pathname}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="error-detail-modal">
            <div className="error-detail-header">
              <h4>Error Details</h4>
              <button 
                className="error-detail-close"
                onClick={() => setSelectedError(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="error-detail-content">
              <div className="error-detail-field">
                <label>Error ID:</label>
                <code>{selectedError.errorId}</code>
              </div>
              
              <div className="error-detail-field">
                <label>Message:</label>
                <p>{selectedError.message}</p>
              </div>
              
              <div className="error-detail-field">
                <label>Severity:</label>
                <span 
                  className="error-severity-badge"
                  style={{ backgroundColor: getSeverityColor(selectedError.severity) }}
                >
                  {selectedError.severity}
                </span>
              </div>
              
              <div className="error-detail-field">
                <label>Category:</label>
                <span>{selectedError.category?.replace(/_/g, ' ')}</span>
              </div>
              
              <div className="error-detail-field">
                <label>Timestamp:</label>
                <span>{formatTimestamp(selectedError.timestamp)}</span>
              </div>
              
              {selectedError.context && (
                <div className="error-detail-field">
                  <label>Context:</label>
                  <pre className="error-context">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedError.stack && (
                <div className="error-detail-field">
                  <label>Stack Trace:</label>
                  <pre className="error-stack">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="error-detail-actions">
              {reportingError && (
                <div className="error-reporting-error">
                  {reportingError}
                </div>
              )}
              
              <button 
                className="report-error-button"
                onClick={() => handleReportError(selectedError)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Reporting...' : 'Report This Error'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorReportingPanel;