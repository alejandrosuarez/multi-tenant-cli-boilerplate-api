import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MobileNavigation.css';

const MobileNavigation = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      path: '/dashboard/entities',
      icon: 'fas fa-database',
      label: 'Entities',
      active: location.pathname.includes('/entities')
    },
    {
      path: '/dashboard/search',
      icon: 'fas fa-search',
      label: 'Search',
      active: location.pathname.includes('/search')
    },
    {
      path: '/dashboard/notifications',
      icon: 'fas fa-bell',
      label: 'Notifications',
      active: location.pathname.includes('/notifications')
    },
    {
      path: '/dashboard/analytics',
      icon: 'fas fa-chart-bar',
      label: 'Analytics',
      active: location.pathname.includes('/analytics')
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Don't show mobile nav if user is not logged in
  if (!user) return null;

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            aria-label={item.label}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;