// Permission utilities for role-based UI rendering

// User roles hierarchy (higher number = more permissions)
export const USER_ROLES = {
  GUEST: 0,
  USER: 1,
  ENTITY_OWNER: 2,
  TENANT_ADMIN: 3,
  SYSTEM_ADMIN: 4
};

// Permission categories
export const PERMISSIONS = {
  // Entity permissions
  ENTITY_CREATE: 'entity:create',
  ENTITY_READ: 'entity:read',
  ENTITY_UPDATE: 'entity:update',
  ENTITY_DELETE: 'entity:delete',
  ENTITY_BULK_OPERATIONS: 'entity:bulk',
  
  // Attribute permissions
  ATTRIBUTE_REQUEST: 'attribute:request',
  ATTRIBUTE_RESPOND: 'attribute:respond',
  ATTRIBUTE_MANAGE_SCHEMA: 'attribute:schema',
  
  // Notification permissions
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_MANAGE: 'notification:manage',
  NOTIFICATION_SETTINGS: 'notification:settings',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ADVANCED: 'analytics:advanced',
  
  // Tenant permissions
  TENANT_VIEW: 'tenant:view',
  TENANT_MANAGE: 'tenant:manage',
  TENANT_USERS: 'tenant:users',
  TENANT_SETTINGS: 'tenant:settings',
  
  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_HEALTH: 'system:health',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_API_TESTING: 'system:api_testing',
  
  // Media permissions
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_MANAGE: 'media:manage',
  MEDIA_BULK_UPLOAD: 'media:bulk_upload',
  
  // Search permissions
  SEARCH_ADVANCED: 'search:advanced',
  SEARCH_EXPORT: 'search:export'
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.GUEST]: [
    PERMISSIONS.ENTITY_READ
  ],
  
  [USER_ROLES.USER]: [
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.ATTRIBUTE_REQUEST,
    PERMISSIONS.NOTIFICATION_SETTINGS,
    PERMISSIONS.MEDIA_UPLOAD
  ],
  
  [USER_ROLES.ENTITY_OWNER]: [
    PERMISSIONS.ENTITY_CREATE,
    PERMISSIONS.ENTITY_READ,
    PERMISSIONS.ENTITY_UPDATE,
    PERMISSIONS.ENTITY_DELETE,
    PERMISSIONS.ENTITY_BULK_OPERATIONS,
    PERMISSIONS.ATTRIBUTE_REQUEST,
    PERMISSIONS.ATTRIBUTE_RESPOND,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_MANAGE,
    PERMISSIONS.NOTIFICATION_SETTINGS,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.MEDIA_BULK_UPLOAD,
    PERMISSIONS.SEARCH_ADVANCED,
    PERMISSIONS.SEARCH_EXPORT
  ],
  
  [USER_ROLES.TENANT_ADMIN]: [
    // All entity owner permissions plus:
    ...ROLE_PERMISSIONS[USER_ROLES.ENTITY_OWNER],
    PERMISSIONS.ATTRIBUTE_MANAGE_SCHEMA,
    PERMISSIONS.ANALYTICS_ADVANCED,
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.TENANT_MANAGE,
    PERMISSIONS.TENANT_USERS,
    PERMISSIONS.TENANT_SETTINGS
  ],
  
  [USER_ROLES.SYSTEM_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ]
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role information
 * @param {string} permission - Permission to check
 * @param {Object} context - Additional context (entity ownership, tenant, etc.)
 * @returns {boolean}
 */
