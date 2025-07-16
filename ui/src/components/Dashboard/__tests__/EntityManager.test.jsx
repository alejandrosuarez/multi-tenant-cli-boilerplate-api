import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockApiResponses, createMockFetch, checkAccessibility } from '../../../test/utils'
import EntityManager from '../EntityManager'

describe('EntityManager Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = createMockFetch({
      '/api/entities': mockApiResponses.entities.success,
      '/api/entities/bulk': { success: true, updated: 2 }
    })
  })

  it('renders entity list with data', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('supports entity search functionality', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search entities/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search entities/i)
    await user.type(searchInput, 'John')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/entities?search=John'),
        expect.any(Object)
      )
    })
  })

  it('enables bulk operations on selected entities', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3) // 2 entities + select all
    })

    // Select first entity
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // Skip the "select all" checkbox

    expect(screen.getByText(/1 selected/i)).toBeInTheDocument()
    expect(screen.getByText(/bulk actions/i)).toBeInTheDocument()
  })

  it('performs bulk delete operation', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })

    // Select entities
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])
    await user.click(checkboxes[2])

    // Open bulk actions menu
    const bulkActionsButton = screen.getByText(/bulk actions/i)
    await user.click(bulkActionsButton)

    // Click delete
    const deleteButton = screen.getByText(/delete selected/i)
    await user.click(deleteButton)

    // Confirm deletion
    const confirmButton = screen.getByText(/confirm delete/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entities/bulk',
        expect.objectContaining({
          method: 'DELETE',
          body: expect.stringContaining('"ids":["1","2"]')
        })
      )
    })
  })

  it('supports advanced filtering', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/filters/i)).toBeInTheDocument()
    })

    const filtersButton = screen.getByText(/filters/i)
    await user.click(filtersButton)

    // Check filter options
    expect(screen.getByText(/entity type/i)).toBeInTheDocument()
    expect(screen.getByText(/date range/i)).toBeInTheDocument()
    expect(screen.getByText(/attributes/i)).toBeInTheDocument()
  })

  it('handles pagination correctly', async () => {
    const paginatedResponse = {
      ...mockApiResponses.entities.success,
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3
    }

    global.fetch = createMockFetch({
      '/api/entities': paginatedResponse
    })

    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    })

    const nextButton = screen.getByText(/next/i)
    await user.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })
  })

  it('supports inline editing', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click edit button for first entity
    const editButtons = screen.getAllByText(/edit/i)
    await user.click(editButtons[0])

    // Check that edit form appears
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    
    // Make changes
    const nameInput = screen.getByDisplayValue('John Doe')
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')

    // Save changes
    const saveButton = screen.getByText(/save/i)
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entities/1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Jane Doe')
        })
      )
    })
  })

  it('exports entity data', async () => {
    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/export/i)).toBeInTheDocument()
    })

    const exportButton = screen.getByText(/export/i)
    await user.click(exportButton)

    // Check export options
    expect(screen.getByText(/csv/i)).toBeInTheDocument()
    expect(screen.getByText(/json/i)).toBeInTheDocument()
    expect(screen.getByText(/pdf/i)).toBeInTheDocument()
  })

  it('meets accessibility standards', async () => {
    const { container } = renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const results = await checkAccessibility(container)
    expect(results).toHaveNoViolations()
  })

  it('handles API errors gracefully', async () => {
    global.fetch = createMockFetch({
      '/api/entities': { ok: false, status: 500, data: { error: 'Server error' } }
    })

    renderWithProviders(<EntityManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading entities/i)).toBeInTheDocument()
    })

    // Check retry functionality
    const retryButton = screen.getByText(/retry/i)
    expect(retryButton).toBeInTheDocument()
  })
})