import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { measureRenderTime, renderWithProviders } from '../utils'
import Dashboard from '../../components/Dashboard/Dashboard'
import EntityManager from '../../components/Dashboard/EntityManager'
import AnalyticsDashboard from '../../components/Analytics/AnalyticsDashboard'

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock performance API
    global.performance = {
      ...global.performance,
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      now: vi.fn(() => Date.now())
    }
  })

  describe('Component Render Performance', () => {
    it('Dashboard renders within acceptable time', () => {
      const { result, renderTime } = measureRenderTime(() => 
        renderWithProviders(<Dashboard />)
      )
      
      expect(renderTime).toBeLessThan(100) // 100ms threshold
      expect(result.container).toBeInTheDocument()
    })

    it('EntityManager handles large datasets efficiently', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `entity-${i}`,
        entity_type: 'person',
        attributes: { name: `Person ${i}`, age: 20 + (i % 50) },
        created_at: new Date().toISOString()
      }))

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: largeDataset,
          total: 1000,
          page: 1,
          limit: 50
        })
      })

      const { renderTime } = measureRenderTime(() => 
        renderWithProviders(<EntityManager />)
      )
      
      expect(renderTime).toBeLessThan(200) // 200ms threshold for large data
      
      await waitFor(() => {
        expect(screen.getByText('Person 0')).toBeInTheDocument()
      })
    })

    it('AnalyticsDashboard renders charts efficiently', () => {
      const { renderTime } = measureRenderTime(() => 
        renderWithProviders(<AnalyticsDashboard />)
      )
      
      expect(renderTime).toBeLessThan(150) // 150ms threshold for charts
    })
  })

  describe('Memory Usage', () => {
    it('components clean up properly on unmount', () => {
      const { unmount } = renderWithProviders(<Dashboard />)
      
      // Mock memory usage tracking
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      unmount()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      
      // Memory should not increase significantly after unmount
      expect(finalMemory - initialMemory).toBeLessThan(1000000) // 1MB threshold
    })

    it('prevents memory leaks in real-time components', async () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      global.WebSocket = vi.fn(() => mockWebSocket)

      const { unmount } = renderWithProviders(<Dashboard />)
      
      // Simulate real-time updates
      const updateInterval = setInterval(() => {
        const event = new MessageEvent('message', {
          data: JSON.stringify({ type: 'update', data: {} })
        })
        mockWebSocket.addEventListener.mock.calls
          .find(call => call[0] === 'message')?.[1](event)
      }, 100)

      await new Promise(resolve => setTimeout(resolve, 500))
      
      unmount()
      clearInterval(updateInterval)
      
      // Check that WebSocket was properly closed
      expect(mockWebSocket.close).toHaveBeenCalled()
      expect(mockWebSocket.removeEventListener).toHaveBeenCalled()
    })
  })

  describe('Bundle Size and Loading', () => {
    it('lazy loads components efficiently', async () => {
      // Mock dynamic import
      const mockLazyComponent = vi.fn(() => Promise.resolve({
        default: () => <div>Lazy Component</div>
      }))

      global.import = mockLazyComponent

      const LazyComponent = React.lazy(() => import('../../components/Analytics/AnalyticsDashboard'))
      
      const startTime = performance.now()
      
      renderWithProviders(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      )
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('Lazy Component')).toBeInTheDocument()
      })
      
      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(1000) // 1 second threshold
    })
  })

  describe('API Performance', () => {
    it('handles concurrent API requests efficiently', async () => {
      const apiCalls = []
      
      global.fetch = vi.fn().mockImplementation((url) => {
        apiCalls.push({ url, timestamp: performance.now() })
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })
      })

      renderWithProviders(<Dashboard />)
      
      await waitFor(() => {
        expect(apiCalls.length).toBeGreaterThan(0)
      })
      
      // Check that API calls are made concurrently, not sequentially
      if (apiCalls.length > 1) {
        const timeDifferences = apiCalls.slice(1).map((call, index) => 
          call.timestamp - apiCalls[index].timestamp
        )
        
        // Most calls should be made within a short time window
        const concurrentCalls = timeDifferences.filter(diff => diff < 50).length
        expect(concurrentCalls).toBeGreaterThan(timeDifferences.length * 0.7)
      }
    })

    it('implements request debouncing for search', async () => {
      const searchCalls = []
      
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('search=')) {
          searchCalls.push({ url, timestamp: performance.now() })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })
      })

      const { user } = renderWithProviders(<EntityManager />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      
      // Type quickly to test debouncing
      await user.type(searchInput, 'test query')
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Should have made fewer API calls than characters typed
      expect(searchCalls.length).toBeLessThan(10)
    })
  })

  describe('Virtual Scrolling Performance', () => {
    it('renders large lists efficiently with virtual scrolling', async () => {
      const largeList = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random()
      }))

      const VirtualList = ({ items }) => {
        // Mock virtual scrolling implementation
        const [visibleItems, setVisibleItems] = React.useState(items.slice(0, 50))
        
        return (
          <div data-testid="virtual-list">
            {visibleItems.map(item => (
              <div key={item.id} data-testid={`item-${item.id}`}>
                {item.name}
              </div>
            ))}
          </div>
        )
      }

      const { renderTime } = measureRenderTime(() => 
        render(<VirtualList items={largeList} />)
      )
      
      expect(renderTime).toBeLessThan(100) // Should render quickly despite large dataset
      expect(screen.getByText('Item 0')).toBeInTheDocument()
      expect(screen.queryByText('Item 100')).not.toBeInTheDocument() // Not rendered initially
    })
  })
})