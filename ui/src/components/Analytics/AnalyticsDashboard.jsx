import React, { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('last-30-days')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      const url = `/api/analytics/dashboard?range=${dateRange}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      
      const data = await response.json()
      setMetrics(data.metrics)
      setError(null)
    } catch (err) {
      setError('Error loading analytics')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadAnalytics, 30000)
    return () => clearInterval(interval)
  }, [dateRange])

  if (loading) {
    return (
      <div>
        Loading analytics...
        <div data-testid="skeleton-loader">Loading...</div>
        <div data-testid="skeleton-loader">Loading...</div>
        <div data-testid="skeleton-loader">Loading...</div>
        <div data-testid="skeleton-loader">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        Error loading analytics: {error}
        <button onClick={loadAnalytics}>Retry</button>
      </div>
    )
  }

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Entities',
      data: [10, 15, 20, 25, 30],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      
      <div className="controls">
        <label htmlFor="date-range">Date Range:</label>
        <select
          id="date-range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          data-testid="date-range-select"
        >
          <option value="last-7-days">Last 7 Days</option>
          <option value="last-30-days">Last 30 Days</option>
          <option value="last-90-days">Last 90 Days</option>
        </select>
        
        <button>Export</button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Entities</h3>
          <span>{metrics?.entities?.total || 0}</span>
        </div>
        
        <div className="metric-card">
          <h3>Total Interactions</h3>
          <span>{metrics?.interactions?.total || 0}</span>
        </div>
        
        <div className="metric-card">
          <h3>Pending Requests</h3>
          <span>{metrics?.requests?.pending || 0}</span>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <Line data={chartData} />
        </div>
        
        <div className="chart-container">
          <Bar data={chartData} />
        </div>
        
        <div className="chart-container">
          <Doughnut data={chartData} />
        </div>
      </div>

      <div className="export-modal" style={{ display: 'none' }}>
        <h3>Export Format</h3>
        <button>CSV</button>
        <button>PDF</button>
      </div>
    </div>
  )
}

export default AnalyticsDashboard