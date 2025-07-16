import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import './ToastContainer.css';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      ...toast,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast if not persistent
    if (!toast.persistent) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        removeToast(id);
      }, duration + 300); // Add extra time for exit animation
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'success' });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'error' });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'warning' });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'info' });
  }, [addToast]);

  const showLoading = useCallback((message, options = {}) => {
    return addToast({ 
      ...options, 
      message, 
      type: 'loading', 
      persistent: true // Loading toasts should be persistent by default
    });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          action={toast.action}
          persistent={toast.persistent}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;