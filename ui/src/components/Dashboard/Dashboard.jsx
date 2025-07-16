import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTenant } from '../../contexts/TenantContext'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { currentTenant } = useTenant()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard')
        if (!response.ok) {
          throw new Error('Failed to load dashboard')
        }
        const data = await response.json()
        setMetrics(data.metrics)
        setError(null)
      } catch (err) {
        setError('Error loading dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  if (error) {
    return <div>Error loading dashboard: {error}</div>
  }

  return (
    <div data-testid="dashboard-container" className="mobile-responsive">
      <h1>Dashboard</h1>
      
      <div className="metrics-section">
        <div className="metric-card">
          <h2>Total Entities</h2>
          <span>{metrics?.entities?.total || 0}</span>
        </div>
        
        <div className="metric-card">
          <h2>Total Interactions</h2>
          <span>{metrics?.interactions?.total || 0}</span>
        </div>
        
        <div className="metric-card">
          <h2>Pending Requests</h2>
          <span>{metrics?.requests?.pending || 0}</span>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <button>Create Entity</button>
        <button>View Reports</button>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <p>Activity feed would go here</p>
      </div>
    </div>
  )
}

export default Dashboard