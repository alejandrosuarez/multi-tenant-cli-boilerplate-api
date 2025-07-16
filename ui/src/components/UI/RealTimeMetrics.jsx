import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '../../hooks/useRealtime.js';
import Charts from './Charts.jsx';
import './RealTimeMetrics.css';

const RealTimeMetrics = ({ 
  metrics = ['cpu', 'memory', 'requests', 'errors'],
  updateInterval = 1000,
  historyLength = 60,
  showCharts = true,
  showAlerts = true,
  thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    requests: { warning: 1000, critical: 2000 },
    errors: { warning: 10, critical: 50 }
  },
  onAlert = null,
  className = ''
}) => {
  const [metricsData, setMetricsData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const historyRef = useRef({});
  const alertsRef = useRef(new Set());

  // Handle real-time metrics updates
  const handleMetricsUpdate = useCallback((data, message) => {
    const timestamp = new Date();
    
    setMetricsData(prevData => {
      const newData = { ...prevData };
      
      // Update current values
      Object.keys(data).forEach(metric => {
        if (metrics.includes(metric)) {
          newData[metric] = {
            value: data[metric].value || data[metric],
            unit: data[metric].unit || getDefaultUnit(metric),
            trend: calculateTrend(metric, data[metric].value || data[metric]),
            status: getMetricStatus(metric, data[metric].value || data[metric])
          };
          
          // Update history
          if (!historyRef.current[metric]) {
            historyRef.current[metric] = [];
          }
          
          historyRef.current[metric].push({
            value: data[metric].value || data[metric],
            timestamp
          });
          
          // Keep only recent history
          if (historyRef.current[metric].length > historyLength) {
            historyRef.current[metric] = historyRef.current[metric].slice(-historyLength);
          }
          
          // Check for alerts
          checkForAlerts(metric, data[metric].value || data[metric]);
        }
      });
      
      return newData;
    });
    
    setLastUpdate(timestamp);
    setIsLoading(false);
  }, [metrics, historyLength, thresholds, onAlert]);

  // Set up real-time connection for metrics
  const { isConnected, connectionStatus } = useRealtime(handleMetricsUpdate, {
    eventTypes: ['realtime_metrics', 'system_health'],
    useWebSocket: true,
    autoConnect: true,
    throttleMs: updateInterval
  });

  // Calculate trend for a metric
  const calculateTrend = (metric, currentValue) => {
    const history = historyRef.current[metric];
    if (!history || history.length < 2) return 'stable';
    
    const recent = history.slice(-5); // Last 5 values
    const avg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const previousAvg = history.slice(-10, -5).reduce((sum, item) => sum + item.value, 0) / 5;
    
    if (isNaN(previousAvg)) return 'stable';
    
    const change = ((avg - previousAvg) / previousAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  };

  // Get metric status based on thresholds
  const getMetricStatus = (metric, value) => {
    const threshold = thresholds[metric];
    if (!threshold) return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  // Check for alerts
  const checkForAlerts = (metric, value) => {
    const threshold = thresholds[metric];
    if (!threshold) return;
    
    const alertKey = `${metric}-${value >= threshold.critical ? 'critical' : 'warning'}`;
    
    if (value >= threshold.critical && !alertsRef.current.has(`${metric}-critical`)) {
      const alert = {
        id: `${Date.now()}-${metric}-critical`,
        metric,
        level: 'critical',
        value,
        threshold: threshold.critical,
        message: `${getMetricDisplayName(metric)} is critically high: ${value}${getDefaultUnit(metric)}`,
        timestamp: new Date()
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
      alertsRef.current.add(`${metric}-critical`);
      
      if (onAlert) onAlert(alert);
    } else if (value >= threshold.warning && !alertsRef.current.has(`${metric}-warning`)) {
      const alert = {
        id: `${Date.now()}-${metric}-warning`,
        metric,
        level: 'warning',
        value,
        threshold: threshold.warning,
        message: `${getMetricDisplayName(metric)} is high: ${value}${getDefaultUnit(metric)}`,
        timestamp: new Date()
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
      alertsRef.current.add(`${metric}-warning`);
      
      if (onAlert) onAlert(alert);
    }
    
    // Clear alerts when values return to normal
    if (value < threshold.warning) {
      alertsRef.current.delete(`${metric}-warning`);
      alertsRef.current.delete(`${metric}-critical`);
    }
  };

  // Get default unit for metric
  const getDefaultUnit = (metric) => {
    switch (metric) {
      case 'cpu': return '%';
      case 'memory': return '%';
      case 'requests': return '/min';
      case 'errors': return '/min';
      case 'latency': return 'ms';
      case 'throughput': return '/s';
      default: return '';
    }
  };

  // Get display name for metric
  const getMetricDisplayName = (metric) => {
    switch (metric) {
      case 'cpu': return 'CPU Usage';
      case 'memory': return 'Memory Usage';
      case 'requests': return 'Request Rate';
      case 'errors': return 'Error Rate';
      case 'latency': return 'Response Time';
      case 'throughput': return 'Throughput';
      default: return metric.charAt(0).toUpperCase() + metric.slice(1);
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#e74c3c';
      case 'warning': return '#f39c12';
      default: return '#27ae60';
    }
  };

  // Format value for display
  const formatValue = (value, unit) => {
    if (typeof value !== 'number') return 'N/A';
    
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k${unit}`;
    }
    
    return `${value.toFixed(1)}${unit}`;
  };

  // Prepare chart data
  const getChartData = (metric) => {
    const history = historyRef.current[metric] || [];
    return {
      labels: history.map(item => item.timestamp.toLocaleTimeString()),
      datasets: [{
        label: getMetricDisplayName(metric),
        data: history.map(item => item.value),
        borderColor: getStatusColor(metricsData[metric]?.status || 'normal'),
        backgroundColor: `${getStatusColor(metricsData[metric]?.status || 'normal')}20`,
        tension: 0.4,
        fill: true
      }]
    };
  };

  return (
    <div className={`realtime-metrics ${className}`}>
      <div className="metrics-header">
        <div className="metrics-title">
          <h3>Real-Time Metrics</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span className="status-text">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="metrics-loading">
          <div className="loading-spinner"></div>
          <span>Loading metrics...</span>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {metrics.map(metric => {
              const data = metricsData[metric];
              if (!data) return null;
              
              return (
                <div 
                  key={metric} 
                  className={`metric-card ${data.status}`}
                >
                  <div className="metric-header">
                    <span className="metric-name">
                      {getMetricDisplayName(metric)}
                    </span>
                    <span className="metric-trend">
                      {getTrendIcon(data.trend)}
                    </span>
                  </div>
                  
                  <div className="metric-value">
                    {formatValue(data.value, data.unit)}
                  </div>
                  
                  <div className="metric-status">
                    <span className={`status-badge ${data.status}`}>
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {showCharts && historyRef.current[metric]?.length > 1 && (
                    <div className="metric-chart">
                      <Charts
                        type="line"
                        data={getChartData(metric)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            x: { display: false },
                            y: { display: false }
                          },
                          elements: {
                            point: { radius: 0 }
                          }
                        }}
                        height={60}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAlerts && alerts.length > 0 && (
            <div className="metrics-alerts">
              <h4>Recent Alerts</h4>
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`alert-item ${alert.level}`}
                  >
                    <div className="alert-icon">
                      {alert.level === 'critical' ? '🚨' : '⚠️'}
                    </div>
                    <div className="alert-content">
                      <div className="alert-message">
                        {alert.message}
                      </div>
                      <div className="alert-time">
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RealTimeMetrics;