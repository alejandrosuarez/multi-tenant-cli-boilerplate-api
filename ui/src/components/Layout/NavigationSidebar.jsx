import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NavigationSearch from './NavigationSearch';
import './NavigationSidebar.css';

const NavigationSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission, hasRole, PERMISSIONS, ROLES } = useAuth();
  const [expandedSections, setExpandedSections] = useState(new Set(['dashboard']));

  // Navigation structure with hierarchical menu
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      path: '/dashboard',
      permission: null, // Available to all authenticated users
      children: []
    },
    {
      id: 'entities',
      label: 'Entity Management',
      icon: 'fas fa-database',
      path: '/dashboard/entities',
      permission: PERMISSIONS.READ_ENTITY,
      children: [
        {
          id: 'entity-list',
          label: 'All Entities',
          icon: 'fas fa-list',
          path: '/dashboard/entities',
          permission: PERMISSIONS.READ_ENTITY
        },
        {
          id: 'entity-create',
          label: 'Create Entity',
          icon: 'fas fa-plus',
          path: '/dashboard/entities/create',
          permission: PERMISSIONS.CREATE_ENTITY
        },
        {
          id: 'bulk-operations',
          label: 'Bulk Operations',
          icon: 'fas fa-tasks',
          path: '/dashboard/entities/bulk',
          permission: PERMISSIONS.BULK_ENTITY_OPERATIONS
        }
      ]
    },
    {
      id: 'attributes',
      label: 'Attributes',
      icon: 'fas fa-tags',
      path: '/dashboard/attributes',
      permission: PERMISSIONS.MANAGE_ATTRIBUTES,
      children: [
        {
          id: 'attribute-requests',
          label: 'Requests',
          icon: 'fas fa-inbox',
          path: '/dashboard/attributes/requests',
          permission: PERMISSIONS.RESPOND_TO_REQUESTS
        },
        {
          id: 'attribute-schema',
          label: 'Schema Editor',
          icon: 'fas fa-code',
          path: '/dashboard/attributes/schema',
          permission: PERMISSIONS.MANAGE_ATTRIBUTES
        },
        {
          id: 'attribute-analytics',
          label: 'Analytics',
          icon: 'fas fa-chart-line',
          path: '/dashboard/attributes/analytics',
          permission: PERMISSIONS.VIEW_ATTRIBUTE_ANALYTICS
        }
      ]
    },
    {
      id: 'media',
      label: 'Media Management',
      icon: 'fas fa-images',
      path: '/dashboard/media',
      permission: PERMISSIONS.READ_ENTITY,
      children: [
        {
          id: 'media-gallery',
          label: 'Gallery',
          icon: 'fas fa-th',
          path: '/dashboard/media/gallery',
          permission: PERMISSIONS.READ_ENTITY
        },
        {
          id: 'media-upload',
          label: 'Upload',
          icon: 'fas fa-upload',
          path: '/dashboard/media/upload',
          permission: PERMISSIONS.UPDATE_ENTITY
        },
        {
          id: 'media-analytics',
          label: 'Analytics',
          icon: 'fas fa-chart-pie',
          path: '/dashboard/media/analytics',
          permission: PERMISSIONS.READ_ENTITY
        }
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'fas fa-bell',
      path: '/dashboard/notifications',
      permission: PERMISSIONS.MANAGE_NOTIFICATIONS,
      children: [
        {
          id: 'notification-center',
          label: 'Notification Center',
          icon: 'fas fa-inbox',
          path: '/dashboard/notifications/center',
          permission: PERMISSIONS.MANAGE_NOTIFICATIONS
        },
        {
          id: 'notification-history',
          label: 'History',
          icon: 'fas fa-history',
          path: '/dashboard/notifications/history',
          permission: PERMISSIONS.VIEW_NOTIFICATION_HISTORY
        },
        {
          id: 'notification-devices',
          label: 'Devices',
          icon: 'fas fa-mobile-alt',
          path: '/dashboard/notifications/devices',
          permission: PERMISSIONS.MANAGE_NOTIFICATIONS
        },
        {
          id: 'notification-testing',
          label: 'Testing',
          icon: 'fas fa-vial',
          path: '/dashboard/notifications/testing',
          permission: PERMISSIONS.SEND_NOTIFICATIONS
        }
      ]
    },
    {
      id: 'search',
      label: 'Search & Discovery',
      icon: 'fas fa-search',
      path: '/dashboard/search',
      permission: PERMISSIONS.READ_ENTITY,
      children: [
        {
          id: 'global-search',
          label: 'Global Search',
          icon: 'fas fa-globe',
          path: '/dashboard/search/global',
          permission: PERMISSIONS.READ_ENTITY
        },
        {
          id: 'saved-searches',
          label: 'Saved Searches',
          icon: 'fas fa-bookmark',
          path: '/dashboard/search/saved',
          permission: PERMISSIONS.READ_ENTITY
        },
        {
          id: 'data-explorer',
          label: 'Data Explorer',
          icon: 'fas fa-project-diagram',
          path: '/dashboard/search/explorer',
          permission: PERMISSIONS.READ_ENTITY
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'fas fa-chart-bar',
      path: '/dashboard/analytics',
      permission: PERMISSIONS.VIEW_TENANT_ANALYTICS,
      children: [
        {
          id: 'analytics-dashboard',
          label: 'Dashboard',
          icon: 'fas fa-tachometer-alt',
          path: '/dashboard/analytics/dashboard',
          permission: PERMISSIONS.VIEW_TENANT_ANALYTICS
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'fas fa-file-alt',
          path: '/dashboard/analytics/reports',
          permission: PERMISSIONS.VIEW_TENANT_ANALYTICS
        },
        {
          id: 'interactions',
          label: 'Interactions',
          icon: 'fas fa-handshake',
          path: '/dashboard/analytics/interactions',
          permission: PERMISSIONS.VIEW_TENANT_ANALYTICS
        },
        {
          id: 'trends',
          label: 'Trends',
          icon: 'fas fa-trending-up',
          path: '/dashboard/analytics/trends',
          permission: PERMISSIONS.VIEW_TENANT_ANALYTICS
        }
      ]
    },
    {
      id: 'tenants',
      label: 'Tenant Management',
      icon: 'fas fa-building',
      path: '/dashboard/tenants',
      permission: PERMISSIONS.MANAGE_TENANT,
      role: ROLES.TENANT_ADMIN,
      children: [
        {
          id: 'tenant-dashboard',
          label: 'Dashboard',
          icon: 'fas fa-tachometer-alt',
          path: '/dashboard/tenants/dashboard',
          permission: PERMISSIONS.MANAGE_TENANT
        },
        {
          id: 'tenant-users',
          label: 'Users',
          icon: 'fas fa-users',
          path: '/dashboard/tenants/users',
          permission: PERMISSIONS.MANAGE_TENANT_USERS
        },
        {
          id: 'tenant-settings',
          label: 'Settings',
          icon: 'fas fa-cog',
          path: '/dashboard/tenants/settings',
          permission: PERMISSIONS.MANAGE_TENANT
        },
        {
          id: 'tenant-analytics',
          label: 'Analytics',
          icon: 'fas fa-chart-line',
          path: '/dashboard/tenants/analytics',
          permission: PERMISSIONS.VIEW_TENANT_ANALYTICS
        }
      ]
    },
    {
      id: 'system',
      label: 'System Administration',
      icon: 'fas fa-cogs',
      path: '/dashboard/system',
      permission: PERMISSIONS.SYSTEM_ADMIN,
      role: ROLES.SYSTEM_ADMIN,
      children: [
        {
          id: 'system-health',
          label: 'System Health',
          icon: 'fas fa-heartbeat',
          path: '/dashboard/system/health',
          permission: PERMISSIONS.VIEW_SYSTEM_HEALTH
        },
        {
          id: 'api-testing',
          label: 'API Testing',
          icon: 'fas fa-code',
          path: '/dashboard/system/api-testing',
          permission: PERMISSIONS.API_TESTING
        },
        {
          id: 'api-documentation',
          label: 'API Documentation',
          icon: 'fas fa-book',
          path: '/dashboard/system/api-docs',
          permission: PERMISSIONS.SYSTEM_ADMIN
        },
        {
          id: 'debug-console',
          label: 'Debug Console',
          icon: 'fas fa-terminal',
          path: '/dashboard/system/debug',
          permission: PERMISSIONS.SYSTEM_ADMIN
        },
        {
          id: 'all-tenants',
          label: 'All Tenants',
          icon: 'fas fa-city',
          path: '/dashboard/system/tenants',
          permission: PERMISSIONS.MANAGE_ALL_TENANTS
        }
      ]
    }
  ];

  // Filter navigation items based on permissions
  const filterNavItems = (items) => {
    return items.filter(item => {
      // Check role requirement
      if (item.role && !hasRole(item.role)) {
        return false;
      }
      
      // Check permission requirement
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterNavItems(item.children) : []
    }));
  };

  const filteredNavItems = filterNavItems(navigationItems);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Check if path is active
  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Auto-expand sections based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = new Set(expandedSections);
    
    filteredNavItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child => isPathActive(child.path));
        if (hasActiveChild || isPathActive(item.path)) {
          newExpanded.add(item.id);
        }
      }
    });
    
    setExpandedSections(newExpanded);
  }, [location.pathname]);

  return (
    <aside className={`navigation-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <i className="fas fa-cube"></i>
          {!isCollapsed && <span className="brand-text">Entity Manager</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>

      {/* Navigation Search */}
      {!isCollapsed && (
        <div className="sidebar-search">
          <NavigationSearch navigationItems={filteredNavItems} />
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {filteredNavItems.map(item => (
            <li key={item.id} className="nav-item">
              <div
                className={`nav-link ${isPathActive(item.path) ? 'active' : ''} ${
                  item.children && item.children.length > 0 ? 'has-children' : ''
                }`}
                onClick={() => {
                  if (item.children && item.children.length > 0) {
                    toggleSection(item.id);
                  } else {
                    handleNavigation(item.path);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.children && item.children.length > 0) {
                      toggleSection(item.id);
                    } else {
                      handleNavigation(item.path);
                    }
                  }
                }}
              >
                <div className="nav-link-content">
                  <i className={item.icon}></i>
                  {!isCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.children && item.children.length > 0 && (
                        <i className={`fas fa-chevron-${expandedSections.has(item.id) ? 'down' : 'right'} nav-chevron`}></i>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sub-navigation */}
              {!isCollapsed && item.children && item.children.length > 0 && (
                <ul className={`nav-submenu ${expandedSections.has(item.id) ? 'expanded' : ''}`}>
                  {item.children.map(child => (
                    <li key={child.id} className="nav-subitem">
                      <div
                        className={`nav-sublink ${isPathActive(child.path) ? 'active' : ''}`}
                        onClick={() => handleNavigation(child.path)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNavigation(child.path);
                          }
                        }}
                      >
                        <i className={child.icon}></i>
                        <span className="nav-sublabel">{child.label}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <div className="user-name">{user.name || user.email}</div>
              <div className="user-role">{user.role?.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default NavigationSidebar;