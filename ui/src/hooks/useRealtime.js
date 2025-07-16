import { useState, useEffect, useRef, useCallback } from 'react';
import realtimeService, { realtimeAPI } from '../services/realtime.js';

// Enhanced realtime hook with WebSocket integration and configurable updates
export const useRealtime = (callback, options = {}) => {
  const {
    interval = 5000,
    useWebSocket = true,
    eventTypes = [],
    autoConnect = true,
    selectiveUpdates = false,
    updateFilters = {},
    throttleMs = 0,
    batchUpdates = false,
    batchSize = 10,
    batchTimeoutMs = 1000
  } = options;

  const [isActive, setIsActive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  const unsubscribeRefs = useRef([]);
  const throttleRef = useRef(null);
  const batchRef = useRef([]);
  const batchTimeoutRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Enhanced message handler with filtering, throttling, and batching
  const handleMessage = useCallback((data, message) => {
    // Apply selective updates filtering
    if (selectiveUpdates && updateFilters) {
      const shouldUpdate = Object.entries(updateFilters).every(([key, value]) => {
        if (typeof value === 'function') {
          return value(data, message);
        }
        return data[key] === value;
      });
      
      if (!shouldUpdate) {
        return;
      }
    }

    // Update tracking
    setLastUpdate(new Date());
    setUpdateCount(prev => prev + 1);

    // Handle batching
    if (batchUpdates) {
      batchRef.current.push({ data, message, timestamp: Date.now() });
      
      // Clear existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // Process batch if size limit reached or set timeout
      if (batchRef.current.length >= batchSize) {
        processBatch();
      } else {
        batchTimeoutRef.current = setTimeout(processBatch, batchTimeoutMs);
      }
      return;
    }

    // Handle throttling
    if (throttleMs > 0) {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      
      throttleRef.current = setTimeout(() => {
        callbackRef.current(data, message);
      }, throttleMs);
      return;
    }

    // Direct callback execution
    callbackRef.current(data, message);
  }, [selectiveUpdates, updateFilters, batchUpdates, batchSize, batchTimeoutMs, throttleMs]);

  // Process batched updates
  const processBatch = useCallback(() => {
    if (batchRef.current.length > 0) {
      const batch = [...batchRef.current];
      batchRef.current = [];
      callbackRef.current(batch);
    }
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (useWebSocket && autoConnect && isActive) {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('currentTenantId');
      
      realtimeService.connect(token, tenantId)
        .then(() => {
          setIsConnected(true);
          
          // Subscribe to specified event types
          if (eventTypes.length > 0) {
            eventTypes.forEach(eventType => {
              const unsubscribe = realtimeService.subscribe(eventType, handleMessage);
              unsubscribeRefs.current.push(unsubscribe);
            });
          }
        })
        .catch(error => {
          console.error('Failed to connect to realtime service:', error);
          setIsConnected(false);
        });
    }

    return () => {
      // Clean up subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
      
      // Clean up timers
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [useWebSocket, autoConnect, isActive, eventTypes, handleMessage]);

  // Fallback polling for when WebSocket is not used or not connected
  useEffect(() => {
    if (isActive && (!useWebSocket || !isConnected)) {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, interval, useWebSocket, isConnected]);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => setIsActive(false), []);
  const toggle = useCallback(() => setIsActive(prev => !prev), []);

  const subscribe = useCallback((eventType, eventCallback) => {
    if (useWebSocket && isConnected) {
      return realtimeService.subscribe(eventType, eventCallback);
    }
    return () => {}; // Return empty unsubscribe function
  }, [useWebSocket, isConnected]);

  return { 
    isActive, 
    isConnected, 
    start, 
    stop, 
    toggle, 
    subscribe,
    connectionStatus: realtimeService.getConnectionStatus(),
    lastUpdate,
    updateCount,
    processBatch: batchUpdates ? processBatch : null
  };
};

export const useWebSocket = (url, onMessage) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (error) => {
      setError(error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url, onMessage]);

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, isConnected, error, sendMessage };
};