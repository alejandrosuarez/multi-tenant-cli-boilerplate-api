import React, { createContext, useContext, useState, useCallback } from 'react';
import ProgressIndicator from '../components/UI/ProgressIndicator';
import './LoadingContext.css';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  const startLoading = useCallback((key, message = 'Loading...', options = {}) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading: true,
        message,
        progress: options.progress || 0,
        indeterminate: options.indeterminate !== false,
        startTime: Date.now(),
        ...options
      }
    }));
  }, []);

  const updateLoading = useCallback((key, updates) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: prev[key] ? { ...prev[key], ...updates } : null
    }));
  }, []);

  const stopLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || null;
  }, [loadingStates]);

  const setGlobalLoadingState = useCallback((loading, message = 'Loading...') => {
    setGlobalLoading(loading);
    if (loading) {
      startLoading('global', message, { global: true });
    } else {
      stopLoading('global');
    }
  }, [startLoading, stopLoading]);

  // Convenience methods for common loading patterns
  const withLoading = useCallback(async (key, asyncFn, message = 'Loading...') => {
    try {
      startLoading(key, message);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const withProgressLoading = useCallback(async (key, asyncFn, message = 'Processing...') => {
    try {
      startLoading(key, message, { indeterminate: false, progress: 0 });
      
      const result = await asyncFn((progress) => {
        updateLoading(key, { progress });
      });
      
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, updateLoading, stopLoading]);

  const value = {
    loadingStates,
    globalLoading,
    startLoading,
    updateLoading,
    stopLoading,
    isLoading,
    getLoadingState,
    setGlobalLoadingState,
    withLoading,
    withProgressLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading && <GlobalLoadingOverlay />}
    </LoadingContext.Provider>
  );
};

// Global loading overlay component
const GlobalLoadingOverlay = () => {
  const { getLoadingState } = useLoading();
  const globalState = getLoadingState('global');

  if (!globalState) return null;

  return (
    <div className="global-loading-overlay">
      <div className="global-loading-content">
        <div className="global-loading-spinner">
          <ProgressIndicator
            indeterminate={true}
            message={globalState.message}
            size="large"
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingProvider;