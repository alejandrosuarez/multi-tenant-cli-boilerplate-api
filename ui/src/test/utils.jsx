import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock context values
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    permissions: ['read', 'write']
  },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  hasPermission: vi.fn(() => true),
  hasRole: vi.fn(() => false),
  ROLES: {
    ENTITY_OWNER: 'entity_owner',
    TENANT_ADMIN: 'tenant_admin',
    SYSTEM_ADMIN: 'system_admin'
  },
  PERMISSIONS: {}
}

const mockTenantContext = {
  currentTenant: {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    settings: {}
  },
  availableTenants: [
    {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      settings: {}
    }
  ],
  switchTenant: vi.fn(),
  loading: false,
  getTenantApiUrl: vi.fn((endpoint) => `/api/tenants/test-tenant-id${endpoint}`)
}

const mockNotificationContext = {
  notifications: [],
  unreadCount: 0,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  removeNotification: vi.fn(),
  loadNotifications: vi.fn(),
  preferences: {
    enabled: true,
    types: {}
  },
  updatePreferences: vi.fn(),
  realtimeStatus: 'connected'
}

// Mock the context modules at the module level
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children
}))

vi.mock('../contexts/TenantContext', () => ({
  useTenant: () => mockTenantContext,
  TenantProvider: ({ children }) => children
}))

vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => mockNotificationContext,
  NotificationProvider: ({ children }) => children
}))

// Custom render function with providers
export function renderWithProviders(
  ui,
  {
    authValue = mockAuthContext,
    tenantValue = mockTenantContext,
    notificationValue = mockNotificationContext,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock API responses
export const mockApiResponses = {
  entities: {
    success: {
      data: [
        {
          id: '1',
          entity_type: 'person',
          attributes: { name: 'John Doe', age: 30 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          entity_type: 'company',
          attributes: { name: 'Acme Corp', industry: 'Technology' },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ],
      total: 2,
      page: 1,
      limit: 10
    },
    error: {
      error: 'Failed to fetch entities',
      status: 500
    }
  },
  analytics: {
    success: {
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
  },
  notifications: {
    success: {
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
  }
}

// Helper to create mock fetch responses
export function createMockFetch(responses) {
  return vi.fn().mockImplementation((url, options) => {
    const response = responses[url] || { ok: true, json: () => Promise.resolve({}) }
    return Promise.resolve({
      ok: response.ok !== false,
      status: response.status || 200,
      json: () => Promise.resolve(response.data || response),
      text: () => Promise.resolve(JSON.stringify(response.data || response))
    })
  })
}

// Performance testing utilities
export function measureRenderTime(renderFn) {
  const start = performance.now()
  const result = renderFn()
  const end = performance.now()
  return {
    result,
    renderTime: end - start
  }
}

// Accessibility testing helper
export async function checkAccessibility(container) {
  const { axe } = await import('jest-axe')
  const results = await axe(container)
  return results
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'