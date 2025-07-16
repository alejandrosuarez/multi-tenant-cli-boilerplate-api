import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockApiResponses, createMockFetch, checkAccessibility } from '../../../test/utils'
import Dashboard from '../Dashboard'

// Mock the API service
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn()
  }
}))

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = createMockFetch({
      '/api/analytics/dashboard': mockApiResponses.analytics.success,
      '/api/entities': mockApiResponses.entities.success
    })
  })

  it('renders dashboard with loading state initially', () => {
    renderWithProviders(<Dashboard />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays dashboard metrics after loading', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    // Check for metric cards
    expect(screen.getByText(/total entities/i)).toBeInTheDocument()
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    global.fetch = createMockFetch({
      '/api/analytics/dashboard': { ok: false, status: 500, data: { error: 'Server error' } }
    })

    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })

  it('displays quick actions for authenticated users', async () => {
    renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/create entity/i)).toBeInTheDocument()
    expect(screen.getByText(/view reports/i)).toBeInTheDocument()
  })

  it('updates metrics in real-time', async () => {
    const { rerender } = renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument() // Total entities
    })

    // Simulate real-time update
    global.fetch = createMockFetch({
      '/api/analytics/dashboard': {
        ...mockApiResponses.analytics.success,
        metrics: {
          ...mockApiResponses.analytics.success.metrics,
          entities: { total: 105, created_today: 10 }
        }
      }
    })

    rerender(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/105/)).toBeInTheDocument()
    })
  })

  it('meets accessibility standards', async () => {
    const { container } = renderWithProviders(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    const results = await checkAccessibility(container)
    expect(results).toHaveNoViolations()
  })

  it('is responsive on mobile devices', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    renderWithProviders(<Dashboard />)
    
    const dashboard = screen.getByTestId('dashboard-container')
    expect(dashboard).toHaveClass('mobile-responsive')
  })
})