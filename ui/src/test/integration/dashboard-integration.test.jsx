import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockApiResponses, createMockFetch } from '../utils'
import App from '../../App'

describe('Dashboard Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = createMockFetch({
      '/api/auth/verify': { user: { id: '1', email: 'test@example.com', role: 'admin' } },
      '/api/analytics/dashboard': mockApiResponses.analytics.success,
      '/api/entities': mockApiResponses.entities.success,
      '/api/notifications': mockApiResponses.notifications.success,
      '/api/tenants': { data: [{ id: '1', name: 'Test Tenant' }] }
    })
  })

  it('navigates between dashboard sections', async () => {
    renderWithProviders(<App />)
    
    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    // Navigate to entities
    const entitiesLink = screen.getByText(/entities/i)
    await user.click(entitiesLink)

    await waitFor(() => {
      expect(screen.getByText(/entity manager/i)).toBeInTheDocument()
    })

    // Navigate to analytics
    const analyticsLink = screen.getByText(/analytics/i)
    await user.click(analyticsLink)

    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument()
    })
  })

  it('creates entity from dashboard quick actions', async () => {
    global.fetch = createMockFetch({
      ...global.fetch.mockImplementation(),
      '/api/entities': { success: true, id: 'new-entity-id' }
    })

    renderWithProviders(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
    })

    const createEntityButton = screen.getByText(/create entity/i)
    await user.click(createEntityButton)

    // Fill out entity form
    const nameInput = screen.getByLabelText(/name/i)
    await user.type(nameInput, 'Test Entity')

    const typeSelect = screen.getByLabelText(/type/i)
    await user.selectOptions(typeSelect, 'person')

    const submitButton = screen.getByText(/create/i)
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entities',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Entity')
        })
      )
    })
  })

  it('handles real-time updates across components', async () => {
    renderWithProviders(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument() // Total entities
    })

    // Simulate WebSocket update
    const mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    global.WebSocket = vi.fn(() => mockWebSocket)

    // Trigger real-time update
    const updateEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'entity_created',
        data: { id: 'new-id', entity_type: 'person' }
      })
    })

    mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')[1](updateEvent)

    await waitFor(() => {
      expect(screen.getByText(/101/)).toBeInTheDocument() // Updated count
    })
  })

  it('maintains state during navigation', async () => {
    renderWithProviders(<App />)
    
    // Set up search in entities
    await waitFor(() => {
      expect(screen.getByText(/entities/i)).toBeInTheDocument()
    })

    const entitiesLink = screen.getByText(/entities/i)
    await user.click(entitiesLink)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search entities/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search entities/i)
    await user.type(searchInput, 'John')

    // Navigate away and back
    const dashboardLink = screen.getByText(/dashboard/i)
    await user.click(dashboardLink)

    await user.click(entitiesLink)

    // Check that search state is maintained
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })
  })

  it('handles authentication flow', async () => {
    // Start with unauthenticated state
    global.fetch = createMockFetch({
      '/api/auth/verify': { ok: false, status: 401 }
    })

    renderWithProviders(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument()
    })

    // Simulate login
    global.fetch = createMockFetch({
      '/api/auth/login': { 
        success: true, 
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', role: 'user' }
      },
      '/api/analytics/dashboard': mockApiResponses.analytics.success
    })

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    const loginButton = screen.getByText(/send login code/i)
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })
})