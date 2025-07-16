import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';

// Notification action types
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  LOAD_NOTIFICATIONS: 'LOAD_NOTIFICATIONS',
  LOAD_NOTIFICATIONS_SUCCESS: 'LOAD_NOTIFICATIONS_SUCCESS',
  LOAD_NOTIFICATIONS_FAILURE: 'LOAD_NOTIFICATIONS_FAILURE',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SET_REALTIME_STATUS: 'SET_REALTIME_STATUS',
  INCREMENT_UNREAD_COUNT: 'INCREMENT_UNREAD_COUNT',
  RESET_UNREAD_COUNT: 'RESET_UNREAD_COUNT'
};

// Notification types
const NOTIFICATION_TYPES = {
  ENTITY_CREATED: 'entity_created',
  ENTITY_UPDATED: 'entity_updated',
  ENTITY_DELETED: 'entity_deleted',
  ATTRIBUTE_REQUEST: 'attribute_request',
  ATTRIBUTE_RESPONSE: 'attribute_response',
  INTERACTION_RECEIVED: 'interaction_received',
  SYSTEM_ALERT: 'system_alert',
  TENANT_UPDATE: 'tenant_update',
  USER_MENTION: 'user_mention',
  BULK_OPERATION_COMPLETE: 'bulk_operation_complete'
};

// Initial notification state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  preferences: {
    enablePush: true,
    enableEmail: true,
    enableInApp: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    types: Object.values(NOTIFICATION_TYPES).reduce((acc, type) => {
      acc[type] = {
        push: true,
        email: true,
        inApp: true
      };
      return acc;
    }, {})
  },
  realtimeStatus: 'disconnected', // 'connected', 'connecting', 'disconnected', 'error'
  lastUpdated: null
};

// Notification reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload.notification,
        id: action.payload.notification.id || Date.now().toString(),
        timestamp: action.payload.notification.timestamp || new Date().toISOString(),
        read: false
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        lastUpdated: new Date().toISOString()
      };
    
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload.id);
      const wasUnread = state.notifications.find(n => n.id === action.payload.id && !n.read);
      
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
      };
    
    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, read: true }
          : notification
      );
      
      const wasUnreadBefore = state.notifications.find(n => n.id === action.payload.id && !n.read);
      
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: wasUnreadBefore ? state.unreadCount - 1 : state.unreadCount
      };
    
    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };
    
    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    
    case NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS_SUCCESS:
      const loadedNotifications = action.payload.notifications || [];
      const unreadCount = loadedNotifications.filter(n => !n.read).length;
      
      return {
        ...state,
        notifications: loadedNotifications,
        unreadCount,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };
    
    case NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error
      };
    
    case NOTIFICATION_ACTIONS.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload.preferences
        }
      };
    
    case NOTIFICATION_ACTIONS.SET_REALTIME_STATUS:
      return {
        ...state,
        realtimeStatus: action.payload.status
      };
    
    case NOTIFICATION_ACTIONS.INCREMENT_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: state.unreadCount + 1
      };
    
    case NOTIFICATION_ACTIONS.RESET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: 0
      };
    
    default:
      return state;
  }
}

// Create context
const NotificationContext = createContext();

