import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import './PublicLayout.css';

const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="public-layout">
      <Navbar bg="light" expand="lg" className="public-navbar neumorphic-card mb-0">
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-link">
            <i className="fas fa-cube me-2" style={{ color: '#0d6efd' }}></i>
            <span className="brand-text">Multi-Tenant CLI</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
              >
                <i className="fas fa-home me-1"></i>
                Home
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/listing" 
                className={location.pathname === '/listing' ? 'active' : ''}
              >
                <i className="fas fa-list me-1"></i>
                All Listings
              </Nav.Link>
            </Nav>
            
            <Nav>
              <Button
                as={Link}
                to="/auth"
                variant="outline-primary"
                className="login-btn"
              >
                <i className="fas fa-sign-in-alt me-1"></i>
                Admin Login
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <Container>
          <div className="footer-content">
            <div className="footer-section">
              <h6>Multi-Tenant CLI</h6>
              <p className="text-muted small">
                A modern multi-tenant boilerplate with React and Node.js
              </p>
            </div>
            
            <div className="footer-section">
              <h6>Quick Links</h6>
              <div className="footer-links">
                <Link to="/" className="footer-link">Home</Link>
                <Link to="/listing" className="footer-link">All Listings</Link>
                <Link to="/auth" className="footer-link">Admin Login</Link>
              </div>
            </div>
            
            <div className="footer-section">
              <h6>Connect</h6>
              <div className="social-links">
                <a href="#" className="social-link" title="GitHub">
                  <i className="fab fa-github"></i>
                </a>
                <a href="#" className="social-link" title="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link" title="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="text-center text-muted small mb-0">
              © 2024 Multi-Tenant CLI. Built with React + Node.js
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default PublicLayout;
