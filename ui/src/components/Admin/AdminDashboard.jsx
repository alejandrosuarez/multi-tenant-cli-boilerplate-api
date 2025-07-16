import React, { useState, useEffect } from 'react';
import APITesting from './APITesting';
import SystemHealth from './SystemHealth';
import APIDocumentation from './APIDocumentation';
import DebugConsole from './DebugConsole';
import APIKeyManager from './APIKeyManager';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState({
    apiHealth: 'healthy',
    activeUsers: 0,
    totalRequests: 0,
    errorRate: 0,
    avgResponseTime: 0
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'api-testing', label: 'API Testing', icon: '🧪' },
    { id: 'system-health', label: 'System Health', icon: '💚' },
    { id: 'documentation', label: 'API Docs', icon: '📚' },
    { id: 'debug-console', label: 'Debug Console', icon: '🐛' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' }
  ];

  const fetchSystemStats = async () => {
    try {
      // Simulate API call for system statistics
      const mockStats = {
        apiHealth: Math.random() > 0.8 ? 'degraded' : 'healthy',
        activeUsers: Math.floor(Math.random() * 50) + 10,
        totalRequests: Math.floor(Math.random() * 10000) + 5000,
        errorRate: Math.random() * 5,
        avgResponseTime: Math.floor(Math.random() * 200) + 100
      };
      setSystemStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  useEffect(() => {
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="overview-header">
        <h2>System Administration</h2>
        <p>Monitor and manage your API infrastructure</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <h3>API Health</h3>
            <div className={`stat-value health-${systemStats.apiHealth}`}>
              {systemStats.apiHealth.toUpperCase()}
            </div>
            <p className="stat-description">Overall system status</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <div className="stat-value">{systemStats.activeUsers}</div>
            <p className="stat-description">Currently online</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Total Requests</h3>
            <div className="stat-value">{systemStats.totalRequests.toLocaleString()}</div>
            <p className="stat-description">Last 24 hours</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Error Rate</h3>
            <div className="stat-value">{systemStats.errorRate.toFixed(2)}%</div>
            <p className="stat-description">Current error percentage</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Response</h3>
            <div className="stat-value">{systemStats.avgResponseTime}ms</div>
            <p className="stat-description">Average response time</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>Tools Available</h3>
            <div className="stat-value">{tabs.length - 1}</div>
            <p className="stat-description">Admin tools ready</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => setActiveTab('api-testing')}
          >
            <span className="btn-icon">🧪</span>
            <div className="btn-content">
              <span className="btn-title">Test API Endpoints</span>
              <span className="btn-description">Interactive API testing</span>
            </div>
          </button>

          <button
            className="action-btn secondary"
            onClick={() => setActiveTab('system-health')}
          >
            <span className="btn-icon">💚</span>
            <div className="btn-content">
              <span className="btn-title">Monitor Health</span>
              <span className="btn-description">Real-time system monitoring</span>
            </div>
          </button>

          <button
            className="action-btn tertiary"
            onClick={() => setActiveTab('debug-console')}
          >
            <span className="btn-icon">🐛</span>
            <div className="btn-content">
              <span className="btn-title">Debug Issues</span>
              <span className="btn-description">View logs and traces</span>
            </div>
          </button>

          <button
            className="action-btn quaternary"
            onClick={() => setActiveTab('documentation')}
          >
            <span className="btn-icon">📚</span>
            <div className="btn-content">
              <span className="btn-title">API Documentation</span>
              <span className="btn-description">Browse API reference</span>
            </div>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent System Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <p className="activity-title">System health check completed</p>
              <p className="activity-time">2 minutes ago</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🔄</div>
            <div className="activity-content">
              <p className="activity-title">API endpoints refreshed</p>
              <p className="activity-time">5 minutes ago</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📊</div>
            <div className="activity-content">
              <p className="activity-title">Performance metrics updated</p>
              <p className="activity-time">10 minutes ago</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🛡️</div>
            <div className="activity-content">
              <p className="activity-title">Security scan completed</p>
              <p className="activity-time">15 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'api-testing':
        return <APITesting />;
      case 'system-health':
        return <SystemHealth />;
      case 'documentation':
        return <APIDocumentation />;
      case 'debug-console':
        return <DebugConsole />;
      case 'api-keys':
        return <APIKeyManager />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-nav">
        <div className="nav-header">
          <h1>Admin Panel</h1>
          <p>System Administration & API Management</p>
        </div>
        
        <nav className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="admin-content">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminDashboard;