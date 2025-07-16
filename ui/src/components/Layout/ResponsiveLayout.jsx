import React, { useState, useEffect } from 'react';
import MobileNavigation from './MobileNavigation';
import './ResponsiveLayout.css';

const ResponsiveLayout = ({ children, user, showMobileNav = true }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className={`responsive-layout ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}>
      <main className={`main-content ${showMobileNav && user ? 'mobile-nav-padding' : ''}`}>
        {children}
      </main>
      {showMobileNav && <MobileNavigation user={user} />}
    </div>
  );
};

export default ResponsiveLayout;