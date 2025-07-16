import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { requestAttributeAPI } from '../../services/api';
import { LineChart, BarChart, DoughnutChart } from '../UI/Charts';
import './AttributeAnalytics.css';

const AttributeAnalytics = () => {
  const { currentTenant } = useTenant();
  const [analytics, setAnalytics] = useState({
    requestPatterns: [],
    responseTimeStats: {},
    mostRequestedAttributes: [],
    requestTrends: [],
    entityTypeBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('requests');

  const getTimeRangeMs = (range) => {
    switch (range) {
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      case '1y': return 365 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  };

  const generateTrendData = (requests, timeRange) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRequests = requests.filter(req => {
        const reqDate = new Date(req.created_at);
        return reqDate >= dayStart && reqDate <= dayEnd;
      });

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        requests: dayRequests.length,
        fulfilled: dayRequests.filter(r => r.status === 'fulfilled').length,
        pending: dayRequests.filter(r => r.status === 'pending').length
      });
    }
    
    return trends;
  };

  const generatePatternData = (requests) => {
    const patterns = {
      byHour: new Array(24).fill(0),
      byDayOfWeek: new Array(7).fill(0)
    };

    requests.forEach(req => {
      const date = new Date(req.created_at);
      patterns.byHour[date.getHours()]++;
      patterns.byDayOfWeek[date.getDay()]++;
    });

    return patterns;
  };

  const processRequestsData = useCallback((requests) => {
    const now = new Date();
    const timeRangeMs = getTimeRangeMs(timeRange);
    const filteredRequests = requests.filter(req => 
      new Date(req.created_at) > new Date(now - timeRangeMs)
    );

    // Most requested attributes
    const attributeCounts = {};
    filteredRequests.forEach(req => {
      attributeCounts[req.attribute] = (attributeCounts[req.attribute] || 0) + 1;
    });
    
    const mostRequestedAttributes = Object.entries(attributeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([attribute, count]) => ({ attribute, count }));

    // Response time analysis
    const fulfilledRequests = filteredRequests.filter(req => 
      req.status === 'fulfilled' && req.fulfilled_at
    );
    
    const responseTimes = fulfilledRequests.map(req => {
      const created = new Date(req.created_at);
      const fulfilled = new Date(req.fulfilled_at);
      return (fulfilled - created) / (1000 * 60 * 60); // hours
    });

    const responseTimeStats = {
      average: responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      median: responseTimes.length > 0 ? 
        responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)] : 0,
      fastest: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      slowest: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
    };

    // Request trends over time
    const requestTrends = generateTrendData(filteredRequests, timeRange);

    // Entity type breakdown
    const entityTypeCounts = {};
    filteredRequests.forEach(req => {
      const entityType = req.entity_type || 'Unknown';
      entityTypeCounts[entityType] = (entityTypeCounts[entityType] || 0) + 1;
    });

    const entityTypeBreakdown = Object.entries(entityTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Request patterns by day of week and hour
    const requestPatterns = generatePatternData(filteredRequests);

    return {
      requestPatterns,
      responseTimeStats,
      mostRequestedAttributes,
      requestTrends,
      entityTypeBreakdown
    };
  }, [timeRange, getTimeRangeMs, generateTrendData, generatePatternData]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all requests to analyze patterns
      const requestsResponse = await requestAttributeAPI.getRequestsForMyEntities(
        currentTenant?.id,
        1,
        1000 // Get more data for analytics
      );
      
      const requests = requestsResponse.data.data || [];
      
      // Process analytics data
      const processedAnalytics = processRequestsData(requests);
      setAnalytics(processedAnalytics);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, processRequestsData]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatDuration = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const renderChart = () => {
    switch (selectedMetric) {
      case 'requests': {
        const requestData = {
          labels: analytics.requestTrends.map(t => t.date),
          datasets: [
            {
              label: 'Total Requests',
              data: analytics.requestTrends.map(t => t.requests),
              borderColor: '#4299e1',
              backgroundColor: 'rgba(66, 153, 225, 0.1)',
              fill: true
            },
            {
              label: 'Fulfilled',
              data: analytics.requestTrends.map(t => t.fulfilled),
              borderColor: '#48bb78',
              backgroundColor: 'rgba(72, 187, 120, 0.1)',
              fill: true
            }
          ]
        };
        return <LineChart data={requestData} title="Request Trends" height={400} />;
      }
      
      case 'attributes': {
        const attributeData = {
          labels: analytics.mostRequestedAttributes.map(a => a.attribute),
          datasets: [{
            label: 'Request Count',
            data: analytics.mostRequestedAttributes.map(a => a.count),
            backgroundColor: '#4299e1',
            borderColor: '#3182ce',
            borderWidth: 1
          }]
        };
        return <BarChart data={attributeData} title="Most Requested Attributes" height={400} />;
      }
      
      case 'entities': {
        const entityData = {
          labels: analytics.entityTypeBreakdown.map(e => e.type),
          datasets: [{
            data: analytics.entityTypeBreakdown.map(e => e.count),
            backgroundColor: [
              '#4299e1', '#48bb78', '#ed8936', '#9f7aea',
              '#38b2ac', '#f56565', '#d69e2e', '#667eea'
            ]
          }]
        };
        return <DoughnutChart data={entityData} title="Requests by Entity Type" height={400} />;
      }
      
      default:
        return <div>No data available</div>;
    }
  };

  return (
    <div className="attribute-analytics">
      <div className="analytics-header">
        <h2>Attribute Analytics</h2>
        <div className="analytics-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      ) : (
        <div className="analytics-content">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <div className="metric-value">
                  {analytics.mostRequestedAttributes.reduce((sum, attr) => sum + attr.count, 0)}
                </div>
                <div className="metric-label">Total Requests</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⏱️</div>
              <div className="metric-content">
                <div className="metric-value">
                  {formatDuration(analytics.responseTimeStats.average)}
                </div>
                <div className="metric-label">Avg Response Time</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-value">
                  {analytics.mostRequestedAttributes.length > 0 ? 
                    analytics.mostRequestedAttributes[0].attribute : 'N/A'}
                </div>
                <div className="metric-label">Most Requested</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⚡</div>
              <div className="metric-content">
                <div className="metric-value">
                  {formatDuration(analytics.responseTimeStats.fastest)}
                </div>
                <div className="metric-label">Fastest Response</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="chart-section">
            <div className="chart-header">
              <h3>Request Analysis</h3>
              <div className="chart-controls">
                <button
                  className={`chart-btn ${selectedMetric === 'requests' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('requests')}
                >
                  Trends
                </button>
                <button
                  className={`chart-btn ${selectedMetric === 'attributes' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('attributes')}
                >
                  Attributes
                </button>
                <button
                  className={`chart-btn ${selectedMetric === 'entities' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('entities')}
                >
                  Entity Types
                </button>
              </div>
            </div>
            
            <div className="chart-container">
              {renderChart()}
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="analytics-tables">
            <div className="table-section">
              <h3>Most Requested Attributes</h3>
              <div className="analytics-table">
                <div className="table-header">
                  <div>Attribute</div>
                  <div>Requests</div>
                  <div>Percentage</div>
                </div>
                {analytics.mostRequestedAttributes.map((attr, index) => {
                  const total = analytics.mostRequestedAttributes.reduce((sum, a) => sum + a.count, 0);
                  const percentage = total > 0 ? ((attr.count / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={index} className="table-row">
                      <div className="attribute-name">{attr.attribute}</div>
                      <div className="request-count">{attr.count}</div>
                      <div className="percentage">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="table-section">
              <h3>Response Time Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Average:</span>
                  <span className="stat-value">{formatDuration(analytics.responseTimeStats.average)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Median:</span>
                  <span className="stat-value">{formatDuration(analytics.responseTimeStats.median)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Fastest:</span>
                  <span className="stat-value">{formatDuration(analytics.responseTimeStats.fastest)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Slowest:</span>
                  <span className="stat-value">{formatDuration(analytics.responseTimeStats.slowest)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Request Patterns */}
          <div className="patterns-section">
            <h3>Request Patterns</h3>
            <div className="patterns-grid">
              <div className="pattern-chart">
                <h4>By Hour of Day</h4>
                <div className="hour-chart">
                  {analytics.requestPatterns.byHour?.map((count, hour) => (
                    <div key={hour} className="hour-bar">
                      <div 
                        className="bar"
                        style={{ 
                          height: `${Math.max(count / Math.max(...analytics.requestPatterns.byHour) * 100, 2)}%` 
                        }}
                      ></div>
                      <span className="hour-label">{hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pattern-chart">
                <h4>By Day of Week</h4>
                <div className="day-chart">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="day-bar">
                      <div 
                        className="bar"
                        style={{ 
                          height: `${Math.max((analytics.requestPatterns.byDayOfWeek?.[index] || 0) / Math.max(...(analytics.requestPatterns.byDayOfWeek || [1])) * 100, 2)}%` 
                        }}
                      ></div>
                      <span className="day-label">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributeAnalytics;