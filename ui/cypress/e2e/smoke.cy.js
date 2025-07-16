// Smoke Tests - Basic functionality verification
describe('Smoke Tests', () => {
  beforeEach(() => {
    // Mock API responses for smoke tests
    cy.intercept('GET', '**/api/auth/me', { fixture: 'user.json' }).as('getUser');
    cy.intercept('GET', '**/api/entities', { fixture: 'entities.json' }).as('getEntities');
    cy.intercept('GET', '**/api/analytics/dashboard', { fixture: 'analytics.json' }).as('getAnalytics');
  });

  it('should load the public listing page', () => {
    cy.visit('/');
    cy.contains('Entity Listing').should('be.visible');
    cy.get('[data-testid="entity-list"]').should('exist');
  });

  it('should navigate to authentication page', () => {
    cy.visit('/auth');
    cy.contains('Login').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
  });

  it('should load dashboard after authentication', () => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        role: 'user'
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getUser');
    cy.contains('Dashboard').should('be.visible');
    cy.get('[data-testid="dashboard-metrics"]').should('exist');
  });

  it('should navigate between main sections', () => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        role: 'user'
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getUser');

    // Test navigation to entities
    cy.get('[data-testid="nav-entities"]').click();
    cy.url().should('include', '/dashboard/entities');
    cy.contains('Entity Management').should('be.visible');

    // Test navigation to analytics
    cy.get('[data-testid="nav-analytics"]').click();
    cy.url().should('include', '/dashboard/analytics');
    cy.contains('Analytics Dashboard').should('be.visible');

    // Test navigation to notifications
    cy.get('[data-testid="nav-notifications"]').click();
    cy.url().should('include', '/dashboard/notifications');
    cy.contains('Notification Center').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '**/api/entities', { statusCode: 500 }).as('getEntitiesError');

    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        role: 'user'
      }));
    });

    cy.visit('/dashboard/entities');
    cy.wait('@getEntitiesError');
    
    // Should show error message
    cy.contains('Error loading entities').should('be.visible');
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('should be responsive on mobile devices', () => {
    cy.viewport('iphone-x');
    cy.visit('/');
    
    // Check mobile navigation
    cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
    cy.get('[data-testid="desktop-sidebar"]').should('not.be.visible');
  });

  it('should load PWA manifest and service worker', () => {
    cy.visit('/');
    
    // Check PWA manifest
    cy.get('link[rel="manifest"]').should('exist');
    
    // Check service worker registration
    cy.window().then((win) => {
      expect(win.navigator.serviceWorker).to.exist;
    });
  });

  it('should handle offline state', () => {
    cy.visit('/');
    
    // Simulate offline
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });
    
    // Should show offline indicator
    cy.get('[data-testid="offline-indicator"]').should('be.visible');
    
    // Simulate back online
    cy.window().then((win) => {
      win.dispatchEvent(new Event('online'));
    });
    
    // Offline indicator should disappear
    cy.get('[data-testid="offline-indicator"]').should('not.exist');
  });
});