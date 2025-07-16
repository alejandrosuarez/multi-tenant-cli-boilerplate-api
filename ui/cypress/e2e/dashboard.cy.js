describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.mockApiResponses()
    cy.login()
  })

  it('displays dashboard with metrics and navigation', () => {
    cy.visit('/dashboard')
    
    // Check main dashboard elements
    cy.get('[data-testid="dashboard-container"]').should('be.visible')
    cy.contains('Dashboard').should('be.visible')
    
    // Check metric cards
    cy.contains('Total Entities').should('be.visible')
    cy.contains('100').should('be.visible')
    cy.contains('Recent Activity').should('be.visible')
    
    // Check navigation
    cy.get('[data-testid="nav-entities"]').should('be.visible')
    cy.get('[data-testid="nav-analytics"]').should('be.visible')
    cy.get('[data-testid="nav-notifications"]').should('be.visible')
  })

  it('navigates to entity management', () => {
    cy.visit('/dashboard')
    
    cy.get('[data-testid="nav-entities"]').click()
    cy.url().should('include', '/entities')
    
    cy.waitForApi('@getEntities')
    cy.contains('Entity Manager').should('be.visible')
    cy.contains('John Doe').should('be.visible')
    cy.contains('Acme Corp').should('be.visible')
  })

  it('creates a new entity', () => {
    cy.intercept('POST', '/api/entities', {
      statusCode: 201,
      body: {
        success: true,
        id: 'new-entity-id',
        entity_type: 'person',
        attributes: { name: 'Jane Smith', age: 25 }
      }
    }).as('createEntity')
    
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    
    cy.createEntity({
      name: 'Jane Smith',
      type: 'person',
      attributes: { age: '25' }
    })
    
    cy.waitForApi('@createEntity')
    cy.contains('Entity created successfully').should('be.visible')
  })

  it('performs bulk operations on entities', () => {
    cy.intercept('DELETE', '/api/entities/bulk', {
      statusCode: 200,
      body: { success: true, deleted: 2 }
    }).as('bulkDelete')
    
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    
    // Select multiple entities
    cy.get('[data-testid="entity-checkbox-1"]').check()
    cy.get('[data-testid="entity-checkbox-2"]').check()
    
    // Perform bulk delete
    cy.get('[data-testid="bulk-actions-button"]').click()
    cy.get('[data-testid="bulk-delete-button"]').click()
    cy.get('[data-testid="confirm-delete-button"]').click()
    
    cy.waitForApi('@bulkDelete')
    cy.contains('2 entities deleted successfully').should('be.visible')
  })

  it('searches and filters entities', () => {
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    
    // Test search
    cy.get('[data-testid="entity-search-input"]').type('John')
    cy.get('[data-testid="search-button"]').click()
    
    cy.intercept('GET', '/api/entities*search=John*', {
      statusCode: 200,
      body: {
        data: [{
          id: '1',
          entity_type: 'person',
          attributes: { name: 'John Doe', age: 30 }
        }],
        total: 1
      }
    }).as('searchEntities')
    
    cy.waitForApi('@searchEntities')
    cy.contains('John Doe').should('be.visible')
    cy.contains('Acme Corp').should('not.exist')
  })

  it('views analytics dashboard', () => {
    cy.visit('/analytics')
    cy.waitForApi('@getAnalytics')
    
    cy.contains('Analytics Dashboard').should('be.visible')
    cy.get('[data-testid="line-chart"]').should('be.visible')
    cy.get('[data-testid="bar-chart"]').should('be.visible')
    
    // Test date range filter
    cy.get('[data-testid="date-range-select"]').select('last-7-days')
    
    cy.intercept('GET', '/api/analytics/dashboard*range=last-7-days*', {
      statusCode: 200,
      body: {
        metrics: {
          entities: { total: 95, created_today: 3 },
          interactions: { total: 450, today: 20 }
        }
      }
    }).as('getFilteredAnalytics')
    
    cy.waitForApi('@getFilteredAnalytics')
    cy.contains('95').should('be.visible')
  })

  it('manages notifications', () => {
    cy.visit('/notifications')
    cy.waitForApi('@getNotifications')
    
    cy.contains('Notification Center').should('be.visible')
    cy.contains('Test Notification').should('be.visible')
    
    // Mark notification as read
    cy.intercept('POST', '/api/notifications/1/read', {
      statusCode: 200,
      body: { success: true }
    }).as('markAsRead')
    
    cy.get('[data-testid="mark-read-button-1"]').click()
    cy.waitForApi('@markAsRead')
    
    cy.get('[data-testid="notification-1"]').should('have.class', 'read')
  })

  it('handles mobile responsive design', () => {
    cy.viewport('iphone-x')
    cy.visit('/dashboard')
    
    // Check mobile navigation
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
    cy.get('[data-testid="mobile-menu-button"]').click()
    
    cy.get('[data-testid="mobile-nav-menu"]').should('be.visible')
    cy.get('[data-testid="mobile-nav-entities"]').should('be.visible')
    
    // Test mobile entity management
    cy.get('[data-testid="mobile-nav-entities"]').click()
    cy.get('[data-testid="mobile-entity-list"]').should('be.visible')
    
    // Test swipe gestures (if implemented)
    cy.get('[data-testid="entity-card-1"]')
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchend')
  })

  it('handles offline functionality', () => {
    cy.visit('/dashboard')
    
    // Simulate offline
    cy.window().then((win) => {
      win.navigator.onLine = false
      win.dispatchEvent(new Event('offline'))
    })
    
    cy.contains('You are offline').should('be.visible')
    cy.get('[data-testid="offline-indicator"]').should('be.visible')
    
    // Test cached data access
    cy.visit('/entities')
    cy.contains('Viewing cached data').should('be.visible')
    
    // Simulate back online
    cy.window().then((win) => {
      win.navigator.onLine = true
      win.dispatchEvent(new Event('online'))
    })
    
    cy.contains('Back online').should('be.visible')
  })
})