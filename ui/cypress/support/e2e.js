// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch
  win.fetch = function (...args) {
    return originalFetch.apply(this, args)
  }
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we expect (like network errors)
  if (err.message.includes('Network Error') || 
      err.message.includes('fetch')) {
    return false
  }
  return true
})