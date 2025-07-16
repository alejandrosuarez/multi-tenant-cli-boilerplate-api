describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.mockApiResponses()
    cy.login()
  })

  it('dashboard meets accessibility standards', () => {
    cy.visit('/dashboard')
    cy.injectAxe()
    
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true }
      }
    })
  })

  it('entity management is accessible', () => {
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    cy.injectAxe()
    
    // Check main page accessibility
    cy.checkA11y('[data-testid="entity-manager"]')
    
    // Check form accessibility
    cy.get('[data-testid="create-entity-button"]').click()
    cy.checkA11y('[data-testid="entity-form"]')
  })

  it('supports keyboard navigation', () => {
    cy.visit('/dashboard')
    
    // Tab through navigation
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-testid', 'nav-dashboard')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'nav-entities')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'nav-analytics')
    
    // Test keyboard activation
    cy.focused().type('{enter}')
    cy.url().should('include', '/analytics')
  })

  it('provides proper ARIA labels and roles', () => {
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    
    // Check table accessibility
    cy.get('[data-testid="entity-table"]')
      .should('have.attr', 'role', 'table')
      .should('have.attr', 'aria-label', 'Entity list')
    
    // Check form accessibility
    cy.get('[data-testid="create-entity-button"]').click()
    
    cy.get('[data-testid="entity-name-input"]')
      .should('have.attr', 'aria-label', 'Entity name')
      .should('have.attr', 'aria-required', 'true')
    
    cy.get('[data-testid="entity-type-select"]')
      .should('have.attr', 'aria-label', 'Entity type')
  })

  it('supports screen readers', () => {
    cy.visit('/dashboard')
    
    // Check for screen reader announcements
    cy.get('[data-testid="sr-announcement"]')
      .should('contain', 'Dashboard loaded')
    
    // Check live regions for dynamic content
    cy.get('[data-testid="live-region"]')
      .should('have.attr', 'aria-live', 'polite')
      .should('have.attr', 'aria-atomic', 'true')
  })

  it('handles focus management in modals', () => {
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    
    // Open modal
    cy.get('[data-testid="create-entity-button"]').click()
    
    // Focus should be trapped in modal
    cy.focused().should('be.visible')
    cy.focused().should('be.within', '[data-testid="entity-modal"]')
    
    // Tab should cycle within modal
    cy.focused().tab()
    cy.focused().should('be.within', '[data-testid="entity-modal"]')
    
    // Escape should close modal
    cy.get('body').type('{esc}')
    cy.get('[data-testid="entity-modal"]').should('not.exist')
    
    // Focus should return to trigger button
    cy.focused().should('have.attr', 'data-testid', 'create-entity-button')
  })

  it('provides sufficient color contrast', () => {
    cy.visit('/dashboard')
    cy.injectAxe()
    
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
    
    // Test high contrast mode
    cy.get('[data-testid="accessibility-settings"]').click()
    cy.get('[data-testid="high-contrast-toggle"]').click()
    
    cy.get('body').should('have.class', 'high-contrast')
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  it('supports reduced motion preferences', () => {
    // Mock reduced motion preference
    cy.window().then((win) => {
      Object.defineProperty(win, 'matchMedia', {
        writable: true,
        value: cy.stub().returns({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: cy.stub(),
          removeListener: cy.stub(),
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
          dispatchEvent: cy.stub(),
        }),
      })
    })
    
    cy.visit('/dashboard')
    
    // Check that animations are disabled
    cy.get('[data-testid="animated-element"]')
      .should('have.class', 'reduced-motion')
  })

  it('provides alternative text for images', () => {
    cy.visit('/entities')
    cy.waitForApi('@getEntities')
    
    // Check entity images have alt text
    cy.get('[data-testid="entity-image"]')
      .should('have.attr', 'alt')
      .should('not.be.empty')
    
    // Check decorative images are marked appropriately
    cy.get('[data-testid="decorative-image"]')
      .should('have.attr', 'alt', '')
      .should('have.attr', 'role', 'presentation')
  })
})