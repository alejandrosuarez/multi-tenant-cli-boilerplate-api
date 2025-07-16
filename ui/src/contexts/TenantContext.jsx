import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Tenant action types
const TENANT_ACTIONS = {
  SET_CURRENT_TENANT: 'SET_CURRENT_TENANT',
  LOAD_TENANTS: 'LOAD_TENANTS',
  LOAD_TENANTS_SUCCESS: 'LOAD_TENANTS_SUCCESS',
  LOAD_TENANTS_FAILURE: 'LOAD_TENANTS_FAILURE',
  UPDATE_TENANT_SETTINGS: 'UPDATE_TENANT_SETTINGS',
  SET_TENANT_SCOPE: 'SET_TENANT_SCOPE',
  CLEAR_TENANT_DATA: 'CLEAR_TENANT_DATA'
};

// Initial tenant state
const initialState = {
  currentTenant: null,
  availableTenants: [],
  tenantSettings: {},
  isLoading: false,
  error: null,
  scope: 'tenant' // 'tenant' or 'system' for system admins
};

// Tenant reducer
function tenantReducer(state, action) {
  switch (action.type) {
    case TENANT_ACTIONS.SET_CURRENT_TENANT:
      return {
        ...state,
        currentTenant: action.payload.tenant,
        tenantSettings: action.payload.settings || {},
        error: null
      };
    
    case TENANT_ACTIONS.LOAD_TENANTS:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case TENANT_ACTIONS.LOAD_TENANTS_SUCCESS:
      return {
        ...state,
        availableTenants: action.payload.tenants,
        isLoading: false,
        error: null
      };
    
    case TENANT_ACTIONS.LOAD_TENANTS_FAILURE:
      return {
        ...state,
        availableTenants: [],
        isLoading: false,
        error: action.payload.error
      };
    
    case TENANT_ACTIONS.UPDATE_TENANT_SETTINGS:
      return {
        ...state,
        tenantSettings: {
          ...state.tenantSettings,
          ...action.payload.settings
        }
      };
    
    case TENANT_ACTIONS.SET_TENANT_SCOPE:
      return {
        ...state,
        scope: action.payload.scope
      };
    
    case TENANT_ACTIONS.CLEAR_TENANT_DATA:
      return {
        ...initialState
      };
    
    default:
      return state;
  }
}

// Create context
const TenantContext = createContext();

