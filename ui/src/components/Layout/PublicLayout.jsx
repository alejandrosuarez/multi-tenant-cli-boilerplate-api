import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import TouchButton from '../UI/TouchButton';
import './PublicLayout.css';

const PublicLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="public-layout">
      {/* Navigation Header */}
      <header className="public-header">
        <nav className="public-navbar">
          <div className="container">
            <div className="navbar-content">
              {/* Brand */}
              <Link to="/" className="brand-link">
                <i className="fas fa-cube"></i>
                <span className="brand-text">Entity Management</span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="nav-links desktop-nav">
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  <i className="fas fa-home"></i>
                  <span>Home</span>
                </Link>
                <Link 
                  to="/listing" 
                  className={`nav-link ${location.pathname === '/listing' ? 'active' : ''}`}
                >
                  <i className="fas fa-list"></i>
                  <span>All Listings</span>
                </Link>
              </div>
              
              {/* Desktop Login Button */}
              <div className="nav-actions desktop-nav">
                <Link to="/auth">
                  <TouchButton
                    variant="primary"
                    icon="fas fa-sign-in-alt"
                  >
                    Admin Login
                  </TouchButton>
                </Link>
              </div>
              
              {/* Mobile Menu Toggle */}
              <TouchButton
                onClick={toggleMobileMenu}
                variant="secondary"
                size="small"
                icon={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}
                className="mobile-menu-toggle"
              />
            </div>
            
            {/* Mobile Navigation Menu */}
            <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="mobile-nav-content">
                <Link 
                  to="/" 
                  className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-home"></i>
                  <span>Home</span>
                </Link>
                <Link 
                  to="/listing" 
                  className={`mobile-nav-link ${location.pathname === '/listing' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-list"></i>
                  <span>All Listings</span>
                </Link>
                <Link 
                  to="/auth" 
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Admin Login</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">Entity Management</h3>
              <p className="footer-description">
                A modern multi-tenant platform with React and Node.js
              </p>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-subtitle">Quick Links</h4>
              <div className="footer-links">
                <Link to="/" className="footer-link">Home</Link>
                <Link to="/listing" className="footer-link">All Listings</Link>
                <Link to="/auth" className="footer-link">Admin Login</Link>
              </div>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-subtitle">Connect</h4>
              <div className="social-links">
                <a href="#" className="social-link" title="GitHub" aria-label="GitHub">
                  <i className="fab fa-github"></i>
                </a>
                <a href="#" className="social-link" title="Twitter" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link" title="LinkedIn" aria-label="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© 2024 Entity Management System. Built with React + Node.js</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
