import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumb = ({ customBreadcrumbs = null }) => {
  const location = useLocation();

  // Define breadcrumb mappings for different routes
  const breadcrumbMappings = {
    '/dashboard': { label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    '/dashboard/entities': { label: 'Entity Management', icon: 'fas fa-database' },
    '/dashboard/entities/create': { label: 'Create Entity', icon: 'fas fa-plus' },
    '/dashboard/entities/bulk': { label: 'Bulk Operations', icon: 'fas fa-tasks' },
    '/dashboard/attributes': { label: 'Attributes', icon: 'fas fa-tags' },
    '/dashboard/attributes/requests': { label: 'Attribute Requests', icon: 'fas fa-inbox' },
    '/dashboard/attributes/schema': { label: 'Schema Editor', icon: 'fas fa-code' },
    '/dashboard/attributes/analytics': { label: 'Attribute Analytics', icon: 'fas fa-chart-line' },
    '/dashboard/media': { label: 'Media Management', icon: 'fas fa-images' },
    '/dashboard/media/gallery': { label: 'Media Gallery', icon: 'fas fa-th' },
    '/dashboard/media/upload': { label: 'Upload Media', icon: 'fas fa-upload' },
    '/dashboard/media/analytics': { label: 'Media Analytics', icon: 'fas fa-chart-pie' },
    '/dashboard/notifications': { label: 'Notifications', icon: 'fas fa-bell' },
    '/dashboard/notifications/center': { label: 'Notification Center', icon: 'fas fa-inbox' },
    '/dashboard/notifications/history': { label: 'Notification History', icon: 'fas fa-history' },
    '/dashboard/notifications/devices': { label: 'Device Management', icon: 'fas fa-mobile-alt' },
    '/dashboard/notifications/testing': { label: 'Notification Testing', icon: 'fas fa-vial' },
    '/dashboard/search': { label: 'Search & Discovery', icon: 'fas fa-search' },
    '/dashboard/search/global': { label: 'Global Search', icon: 'fas fa-globe' },
    '/dashboard/search/saved': { label: 'Saved Searches', icon: 'fas fa-bookmark' },
    '/dashboard/search/explorer': { label: 'Data Explorer', icon: 'fas fa-project-diagram' },
    '/dashboard/analytics': { label: 'Analytics', icon: 'fas fa-chart-bar' },
    '/dashboard/analytics/dashboard': { label: 'Analytics Dashboard', icon: 'fas fa-tachometer-alt' },
    '/dashboard/analytics/reports': { label: 'Reports', icon: 'fas fa-file-alt' },
    '/dashboard/analytics/interactions': { label: 'Interaction Analytics', icon: 'fas fa-handshake' },
    '/dashboard/analytics/trends': { label: 'Trend Analysis', icon: 'fas fa-trending-up' },
    '/dashboard/tenants': { label: 'Tenant Management', icon: 'fas fa-building' },
    '/dashboard/tenants/dashboard': { label: 'Tenant Dashboard', icon: 'fas fa-tachometer-alt' },
    '/dashboard/tenants/users': { label: 'Tenant Users', icon: 'fas fa-users' },
    '/dashboard/tenants/settings': { label: 'Tenant Settings', icon: 'fas fa-cog' },
    '/dashboard/tenants/analytics': { label: 'Tenant Analytics', icon: 'fas fa-chart-line' },
    '/dashboard/system': { label: 'System Administration', icon: 'fas fa-cogs' },
    '/dashboard/system/health': { label: 'System Health', icon: 'fas fa-heartbeat' },
    '/dashboard/system/api-testing': { label: 'API Testing', icon: 'fas fa-code' },
    '/dashboard/system/api-docs': { label: 'API Documentation', icon: 'fas fa-book' },
    '/dashboard/system/debug': { label: 'Debug Console', icon: 'fas fa-terminal' },
    '/dashboard/system/tenants': { label: 'All Tenants', icon: 'fas fa-city' }
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = [];
    let currentPath = '';

    // Add home breadcrumb
    breadcrumbs.push({
      label: 'Home',
      path: '/',
      icon: 'fas fa-home'
    });

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const mapping = breadcrumbMappings[currentPath];
      
      if (mapping) {
        breadcrumbs.push({
          label: mapping.label,
          path: currentPath,
          icon: mapping.icon,
          isLast: index === pathSegments.length - 1
        });
      } else {
        // Handle dynamic segments (like entity IDs)
        const formattedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label: formattedSegment,
          path: currentPath,
          icon: 'fas fa-file',
          isLast: index === pathSegments.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs for home page or if there's only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className={`breadcrumb-item ${crumb.isLast ? 'active' : ''}`}>
            {crumb.isLast ? (
              <span className="breadcrumb-current">
                <i className={crumb.icon}></i>
                <span className="breadcrumb-label">{crumb.label}</span>
              </span>
            ) : (
              <>
                <Link to={crumb.path} className="breadcrumb-link">
                  <i className={crumb.icon}></i>
                  <span className="breadcrumb-label">{crumb.label}</span>
                </Link>
                <span className="breadcrumb-separator">
                  <i className="fas fa-chevron-right"></i>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;