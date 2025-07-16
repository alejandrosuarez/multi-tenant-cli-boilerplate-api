import React, { useState, useEffect, useRef } from 'react';
import './SystemHealth.css';

const SystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [metrics, setMetrics] = useState({
    responseTime: [],
    errorRate: [],
    throughput: []
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const intervalRef = useRef(null);

  const endpoints = [
    { name: 'API Health', url: '/api/health', critical: true },
    { name: 'Database', url: '/api/health/database', critical: true },
    { name: 'Entities Service', url: '/api/entities', critical: false },
    { name: 'Notifications Service', url: '/api/notifications/health', critical: false },
    { name: 'Analytics Service', url: '/api/analytics/health', critical: false }
  ];

  const checkEndpointHealth = async (endpoint) => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${window.location.origin}${endpoint.url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        name: endpoint.name,
        url: endpoint.url,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        statusCode: response.status,
        critical: endpoint.critical,
        timestamp: new Date().toISOString(),
        error: response.ok ? null : `HTTP ${response.status}`
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        name: endpoint.name,
        url: endpoint.url,
        status: 'error',
        responseTime,
        statusCode: 0,
        critical: endpoint.critical,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  };

  const performHealthCheck = async () => {
    const results = await Promise.all(
      endpoints.map(endpoint => checkEndpointHealth(endpoint))
    );
    
    const overallHealth = {
      status: results.every(r => r.status === 'healthy') ? 'healthy' : 
              results.some(r => r.status === 'error' && r.critical) ? 'critical' : 'degraded',
      timestamp: new Date().toISOString(),
      endpoints: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length,
        error: results.filter(r => r.status === 'error').length,
        avgResponseTime: Math.round(
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        )
      }
    };
    
    setHealthData(overallHealth);
    
    // Update metrics for charts
    const now = Date.now();
    setMetrics(prev => ({
      responseTime: [...prev.responseTime.slice(-19), {
        timestamp: now,
        value: overallHealth.summary.avgResponseTime
      }],
      errorRate: [...prev.errorRate.slice(-19), {
        timestamp: now,
        value: (overallHealth.summary.error / overallHealth.summary.total) * 100
      }],
      throughput: [...prev.throughput.slice(-19), {
        timestamp: now,
        value: Math.random() * 100 + 50 // Simulated throughput
      }]
    }));
    
    // Check for new alerts
    const newAlerts = results
      .filter(r => r.status !== 'healthy')
      .map(r => ({
        id: `${r.name}-${Date.now()}`,
        type: r.critical ? 'critical' : 'warning',
        service: r.name,
        message: r.error || `Service is ${r.status}`,
        timestamp: new Date().toISOString()
      }));
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    performHealthCheck(); // Initial check
    intervalRef.current = setInterval(performHealthCheck, 30000); // Check every 30 seconds
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    // Perform initial health check
    performHealthCheck();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'unhealthy': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatUptime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="system-health">
      <div className="system-health-header">
        <div className="header-content">
          <h2>System Health Monitor</h2>
          <p>Real-time API status and performance monitoring</p>
        </div>
        
        <div className="monitoring-controls">
          <button
            className={`monitor-btn ${isMonitoring ? 'stop' : 'start'}`}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          
          <button className="refresh-btn" onClick={performHealthCheck}>
            Refresh
          </button>
        </div>
      </div>

      {healthData && (
        <div className="health-overview">
          <div className="overall-status">
            <div className={`status-indicator ${healthData.status}`}>
              <div className="status-dot"></div>
              <div className="status-info">
                <h3>System Status</h3>
                <p className="status-text">{healthData.status.toUpperCase()}</p>
                <p className="last-check">
                  Last checked: {new Date(healthData.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <div className="health-metrics">
            <div className="metric-card">
              <h4>Services</h4>
              <div className="metric-value">
                {healthData.summary.healthy}/{healthData.summary.total}
              </div>
              <p className="metric-label">Healthy</p>
            </div>
            
            <div className="metric-card">
              <h4>Avg Response</h4>
              <div className="metric-value">
                {healthData.summary.avgResponseTime}ms
              </div>
              <p className="metric-label">Response Time</p>
            </div>
            
            <div className="metric-card">
              <h4>Error Rate</h4>
              <div className="metric-value">
                {((healthData.summary.error / healthData.summary.total) * 100).toFixed(1)}%
              </div>
              <p className="metric-label">Current</p>
            </div>
            
            <div className="metric-card">
              <h4>Monitoring</h4>
              <div className="metric-value">
                {isMonitoring ? 'ON' : 'OFF'}
              </div>
              <p className="metric-label">Status</p>
            </div>
          </div>
        </div>
      )}

      <div className="health-content">
        <div className="services-status">
          <h3>Service Status</h3>
          <div className="services-list">
            {healthData?.endpoints.map((endpoint, index) => (
              <div key={index} className={`service-item ${endpoint.status}`}>
                <div className="service-info">
                  <div className="service-header">
                    <h4>{endpoint.name}</h4>
                    <div className={`service-status ${endpoint.status}`}>
                      <div className="status-dot"></div>
                      <span>{endpoint.status}</span>
                    </div>
                  </div>
                  
                  <div className="service-details">
                    <span className="service-url">{endpoint.url}</span>
                    <div className="service-metrics">
                      <span className="response-time">{endpoint.responseTime}ms</span>
                      <span className="status-code">HTTP {endpoint.statusCode}</span>
                      {endpoint.critical && <span className="critical-badge">Critical</span>}
                    </div>
                  </div>
                  
                  {endpoint.error && (
                    <div className="service-error">
                      <span className="error-message">{endpoint.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="performance-charts">
          <h3>Performance Metrics</h3>
          
          <div className="chart-container">
            <div className="chart-header">
              <h4>Response Time Trend</h4>
              <span className="chart-unit">milliseconds</span>
            </div>
            <div className="mini-chart">
              {metrics.responseTime.map((point, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${Math.min((point.value / 1000) * 100, 100)}%`,
                    backgroundColor: point.value > 500 ? '#ef4444' : 
                                   point.value > 200 ? '#f59e0b' : '#10b981'
                  }}
                  title={`${point.value}ms at ${new Date(point.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h4>Error Rate</h4>
              <span className="chart-unit">percentage</span>
            </div>
            <div className="mini-chart">
              {metrics.errorRate.map((point, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${point.value}%`,
                    backgroundColor: point.value > 10 ? '#ef4444' : 
                                   point.value > 5 ? '#f59e0b' : '#10b981'
                  }}
                  title={`${point.value.toFixed(1)}% at ${new Date(point.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <div className="alerts-header">
            <h3>Active Alerts</h3>
            <button className="clear-alerts" onClick={clearAlerts}>
              Clear All
            </button>
          </div>
          
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.type}`}>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className={`alert-type ${alert.type}`}>
                      {alert.type.toUpperCase()}
                    </span>
                    <span className="alert-service">{alert.service}</span>
                    <button
                      className="dismiss-alert"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ×
                    </button>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;