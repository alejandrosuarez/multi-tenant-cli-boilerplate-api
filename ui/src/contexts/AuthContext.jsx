import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  UPDATE_PERMISSIONS: 'UPDATE_PERMISSIONS',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
};

// User roles and permissions
const ROLES = {
  ENTITY_OWNER: 'entity_owner',
  TENANT_ADMIN: 'tenant_admin',
  SYSTEM_ADMIN: 'system_admin'
};

const PERMISSIONS = {
  // Entity permissions
  CREATE_ENTITY: 'create_entity',
  READ_ENTITY: 'read_entity',
  UPDATE_ENTITY: 'update_entity',
  DELETE_ENTITY: 'delete_entity',
  BULK_ENTITY_OPERATIONS: 'bulk_entity_operations',
  
  // Attribute permissions
  MANAGE_ATTRIBUTES: 'manage_attributes',
  RESPOND_TO_REQUESTS: 'respond_to_requests',
  VIEW_ATTRIBUTE_ANALYTICS: 'view_attribute_analytics',
  
  // Notification permissions
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  SEND_NOTIFICATIONS: 'send_notifications',
  VIEW_NOTIFICATION_HISTORY: 'view_notification_history',
  
  // Tenant permissions
  MANAGE_TENANT: 'manage_tenant',
  VIEW_TENANT_ANALYTICS: 'view_tenant_analytics',
  MANAGE_TENANT_USERS: 'manage_tenant_users',
  
  // System permissions
  SYSTEM_ADMIN: 'system_admin',
  API_TESTING: 'api_testing',
  VIEW_SYSTEM_HEALTH: 'view_system_health',
  MANAGE_ALL_TENANTS: 'manage_all_tenants'
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ENTITY_OWNER]: [
    PERMISSIONS.CREATE_ENTITY,
    PERMISSIONS.READ_ENTITY,
    PERMISSIONS.UPDATE_ENTITY,
    PERMISSIONS.DELETE_ENTITY,
    PERMISSIONS.MANAGE_ATTRIBUTES,
    PERMISSIONS.RESPOND_TO_REQUESTS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATION_HISTORY
  ],
  [ROLES.TENANT_ADMIN]: [
    PERMISSIONS.CREATE_ENTITY,
    PERMISSIONS.READ_ENTITY,
    PERMISSIONS.UPDATE_ENTITY,
    PERMISSIONS.DELETE_ENTITY,
    PERMISSIONS.BULK_ENTITY_OPERATIONS,
    PERMISSIONS.MANAGE_ATTRIBUTES,
    PERMISSIONS.RESPOND_TO_REQUESTS,
    PERMISSIONS.VIEW_ATTRIBUTE_ANALYTICS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATION_HISTORY,
    PERMISSIONS.MANAGE_TENANT,
    PERMISSIONS.VIEW_TENANT_ANALYTICS,
    PERMISSIONS.MANAGE_TENANT_USERS
  ],
  [ROLES.SYSTEM_ADMIN]: [
    ...Object.values(PERMISSIONS)
  ]
};

// Initial auth state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  sessionExpiry: null
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: ROLE_PERMISSIONS[action.payload.user.role] || [],
        sessionExpiry: action.payload.sessionExpiry
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        permissions: [],
        sessionExpiry: null
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };
    
    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        sessionExpiry: action.payload.sessionExpiry
      };
    
    case AUTH_ACTIONS.UPDATE_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload.permissions
      };
    
    case AUTH_ACTIONS.SESSION_EXPIRED:
      return {
        ...initialState,
        error: 'Session expired. Please log in again.'
      };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.token && authData.sessionExpiry && new Date(authData.sessionExpiry) > new Date()) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: authData
          });
        } else {
          localStorage.removeItem('auth');
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  // Save auth state to localStorage
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      const authData = {
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        sessionExpiry: state.sessionExpiry
      };
      localStorage.setItem('auth', JSON.stringify(authData));
    } else {
      localStorage.removeItem('auth');
    }
  }, [state.isAuthenticated, state.token, state.user, state.refreshToken, state.sessionExpiry]);

  // Session expiry check
  useEffect(() => {
    if (state.sessionExpiry) {
      const checkExpiry = () => {
        if (new Date() >= new Date(state.sessionExpiry)) {
          dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
        }
      };

      const interval = setInterval(checkExpiry, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [state.sessionExpiry]);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // This would typically make an API call to authenticate
      // For now, we'll simulate the login process
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
          sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message }
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if needed
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: state.refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: {
          token: data.token,
          sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
      return false;
    }
  };

  // Permission checking function
  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };

  // Role checking function
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Multiple permissions checking
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => state.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => state.permissions.includes(permission));
  };

  const value = {
    ...state,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    ROLES,
    PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { ROLES, PERMISSIONS };