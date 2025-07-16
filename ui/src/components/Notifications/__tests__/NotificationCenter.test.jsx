import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockApiResponses, createMockFetch, checkAccessibility } from '../../../test/utils'
import NotificationCenter from '../NotificationCenter'

describe('NotificationCenter Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = createMockFetch({
      '/api/notifications': mockApiResponses.notifications.success,
      '/api/notifications/1/read': { success: true },
      '/api/notifications/settings': {
        enabled: true,
        types: {
          entity_updates: true,
          attribute_requests: true,
          system_alerts: false
        }
      }
    })
  })

  it('renders notification center with notifications', async () => {
    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText(/notification center/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Test Notification')).toBeInTheDocument()
    expect(screen.getByText('This is a test notification')).toBeInTheDocument()
  })

  it('marks notifications as read', async () => {
    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument()
    })

    const notification = screen.getByText('Test Notification').closest('.notification-item')
    expect(notification).toHaveClass('unread')

    const markReadButton = screen.getByLabelText(/mark as read/i)
    await user.click(markReadButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/1/read',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('filters notifications by type', async () => {
    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText(/filter by type/i)).toBeInTheDocument()
    })

    const filterSelect = screen.getByLabelText(/filter by type/i)
    await user.selectOptions(filterSelect, 'info')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=info'),
        expect.any(Object)
      )
    })
  })

  it('supports bulk operations', async () => {
    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(2) // 1 notification + select all
    })

    // Select notification
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    expect(screen.getByText(/1 selected/i)).toBeInTheDocument()
    expect(screen.getByText(/mark selected as read/i)).toBeInTheDocument()
    expect(screen.getByText(/delete selected/i)).toBeInTheDocument()
  })

  it('searches notifications', async () => {
    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search notifications/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search notifications/i)
    await user.type(searchInput, 'test')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      )
    })
  })

  it('manages notification settings', async () => {
    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText(/settings/i)).toBeInTheDocument()
    })

    const settingsButton = screen.getByText(/settings/i)
    await user.click(settingsButton)

    expect(screen.getByText(/notification preferences/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/entity updates/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/attribute requests/i)).toBeInTheDocument()
  })

  it('displays real-time notifications', async () => {
    const { rerender } = renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument()
    })

    // Simulate new notification via WebSocket
    const newNotification = {
      id: '2',
      type: 'success',
      title: 'New Notification',
      message: 'A new notification arrived',
      read: false,
      created_at: new Date().toISOString()
    }

    global.fetch = createMockFetch({
      '/api/notifications': {
        data: [...mockApiResponses.notifications.success.data, newNotification]
      }
    })

    rerender(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText('New Notification')).toBeInTheDocument()
    })
  })

  it('meets accessibility standards', async () => {
    const { container } = renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText(/notification center/i)).toBeInTheDocument()
    })

    const results = await checkAccessibility(container)
    expect(results).toHaveNoViolations()
  })

  it('handles empty state', async () => {
    global.fetch = createMockFetch({
      '/api/notifications': { data: [] }
    })

    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    global.fetch = createMockFetch({
      '/api/notifications': { ok: false, status: 500, data: { error: 'Server error' } }
    })

    renderWithProviders(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading notifications/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByText(/retry/i)
    expect(retryButton).toBeInTheDocument()
  })
})