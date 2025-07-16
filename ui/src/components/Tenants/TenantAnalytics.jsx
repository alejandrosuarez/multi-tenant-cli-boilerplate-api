import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/admin';
import { analyticsAPI } from '../../services/analytics';
import Charts from '../UI/Charts';
import DataTable from '../UI/DataTable';
import RealTimeIndicator from '../UI/RealTimeIndicator';
import './TenantAnalytics.css';

const TenantAnalytics = () => {
  const { currentTenant, canManageTenant } = useTenant();
  const { hasRole, ROLES } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [userEngagement, setUserEngagement] = useState([]);
  const [entityTrends, setEntityTrends] = useState([]);
  const [notificationStats, setNotificationStats] = useState(null);
  const [apiUsage, setApiUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    if (currentTenant && canManageTenant()) {
      loadAnalyticsData();
    }
  }, [currentTenant, timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        analyticsRes,
        engagementRes,
        trendsRes,
        notificationsRes,
        apiRes
      ] = await Promise.all([
        adminAPI.getTenantAnalytics(currentTenant.id, timeRange),
        analyticsAPI.getUserEngagement(timeRange, currentTenant.id),
        analyticsAPI.getEntityTrends(timeRange, currentTenant.id),
        analyticsAPI.getNotificationStats(timeRange, currentTenant.id),
        analyticsAPI.getAPIUsage(timeRange, currentTenant.id)
      ]);

      setAnalytics(analyticsRes.data);
      setUserEngagement(engagementRes.data.engagement);
      setEntityTrends(trendsRes.data.trends);
      setNotificationStats(notificationsRes.data);
      setApiUsage(apiRes.data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const handleExportData = async (format) => {
    try {
      const response = await analyticsAPI.exportAnalytics(currentTenant.id, timeRange, format);
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tenant-analytics-${currentTenant.id}-${timeRange}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export analytics data');
    }
  };

  const getEngagementChartData = () => {
    if (!userEngagement.length) return null;

    return {
      labels: userEngagement.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Active Users',
          data: userEngagement.map(item => item.active_users),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'New Users',
          data: userEngagement.map(item => item.new_users),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const getEntityTrendsChartData = () => {
    if (!entityTrends.length) return null;

    const entityTypes = [...new Set(entityTrends.map(item => item.entity_type))];
    const colors = [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(245, 158, 11)',
      'rgb(239, 68, 68)',
      'rgb(139, 92, 246)',
      'rgb(236, 72, 153)'
    ];

    return {
      labels: [...new Set(entityTrends.map(item => new Date(item.date).toLocaleDateString()))],
      datasets: entityTypes.map((type, index) => ({
        label: type,
        data: entityTrends
          .filter(item => item.entity_type === type)
          .map(item => item.count),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.4
      }))
    };
  };

  const getNotificationDeliveryData = () => {
    if (!notificationStats) return null;

    return {
      labels: ['Delivered', 'Failed', 'Pending'],
      datasets: [{
        data: [
          notificationStats.delivered,
          notificationStats.failed,
          notificationStats.pending
        ],
        backgroundColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 0
      }]
    };
  };

  const getTopUsersData = () => {
    if (!analytics?.top_users) return [];

    return analytics.top_users.map(user => ({
      ...user,
      last_active: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'
    }));
  };

  const topUsersColumns = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (user) => (
        <div className="user-info">
          <div className="user-name">{user.name || user.email}</div>
          <div className="user-email">{user.email}</div>
        </div>
      )
    },
    {
      key: 'entity_count',
      label: 'Entities',
      sortable: true
    },
    {
      key: 'interaction_count',
      label: 'Interactions',
      sortable: true
    },
    {
      key: 'last_active',
      label: 'Last Active',
      sortable: true
    }
  ];

  if (!canManageTenant()) {
    return (
      <div className="tenant-analytics">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to view tenant analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tenant-analytics">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tenant-analytics">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadAnalyticsData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Tenant Analytics</h1>
          <div className="tenant-info">
            <h2>{currentTenant?.name}</h2>
            <p>Usage patterns and engagement metrics</p>
            <RealTimeIndicator connected={true} />
          </div>
        </div>
        
        <div className="header-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="form-select"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <div className="export-controls">
            <button 
              className="btn btn-secondary"
              onClick={() => handleExportData('csv')}
            >
              Export CSV
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => handleExportData('json')}
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Active Users</h3>
            <div className="metric-value">{analytics?.active_users || 0}</div>
            <div className="metric-change positive">
              +{analytics?.user_growth_rate || 0}% growth
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <h3>Total Entities</h3>
            <div className="metric-value">{analytics?.total_entities || 0}</div>
            <div className="metric-change positive">
              +{analytics?.entity_growth_rate || 0}% growth
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔄</div>
          <div className="metric-content">
            <h3>Interactions</h3>
            <div className="metric-value">{analytics?.total_interactions || 0}</div>
            <div className="metric-change">
              {analytics?.avg_interactions_per_user || 0} per user
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>API Calls</h3>
            <div className="metric-value">{apiUsage?.total_calls || 0}</div>
            <div className="metric-change">
              {apiUsage?.avg_response_time || 0}ms avg response
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="metric-selector">
        <button
          className={`metric-tab ${selectedMetric === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('overview')}
        >
          Overview
        </button>
        <button
          className={`metric-tab ${selectedMetric === 'users' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('users')}
        >
          User Engagement
        </button>
        <button
          className={`metric-tab ${selectedMetric === 'entities' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('entities')}
        >
          Entity Trends
        </button>
        <button
          className={`metric-tab ${selectedMetric === 'notifications' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('notifications')}
        >
          Notifications
        </button>
        <button
          className={`metric-tab ${selectedMetric === 'api' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('api')}
        >
          API Usage
        </button>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {selectedMetric === 'overview' && (
          <>
            <div className="chart-container">
              <h3>User Engagement Trends</h3>
              {getEngagementChartData() && (
                <Charts
                  type="line"
                  data={getEngagementChartData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Daily Active Users vs New Users'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </div>

            <div className="chart-container">
              <h3>Entity Creation Trends</h3>
              {getEntityTrendsChartData() && (
                <Charts
                  type="line"
                  data={getEntityTrendsChartData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Entity Creation by Type'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </div>
          </>
        )}

        {selectedMetric === 'users' && (
          <div className="chart-container full-width">
            <h3>User Engagement Details</h3>
            {getEngagementChartData() && (
              <Charts
                type="line"
                data={getEngagementChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
          </div>
        )}

        {selectedMetric === 'entities' && (
          <div className="chart-container full-width">
            <h3>Entity Trends by Type</h3>
            {getEntityTrendsChartData() && (
              <Charts
                type="bar"
                data={getEntityTrendsChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
          </div>
        )}

        {selectedMetric === 'notifications' && (
          <>
            <div className="chart-container">
              <h3>Notification Delivery Status</h3>
              {getNotificationDeliveryData() && (
                <Charts
                  type="doughnut"
                  data={getNotificationDeliveryData()}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }}
                />
              )}
            </div>

            <div className="notification-stats">
              <h3>Notification Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Sent</span>
                  <span className="stat-value">{notificationStats?.total_sent || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Delivery Rate</span>
                  <span className="stat-value">{notificationStats?.delivery_rate || 0}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Open Rate</span>
                  <span className="stat-value">{notificationStats?.open_rate || 0}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Click Rate</span>
                  <span className="stat-value">{notificationStats?.click_rate || 0}%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedMetric === 'api' && (
          <div className="api-usage-section">
            <div className="chart-container">
              <h3>API Usage Over Time</h3>
              {apiUsage?.usage_chart && (
                <Charts
                  type="line"
                  data={apiUsage.usage_chart}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </div>

            <div className="api-stats">
              <h3>API Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Calls</span>
                  <span className="stat-value">{apiUsage?.total_calls || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value">{apiUsage?.success_rate || 0}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Response Time</span>
                  <span className="stat-value">{apiUsage?.avg_response_time || 0}ms</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Error Rate</span>
                  <span className="stat-value">{apiUsage?.error_rate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Users Table */}
      <div className="section">
        <div className="section-header">
          <h3>Top Active Users</h3>
          <button className="btn btn-primary">View All Users</button>
        </div>
        <DataTable
          data={getTopUsersData()}
          columns={topUsersColumns}
          loading={loading}
          emptyMessage="No user data available"
        />
      </div>

      {/* Insights */}
      {analytics?.insights && (
        <div className="insights-section">
          <h3>Key Insights</h3>
          <div className="insights-grid">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <div className="insight-icon">{insight.icon}</div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                  {insight.action && (
                    <button className="btn btn-sm btn-primary">
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantAnalytics;