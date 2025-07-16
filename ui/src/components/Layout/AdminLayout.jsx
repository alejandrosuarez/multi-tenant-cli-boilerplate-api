import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NavigationSidebar from './NavigationSidebar';
import Breadcrumb from './Breadcrumb';
import MobileNavigation from './MobileNavigation';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ user, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { logout } = useAuth();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <NavigationSidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            {/* Mobile menu toggle */}
            {isMobile && (
              <button
                className="mobile-menu-toggle"
                onClick={handleSidebarToggle}
                aria-label="Toggle navigation menu"
              >
                <i className="fas fa-bars"></i>
              </button>
            )}
            
            {/* Breadcrumb Navigation */}
            <Breadcrumb />
          </div>

          <div className="header-right">
            {/* User Menu */}
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name || user?.email}</span>
                  <span className="user-role">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              
              <div className="user-actions">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="btn-text">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation user={user} />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && !sidebarCollapsed && (
        <>
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarCollapsed(true)}
          ></div>
          <div className="mobile-sidebar">
            <NavigationSidebar 
              isCollapsed={false}
              onToggleCollapse={handleSidebarToggle}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminLayout;