import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to console for development
    console.error('Error Boundary caught an error:', error, errorInfo);

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Placeholder for error logging service integration
    // Could integrate with services like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Example API call to log error
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    }).catch(err => {
      console.error('Failed to log error to service:', err);
    });
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            
            <h2 className="error-boundary-title">Something went wrong</h2>
            
            <p className="error-boundary-message">
              We're sorry, but something unexpected happened. The error has been logged and our team has been notified.
            </p>

            {this.state.errorId && (
              <p className="error-boundary-id">
                Error ID: <code>{this.state.errorId}</code>
              </p>
            )}

            <div className="error-boundary-actions">
              <button 
                className="error-boundary-button primary"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button 
                className="error-boundary-button secondary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            {isDevelopment && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-boundary-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;