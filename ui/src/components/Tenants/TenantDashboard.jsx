import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/admin';
import Charts from '../UI/Charts';
import DataTable from '../UI/DataTable';
import RealTimeIndicator from '../UI/RealTimeIndicator';
import './TenantDashboard.css';

const TenantDashboard = () => {
  const { currentTenant, canManageTenant } = useTenant();
  const { hasRole, ROLES } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (currentTenant && canManageTenant()) {
      loadTenantData();
    }
  }, [currentTenant, timeRange]);

  const loadTenantData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, usersRes, entitiesRes, analyticsRes] = await Promise.all([
        adminAPI.getTenantAnalytics(currentTenant.id, timeRange),
        adminAPI.getTenantUsers(currentTenant.id, 1, 10),
        adminAPI.getTenantEntities(currentTenant.id, 1, 10),
        adminAPI.getTenantAnalytics(currentTenant.id, timeRange)
      ]);

      setMetrics(metricsRes.data.metrics);
      setUsers(usersRes.data.users);
      setEntities(entitiesRes.data.entities);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error loading tenant data:', err);
      setError('Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const handleUserAction = async (action, userId) => {
    try {
      switch (action) {
        case 'suspend':
          await adminAPI.suspendUser(userId, 'Suspended by tenant admin');
          break;
        case 'unsuspend':
          await adminAPI.unsuspendUser(userId);
          break;
        case 'reset-password':
          await adminAPI.resetUserPassword(userId);
          break;
        default:
          return;
      }
      loadTenantData(); // Refresh data
    } catch (err) {
      console.error(`Error performing ${action} on user:`, err);
      setError(`Failed to ${action} user`);
    }
  };

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div className="user-info">
          <div className="user-name">{user.name || user.email}</div>
          <div className="user-email">{user.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => (
        <span className={`role-badge role-${user.role.toLowerCase()}`}>
          {user.role}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user) => (
        <span className={`status-badge status-${user.status.toLowerCase()}`}>
          {user.status}
        </span>
      )
    },
    {
      key: 'last_active',
      label: 'Last Active',
      sortable: true,
      render: (user) => user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="user-actions">
          {user.status === 'active' ? (
            <button
              className="btn btn-warning btn-sm"
              onClick={() => handleUserAction('suspend', user.id)}
            >
              Suspend
            </button>
          ) : (
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleUserAction('unsuspend', user.id)}
            >
              Unsuspend
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleUserAction('reset-password', user.id)}
          >
            Reset Password
          </button>
        </div>
      )
    }
  ];

  const entityColumns = [
    {
      key: 'entity_type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'owner_name',
      label: 'Owner',
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (entity) => new Date(entity.created_at).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (entity) => (
        <span className={`status-badge status-${entity.status?.toLowerCase() || 'active'}`}>
          {entity.status || 'Active'}
        </span>
      )
    }
  ];

  if (!canManageTenant()) {
    return (
      <div className="tenant-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to view tenant administration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tenant-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tenant dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tenant-dashboard">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadTenantData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Tenant Dashboard</h1>
          <div className="tenant-info">
            <h2>{currentTenant?.name}</h2>
            <p>ID: {currentTenant?.id}</p>
            <RealTimeIndicator connected={true} />
          </div>
        </div>
        
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
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <div className="metric-value">{metrics?.users?.total || 0}</div>
            <div className="metric-change positive">
              +{metrics?.users?.new_this_period || 0} this period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <h3>Total Entities</h3>
            <div className="metric-value">{metrics?.entities?.total || 0}</div>
            <div className="metric-change positive">
              +{metrics?.entities?.created_this_period || 0} this period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔔</div>
          <div className="metric-content">
            <h3>Notifications Sent</h3>
            <div className="metric-value">{metrics?.notifications?.sent || 0}</div>
            <div className="metric-change">
              {metrics?.notifications?.delivery_rate || 0}% delivery rate
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>API Calls</h3>
            <div className="metric-value">{metrics?.api?.total_calls || 0}</div>
            <div className="metric-change">
              {metrics?.api?.avg_response_time || 0}ms avg response
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {analytics && (
        <div className="charts-section">
          <div className="chart-container">
            <h3>User Activity Trends</h3>
            <Charts
              type="line"
              data={analytics.user_activity_chart}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Daily Active Users'
                  }
                }
              }}
            />
          </div>

          <div className="chart-container">
            <h3>Entity Creation Trends</h3>
            <Charts
              type="bar"
              data={analytics.entity_creation_chart}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Entities Created by Type'
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div className="section">
        <div className="section-header">
          <h3>Recent Users</h3>
          <button className="btn btn-primary">View All Users</button>
        </div>
        <DataTable
          data={users}
          columns={userColumns}
          loading={loading}
          emptyMessage="No users found"
        />
      </div>

      {/* Recent Entities */}
      <div className="section">
        <div className="section-header">
          <h3>Recent Entities</h3>
          <button className="btn btn-primary">View All Entities</button>
        </div>
        <DataTable
          data={entities}
          columns={entityColumns}
          loading={loading}
          emptyMessage="No entities found"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn btn-primary">
            <span className="icon">👤</span>
            Manage Users
          </button>
          <button className="btn btn-secondary">
            <span className="icon">⚙️</span>
            Tenant Settings
          </button>
          <button className="btn btn-info">
            <span className="icon">📊</span>
            View Analytics
          </button>
          <button className="btn btn-warning">
            <span className="icon">🔔</span>
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;