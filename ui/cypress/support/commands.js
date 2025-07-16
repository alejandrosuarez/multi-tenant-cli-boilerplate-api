// Custom commands for testing

// Login command
Cypress.Commands.add('login', (email = 'test@example.com') => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="send-code-button"]').click()
  
  // Mock OTP verification
  cy.intercept('POST', '/api/auth/verify-otp', {
    statusCode: 200,
    body: {
      success: true,
      token: 'test-token',
      user: {
        id: 'test-user-id',
        email: email,
        role: 'user'
      }
    }
  }).as('verifyOTP')
  
  cy.get('[data-testid="otp-input"]').type('123456')
  cy.get('[data-testid="verify-button"]').click()
  cy.wait('@verifyOTP')
  
  // Should redirect to dashboard
  cy.url().should('include', '/dashboard')
})

// Create entity command
Cypress.Commands.add('createEntity', (entityData) => {
  cy.get('[data-testid="create-entity-button"]').click()
  
  if (entityData.name) {
    cy.get('[data-testid="entity-name-input"]').type(entityData.name)
  }
  
  if (entityData.type) {
    cy.get('[data-testid="entity-type-select"]').select(entityData.type)
  }
  
  if (entityData.attributes) {
    Object.entries(entityData.attributes).forEach(([key, value]) => {
      cy.get(`[data-testid="attribute-${key}-input"]`).type(value)
    })
  }
  
  cy.get('[data-testid="submit-entity-button"]').click()
})

// Wait for API response
Cypress.Commands.add('waitForApi', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout })
})

// Check accessibility
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe()
  cy.checkA11y(context, options)
})

// Mock API responses
Cypress.Commands.add('mockApiResponses', () => {
  // Mock authentication
  cy.intercept('GET', '/api/auth/verify', {
    statusCode: 200,
    body: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user'
      }
    }
  }).as('verifyAuth')
  
  // Mock entities
  cy.intercept('GET', '/api/entities*', {
    statusCode: 200,
    body: {
      data: [
        {
          id: '1',
          entity_type: 'person',
          attributes: { name: 'John Doe', age: 30 },
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          entity_type: 'company',
          attributes: { name: 'Acme Corp', industry: 'Technology' },
          created_at: '2024-01-02T00:00:00Z'
        }
      ],
      total: 2,
      page: 1,
      limit: 10
    }
  }).as('getEntities')
  
  // Mock analytics
  cy.intercept('GET', '/api/analytics/dashboard', {
    statusCode: 200,
    body: {
      metrics: {
        entities: { total: 100, created_today: 5 },
        interactions: { total: 500, today: 25 },
        requests: { pending: 10, fulfilled_today: 15 }
      },
      trends: [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 15 }
      ]
    }
  }).as('getAnalytics')
  
  // Mock notifications
  cy.intercept('GET', '/api/notifications*', {
    statusCode: 200,
    body: {
      data: [
        {
          id: '1',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
          read: false,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
    }
  }).as('getNotifications')
})