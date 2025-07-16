import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  permission = null, 
  role = null, 
  permissions = [], 
  requireAll = false,
  fallbackPath = '/dashboard',
  showFallback = true 
}) => {
  const { isAuthenticated, hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (role && !hasRole(role)) {
    if (showFallback) {
      return (
        <div className="access-denied">
          <div className="access-denied-content">
            <div className="access-denied-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h2>Access Denied</h2>
            <p>You don't have the required role to access this page.</p>
            <p>Required role: <strong>{role.replace('_', ' ').toUpperCase()}</strong></p>
            <button 
              className="btn btn-primary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check single permission requirement
  if (permission && !hasPermission(permission)) {
    if (showFallback) {
      return (
        <div className="access-denied">
          <div className="access-denied-content">
            <div className="access-denied-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h2>Insufficient Permissions</h2>
            <p>You don't have the required permission to access this page.</p>
            <p>Required permission: <strong>{permission.replace('_', ' ').toUpperCase()}</strong></p>
            <button 
              className="btn btn-primary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check multiple permissions requirement
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      if (showFallback) {
        return (
          <div className="access-denied">
            <div className="access-denied-content">
              <div className="access-denied-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h2>Insufficient Permissions</h2>
              <p>
                You don't have the required permissions to access this page.
              </p>
              <p>
                Required permissions ({requireAll ? 'all' : 'any'}):
              </p>
              <ul className="permission-list">
                {permissions.map(perm => (
                  <li key={perm}>
                    <strong>{perm.replace('_', ' ').toUpperCase()}</strong>
                  </li>
                ))}
              </ul>
              <button 
                className="btn btn-primary"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>
          </div>
        );
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;