// Tenant provider component
export function TenantProvider({ children }) {
  const [state, dispatch] = useReducer(tenantReducer, initialState);
  const { user, isAuthenticated, hasRole, ROLES } = useAuth();

  // Load tenant data when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTenantData();
    } else {
      dispatch({ type: TENANT_ACTIONS.CLEAR_TENANT_DATA });
    }
  }, [isAuthenticated, user]);

  // Save current tenant to localStorage
  useEffect(() => {
    if (state.currentTenant) {
      localStorage.setItem('currentTenant', JSON.stringify(state.currentTenant));
    }
  }, [state.currentTenant]);

  // Verify user still has access to a tenant
  const verifyTenantAccess = async (tenant) => {
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/verify-access`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        dispatch({
          type: TENANT_ACTIONS.SET_CURRENT_TENANT,
          payload: { tenant }
        });
      } else {
        localStorage.removeItem('currentTenant');
      }
    } catch (error) {
      console.error('Error verifying tenant access:', error);
      localStorage.removeItem('currentTenant');
    }
  };

  // Load tenant data from localStorage on mount
  useEffect(() => {
    const storedTenant = localStorage.getItem('currentTenant');
    if (storedTenant && isAuthenticated) {
      try {
        const tenantData = JSON.parse(storedTenant);
        // Verify the user still has access to this tenant
        verifyTenantAccess(tenantData);
      } catch (error) {
        console.error('Error loading stored tenant:', error);
        localStorage.removeItem('currentTenant');
      }
    }
  }, [isAuthenticated]);

  // Load available tenants and current tenant data
  const loadTenantData = async () => {
    dispatch({ type: TENANT_ACTIONS.LOAD_TENANTS });
    
    try {
      let tenantsResponse;
      
      if (hasRole(ROLES.SYSTEM_ADMIN)) {
        // System admins can see all tenants
        tenantsResponse = await fetch('/api/tenants', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
      } else {
        // Regular users see only their accessible tenants
        tenantsResponse = await fetch('/api/user/tenants', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
      }

      if (!tenantsResponse.ok) {
        throw new Error('Failed to load tenants');
      }

      const tenantsData = await tenantsResponse.json();
      
      dispatch({
        type: TENANT_ACTIONS.LOAD_TENANTS_SUCCESS,
        payload: { tenants: tenantsData.tenants }
      });

      // Set current tenant if not already set
      if (!state.currentTenant && tenantsData.tenants.length > 0) {
        const defaultTenant = tenantsData.tenants.find(t => t.id === user.tenant_id) || tenantsData.tenants[0];
        await switchTenant(defaultTenant.id);
      }

    } catch (error) {
      console.error('Error loading tenant data:', error);
      dispatch({
        type: TENANT_ACTIONS.LOAD_TENANTS_FAILURE,
        payload: { error: error.message }
      });
    }
  };

  // Switch to a different tenant
  const switchTenant = async (tenantId) => {
    try {
      const tenant = state.availableTenants.find(t => t.id === tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Load tenant settings
      const settingsResponse = await fetch(`/api/tenants/${tenantId}/settings`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      let settings = {};
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        settings = settingsData.settings;
      }

      dispatch({
        type: TENANT_ACTIONS.SET_CURRENT_TENANT,
        payload: { tenant, settings }
      });

      return { success: true };
    } catch (error) {
      console.error('Error switching tenant:', error);
      return { success: false, error: error.message };
    }
  };

  // Update tenant settings
  const updateTenantSettings = async (settings) => {
    try {
      const response = await fetch(`/api/tenants/${state.currentTenant.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update tenant settings');
      }

      dispatch({
        type: TENANT_ACTIONS.UPDATE_TENANT_SETTINGS,
        payload: { settings }
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      return { success: false, error: error.message };
    }
  };

  // Set tenant scope (for system admins)
  const setTenantScope = (scope) => {
    if (hasRole(ROLES.SYSTEM_ADMIN)) {
      dispatch({
        type: TENANT_ACTIONS.SET_TENANT_SCOPE,
        payload: { scope }
      });
    }
  };

  // Get tenant-scoped API URL
  const getTenantApiUrl = (endpoint) => {
    if (state.scope === 'system' && hasRole(ROLES.SYSTEM_ADMIN)) {
      return `/api/system${endpoint}`;
    }
    return `/api/tenants/${state.currentTenant?.id}${endpoint}`;
  };

  // Check if current user can manage tenant
  const canManageTenant = () => {
    return hasRole(ROLES.TENANT_ADMIN) || hasRole(ROLES.SYSTEM_ADMIN);
  };

  // Check if current user can switch tenants
  const canSwitchTenants = () => {
    return state.availableTenants.length > 1;
  };

  // Get tenant display name
  const getTenantDisplayName = () => {
    if (state.scope === 'system' && hasRole(ROLES.SYSTEM_ADMIN)) {
      return 'System Administration';
    }
    return state.currentTenant?.name || 'Unknown Tenant';
  };

  // Get tenant color theme
  const getTenantTheme = () => {
    return state.tenantSettings.theme || {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4'
    };
  };

  // Get tenant switching options for UI
  const getTenantSwitchingOptions = () => {
    const options = state.availableTenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description,
      isCurrent: tenant.id === state.currentTenant?.id
    }));

    if (hasRole(ROLES.SYSTEM_ADMIN)) {
      options.unshift({
        id: 'system',
        name: 'System Administration',
        description: 'Manage all tenants and system settings',
        isCurrent: state.scope === 'system'
      });
    }

    return options;
  };

  // Switch to system scope (for system admins)
  const switchToSystemScope = () => {
    if (hasRole(ROLES.SYSTEM_ADMIN)) {
      setTenantScope('system');
      return { success: true };
    }
    return { success: false, error: 'Insufficient permissions' };
  };

  // Get current tenant scope indicator
  const getCurrentScopeIndicator = () => {
    if (state.scope === 'system' && hasRole(ROLES.SYSTEM_ADMIN)) {
      return {
        type: 'system',
        label: 'System Admin',
        color: '#ef4444',
        icon: '🔧'
      };
    }
    
    if (hasRole(ROLES.TENANT_ADMIN)) {
      return {
        type: 'tenant_admin',
        label: 'Tenant Admin',
        color: '#f59e0b',
        icon: '👑'
      };
    }

    return {
      type: 'user',
      label: 'User',
      color: '#10b981',
      icon: '👤'
    };
  };

  const value = {
    ...state,
    switchTenant,
    updateTenantSettings,
    setTenantScope,
    getTenantApiUrl,
    canManageTenant,
    canSwitchTenants,
    getTenantDisplayName,
    getTenantTheme,
    getTenantSwitchingOptions,
    switchToSystemScope,
    getCurrentScopeIndicator,
    loadTenantData
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// Custom hook to use tenant context
export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}