// Notification provider component
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated, token } = useAuth();
  const { currentTenant, getTenantApiUrl } = useTenant();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // Load notifications when user or tenant changes
  useEffect(() => {
    if (isAuthenticated && currentTenant) {
      loadNotifications();
      loadNotificationPreferences();
      connectWebSocket();
    } else {
      dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS });
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, currentTenant]);

  // Load notifications from API
  const loadNotifications = async (limit = 50, offset = 0) => {
    dispatch({ type: NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS });
    
    try {
      const response = await fetch(getTenantApiUrl(`/notifications?limit=${limit}&offset=${offset}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const data = await response.json();
      
      dispatch({
        type: NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS_SUCCESS,
        payload: { notifications: data.notifications }
      });

    } catch (error) {
      console.error('Error loading notifications:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.LOAD_NOTIFICATIONS_FAILURE,
        payload: { error: error.message }
      });
    }
  };

  // Load notification preferences
  const loadNotificationPreferences = async () => {
    try {
      const response = await fetch(getTenantApiUrl('/notifications/preferences'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_PREFERENCES,
          payload: { preferences: data.preferences }
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Connect to WebSocket for real-time notifications
  const connectWebSocket = () => {
    if (!currentTenant || !token) return;

    dispatch({ type: NOTIFICATION_ACTIONS.SET_REALTIME_STATUS, payload: { status: 'connecting' } });

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications?tenant=${currentTenant.id}&token=${token}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for notifications');
        dispatch({ type: NOTIFICATION_ACTIONS.SET_REALTIME_STATUS, payload: { status: 'connected' } });
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeNotification(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        dispatch({ type: NOTIFICATION_ACTIONS.SET_REALTIME_STATUS, payload: { status: 'disconnected' } });
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts.current < 5) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch({ type: NOTIFICATION_ACTIONS.SET_REALTIME_STATUS, payload: { status: 'error' } });
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_REALTIME_STATUS, payload: { status: 'error' } });
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Schedule WebSocket reconnection
  const scheduleReconnect = () => {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectWebSocket();
    }, delay);
  };

  // Handle real-time notification
  const handleRealtimeNotification = (data) => {
    switch (data.type) {
      case 'notification':
        dispatch({
          type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
          payload: { notification: data.notification }
        });
        
        // Show browser notification if enabled
        if (state.preferences.enablePush && 'Notification' in window && Notification.permission === 'granted') {
          showBrowserNotification(data.notification);
        }
        break;
      
      case 'notification_read':
        dispatch({
          type: NOTIFICATION_ACTIONS.MARK_AS_READ,
          payload: { id: data.notificationId }
        });
        break;
      
      case 'bulk_read':
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
        break;
      
      default:
        console.log('Unknown real-time notification type:', data.type);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if (!shouldShowNotification(notification)) return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'high'
    });

    browserNotification.onclick = () => {
      window.focus();
      markAsRead(notification.id);
      browserNotification.close();
    };

    // Auto-close after 5 seconds for non-high priority notifications
    if (notification.priority !== 'high') {
      setTimeout(() => browserNotification.close(), 5000);
    }
  };

  // Check if notification should be shown based on preferences
  const shouldShowNotification = (notification) => {
    const typePrefs = state.preferences.types[notification.type];
    if (!typePrefs || !typePrefs.inApp) return false;

    // Check quiet hours
    if (state.preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = state.preferences.quietHours;
      
      if (start > end) {
        // Quiet hours span midnight
        if (currentTime >= start || currentTime <= end) return false;
      } else {
        // Normal quiet hours
        if (currentTime >= start && currentTime <= end) return false;
      }
    }

    return true;
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(getTenantApiUrl(`/notifications/${notificationId}/read`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        dispatch({
          type: NOTIFICATION_ACTIONS.MARK_AS_READ,
          payload: { id: notificationId }
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(getTenantApiUrl('/notifications/read-all'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Remove notification
  const removeNotification = async (notificationId) => {
    try {
      const response = await fetch(getTenantApiUrl(`/notifications/${notificationId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        dispatch({
          type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
          payload: { id: notificationId }
        });
      }
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences) => {
    try {
      const response = await fetch(getTenantApiUrl('/notifications/preferences'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_PREFERENCES,
          payload: { preferences: newPreferences }
        });
        return { success: true };
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const response = await fetch(getTenantApiUrl('/notifications'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS });
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const value = {
    ...state,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    updatePreferences,
    requestNotificationPermission,
    clearAllNotifications,
    connectWebSocket,
    disconnectWebSocket,
    NOTIFICATION_TYPES
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export { NOTIFICATION_TYPES };