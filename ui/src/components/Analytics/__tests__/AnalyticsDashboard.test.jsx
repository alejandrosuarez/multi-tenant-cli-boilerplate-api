import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockApiResponses, createMockFetch, checkAccessibility } from '../../../test/utils'
import AnalyticsDashboard from '../AnalyticsDashboard'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      Bar Chart
    </div>
  ),
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)}>
      Doughnut Chart
    </div>
  )
}))

describe('AnalyticsDashboard Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = createMockFetch({
      '/api/analytics/dashboard': mockApiResponses.analytics.success,
      '/api/analytics/trends': {
        data: [
          { date: '2024-01-01', entities: 10, interactions: 50 },
          { date: '2024-01-02', entities: 15, interactions: 75 }
        ]
      }
    })
  })

  it('renders analytics dashboard with metrics', async () => {
    renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument()
    })

    // Check metric cards
    expect(screen.getByText(/100/)).toBeInTheDocument() // Total entities
    expect(screen.getByText(/500/)).toBeInTheDocument() // Total interactions
    expect(screen.getByText(/10/)).toBeInTheDocument() // Pending requests
  })

  it('displays charts with data', async () => {
    renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    })
  })

  it('supports date range filtering', async () => {
    renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/date range/i)).toBeInTheDocument()
    })

    const dateRangeSelect = screen.getByLabelText(/date range/i)
    await user.selectOptions(dateRangeSelect, 'last-7-days')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('range=last-7-days'),
        expect.any(Object)
      )
    })
  })

  it('refreshes data automatically', async () => {
    vi.useFakeTimers()
    
    renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument()
    })

    // Fast-forward time to trigger refresh
    vi.advanceTimersByTime(30000) // 30 seconds

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2) // Initial load + refresh
    })

    vi.useRealTimers()
  })

  it('exports analytics data', async () => {
    renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/export/i)).toBeInTheDocument()
    })

    const exportButton = screen.getByText(/export/i)
    await user.click(exportButton)

    expect(screen.getByText(/export format/i)).toBeInTheDocument()
    expect(screen.getByText(/csv/i)).toBeInTheDocument()
    expect(screen.getByText(/pdf/i)).toBeInTheDocument()
  })

  it('handles real-time updates', async () => {
    const { rerender } = renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument()
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

    rerender(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/105/)).toBeInTheDocument()
    })
  })

  it('meets accessibility standards', async () => {
    const { container } = renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument()
    })

    const results = await checkAccessibility(container)
    expect(results).toHaveNoViolations()
  })

  it('handles loading states properly', () => {
    renderWithProviders(<AnalyticsDashboard />)
    
    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(4) // 4 metric cards
  })

  it('handles API errors gracefully', async () => {
    global.fetch = createMockFetch({
      '/api/analytics/dashboard': { ok: false, status: 500, data: { error: 'Server error' } }
    })

    renderWithProviders(<AnalyticsDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByText(/retry/i)
    expect(retryButton).toBeInTheDocument()
  })
})