export const hasPermission = (user, permission, context = {}) => {
  if (!user || !user.role) return false;
  
  const userRole = user.role;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check if user has the permission based on role
  if (rolePermissions.includes(permission)) {
    return true;
  }
  
  // Special cases for entity ownership
  if (context.entity && context.entity.user_id === user.id) {
    const ownerPermissions = ROLE_PERMISSIONS[USER_ROLES.ENTITY_OWNER] || [];
    if (ownerPermissions.includes(permission)) {
      return true;
    }
  }
  
  // Special cases for tenant scope
  if (context.tenant && context.tenant.id === user.tenant_id && userRole >= USER_ROLES.TENANT_ADMIN) {
    const tenantPermissions = ROLE_PERMISSIONS[USER_ROLES.TENANT_ADMIN] || [];
    if (tenantPermissions.includes(permission)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @param {Object} context - Additional context
 * @returns {boolean}
 */
export const hasAnyPermission = (user, permissions, context = {}) => {
  return permissions.some(permission => hasPermission(user, permission, context));
};

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @param {Object} context - Additional context
 * @returns {boolean}
 */
export const hasAllPermissions = (user, permissions, context = {}) => {
  return permissions.every(permission => hasPermission(user, permission, context));
};

/**
 * Get all permissions for a user
 * @param {Object} user - User object
 * @param {Object} context - Additional context
 * @returns {Array}
 */
export const getUserPermissions = (user, context = {}) => {
  if (!user || !user.role) return [];
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const permissions = new Set(rolePermissions);
  
  // Add entity owner permissions if applicable
  if (context.entity && context.entity.user_id === user.id) {
    const ownerPermissions = ROLE_PERMISSIONS[USER_ROLES.ENTITY_OWNER] || [];
    ownerPermissions.forEach(permission => permissions.add(permission));
  }
  
  return Array.from(permissions);
};

/**
 * Check if user can access a specific route/feature
 * @param {Object} user - User object
 * @param {string} route - Route or feature name
 * @param {Object} context - Additional context
 * @returns {boolean}
 */
export const canAccessRoute = (user, route, context = {}) => {
  const routePermissions = {
    '/dashboard': [PERMISSIONS.ENTITY_READ],
    '/entities': [PERMISSIONS.ENTITY_READ],
    '/entities/create': [PERMISSIONS.ENTITY_CREATE],
    '/entities/bulk': [PERMISSIONS.ENTITY_BULK_OPERATIONS],
    '/attributes': [PERMISSIONS.ATTRIBUTE_REQUEST, PERMISSIONS.ATTRIBUTE_RESPOND],
    '/attributes/schema': [PERMISSIONS.ATTRIBUTE_MANAGE_SCHEMA],
    '/notifications': [PERMISSIONS.NOTIFICATION_SETTINGS],
    '/notifications/manage': [PERMISSIONS.NOTIFICATION_MANAGE],
    '/analytics': [PERMISSIONS.ANALYTICS_VIEW],
    '/analytics/advanced': [PERMISSIONS.ANALYTICS_ADVANCED],
    '/media': [PERMISSIONS.MEDIA_UPLOAD],
    '/media/manage': [PERMISSIONS.MEDIA_MANAGE],
    '/search': [PERMISSIONS.ENTITY_READ],
    '/search/advanced': [PERMISSIONS.SEARCH_ADVANCED],
    '/tenants': [PERMISSIONS.TENANT_VIEW],
    '/tenants/manage': [PERMISSIONS.TENANT_MANAGE],
    '/system': [PERMISSIONS.SYSTEM_ADMIN],
    '/system/health': [PERMISSIONS.SYSTEM_HEALTH],
    '/system/api': [PERMISSIONS.SYSTEM_API_TESTING]
  };
  
  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true; // No restrictions
  
  return hasAnyPermission(user, requiredPermissions, context);
};

/**
 * Filter menu items based on user permissions
 * @param {Array} menuItems - Array of menu items
 * @param {Object} user - User object
 * @param {Object} context - Additional context
 * @returns {Array}
 */
export const filterMenuItems = (menuItems, user, context = {}) => {
  return menuItems.filter(item => {
    if (!item.requiredPermissions) return true;
    return hasAnyPermission(user, item.requiredPermissions, context);
  });
};

/**
 * Get user role display name
 * @param {number} role - User role number
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [USER_ROLES.GUEST]: 'Guest',
    [USER_ROLES.USER]: 'User',
    [USER_ROLES.ENTITY_OWNER]: 'Entity Owner',
    [USER_ROLES.TENANT_ADMIN]: 'Tenant Admin',
    [USER_ROLES.SYSTEM_ADMIN]: 'System Admin'
  };
  
  return roleNames[role] || 'Unknown';
};

/**
 * Check if user role is at least the specified level
 * @param {Object} user - User object
 * @param {number} minimumRole - Minimum required role
 * @returns {boolean}
 */
export const hasMinimumRole = (user, minimumRole) => {
  if (!user || user.role === undefined) return false;
  return user.role >= minimumRole;
};

/**
 * React hook for permission checking
 * @param {Object} user - User object
 * @param {string|Array} permissions - Permission(s) to check
 * @param {Object} context - Additional context
 * @returns {boolean}
 */
export const usePermission = (user, permissions, context = {}) => {
  if (Array.isArray(permissions)) {
    return hasAnyPermission(user, permissions, context);
  }
  return hasPermission(user, permissions, context);
};

/**
 * Higher-order component for permission-based rendering
 * @param {string|Array} requiredPermissions - Required permissions
 * @param {React.Component} fallback - Component to render if no permission
 * @returns {Function}
 */
export const withPermission = (requiredPermissions, fallback = null) => {
  return (WrappedComponent) => {
    return (props) => {
      const { user, context = {}, ...otherProps } = props;
      
      const hasAccess = Array.isArray(requiredPermissions)
        ? hasAnyPermission(user, requiredPermissions, context)
        : hasPermission(user, requiredPermissions, context);
      
      if (!hasAccess) {
        return fallback;
      }
      
      return <WrappedComponent {...otherProps} user={user} context={context} />;
    };
  };
};

/**
 * Permission-based conditional rendering component
 */
export const PermissionGate = ({ 
  user, 
  permissions, 
  context = {}, 
  children, 
  fallback = null,
  requireAll = false 
}) => {
  const hasAccess = requireAll
    ? hasAllPermissions(user, Array.isArray(permissions) ? permissions : [permissions], context)
    : hasAnyPermission(user, Array.isArray(permissions) ? permissions : [permissions], context);
  
  return hasAccess ? children : fallback;
};

export default {
  USER_ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canAccessRoute,
  filterMenuItems,
  getRoleDisplayName,
  hasMinimumRole,
  usePermission,
  withPermission,
  PermissionGate
};