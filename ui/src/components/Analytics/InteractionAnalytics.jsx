import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import analyticsAPI from '../../services/analytics';
import { LineChart, BarChart, DoughnutChart, MetricCard, ChartGrid, chartUtils } from '../UI/Charts';
import FilterPanel from '../UI/FilterPanel';
import DataTable from '../UI/DataTable';
import './InteractionAnalytics.css';

const InteractionAnalytics = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [interactionLogs, setInteractionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [groupBy, setGroupBy] = useState('day');
  const [selectedMetrics, setSelectedMetrics] = useState(['views', 'interactions', 'engagement']);
  
  const [filters, setFilters] = useState({
    entityTypes: [],
    interactionTypes: [],
    userSegments: [],
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Available metrics for interaction analysis
  const availableMetrics = [
    { id: 'views', label: 'Page Views', color: '#007bff' },
    { id: 'interactions', label: 'User Interactions', color: '#28a745' },
    { id: 'engagement', label: 'Engagement Rate', color: '#ffc107' },
    { id: 'bounce_rate', label: 'Bounce Rate', color: '#dc3545' },
    { id: 'session_duration', label: 'Session Duration', color: '#6f42c1' },
    { id: 'conversion_rate', label: 'Conversion Rate', color: '#fd7e14' }
  ];

  // Interaction types for filtering
  const interactionTypes = [
    'entity_view', 'entity_create', 'entity_update', 'entity_delete',
    'attribute_request', 'attribute_response', 'notification_send',
    'search_query', 'export_data', 'login', 'logout'
  ];

  // Load interaction analytics
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsResponse, logsResponse] = await Promise.all([
        analyticsAPI.getInteractionAnalytics(currentTenant?.id, timeRange, groupBy),
        analyticsAPI.getInteractionLogs(currentTenant?.id, {
          ...filters,
          limit: 100,
          timeRange
        })
      ]);

      setAnalyticsData(analyticsResponse.data);
      setInteractionLogs(logsResponse.data.logs || []);
    } catch (err) {
      console.error('Error loading interaction analytics:', err);
      setError('Failed to load interaction analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, [currentTenant, timeRange, groupBy, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle metric selection
  const handleMetricToggle = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  // Get funnel analysis data
  const getFunnelData = () => {
    if (!analyticsData?.funnel) return null;

    return {
      labels: analyticsData.funnel.map(step => step.name),
      datasets: [{
        label: 'Users',
        data: analyticsData.funnel.map(step => step.users),
        backgroundColor: chartUtils.generateColors(analyticsData.funnel.length, 0.7),
        borderColor: chartUtils.generateColors(analyticsData.funnel.length),
        borderWidth: 2
      }]
    };
  };

  // Get user journey data
  const getUserJourneyData = () => {
    if (!analyticsData?.user_journey) return null;

    return {
      labels: analyticsData.user_journey.map(step => step.step),
      datasets: [{
        label: 'Users',
        data: analyticsData.user_journey.map(step => step.count),
        borderColor: '#007bff',
        backgroundColor: '#007bff20',
        fill: true,
        tension: 0.4
      }]
    };
  };

  // Get interaction heatmap data
  const getHeatmapData = () => {
    if (!analyticsData?.heatmap) return [];
    
    return analyticsData.heatmap.map(item => ({
      hour: item.hour,
      day: item.day_of_week,
      value: item.interaction_count,
      intensity: item.intensity
    }));
  };

  // Format interaction logs for table
  const formatInteractionLogs = () => {
    return interactionLogs.map(log => ({
      id: log.id,
      timestamp: new Date(log.timestamp).toLocaleString(),
      user: log.user_email || log.user_id,
      action: log.interaction_type,
      entity: log.entity_type || 'N/A',
      details: log.details || 'N/A',
      duration: log.duration ? `${log.duration}ms` : 'N/A',
      success: log.success ? '✅' : '❌'
    }));
  };

  // Table columns for interaction logs
  const tableColumns = [
    { key: 'timestamp', label: 'Time', sortable: true },
    { key: 'user', label: 'User', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'entity', label: 'Entity Type', sortable: true },
    { key: 'details', label: 'Details' },
    { key: 'duration', label: 'Duration', sortable: true },
    { key: 'success', label: 'Status', sortable: true }
  ];

  if (loading) {
    return (
      <div className="interaction-analytics">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading interaction analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interaction-analytics">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadAnalytics} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const metrics = analyticsData?.metrics || {};

  return (
    <div className="interaction-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Interaction Analytics</h1>
          <p>Detailed analysis of user behavior and engagement patterns</p>
        </div>
        
        <div className="analytics-controls">
          <div className="time-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
            </select>
          </div>
          
          <button onClick={loadAnalytics} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFilterChange}
        availableFilters={[
          {
            key: 'entityTypes',
            label: 'Entity Types',
            type: 'multiselect',
            options: analyticsData?.available_entity_types || []
          },
          {
            key: 'interactionTypes',
            label: 'Interaction Types',
            type: 'multiselect',
            options: interactionTypes
          },
          {
            key: 'dateRange',
            label: 'Custom Date Range',
            type: 'daterange'
          }
        ]}
      />

      {/* Metric Selection */}
      <div className="metric-selector">
        <h3>Select Metrics to Display</h3>
        <div className="metric-checkboxes">
          {availableMetrics.map(metric => (
            <label key={metric.id} className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.id)}
                onChange={() => handleMetricToggle(metric.id)}
              />
              <span style={{ color: metric.color }}>
                {metric.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Interactions"
          value={metrics.total_interactions?.toLocaleString() || '0'}
          change={chartUtils.calculateChange(
            metrics.total_interactions,
            metrics.previous_total_interactions
          )?.value}
          changeType={chartUtils.calculateChange(
            metrics.total_interactions,
            metrics.previous_total_interactions
          )?.type}
          icon="🔄"
          color="#007bff"
        />
        
        <MetricCard
          title="Unique Users"
          value={metrics.unique_users?.toLocaleString() || '0'}
          change={chartUtils.calculateChange(
            metrics.unique_users,
            metrics.previous_unique_users
          )?.value}
          changeType={chartUtils.calculateChange(
            metrics.unique_users,
            metrics.previous_unique_users
          )?.type}
          icon="👥"
          color="#28a745"
        />
        
        <MetricCard
          title="Avg Session Duration"
          value={`${Math.round(metrics.avg_session_duration / 60) || 0}m`}
          change={chartUtils.calculateChange(
            metrics.avg_session_duration,
            metrics.previous_avg_session_duration
          )?.value}
          changeType={chartUtils.calculateChange(
            metrics.avg_session_duration,
            metrics.previous_avg_session_duration
          )?.type}
          icon="⏱️"
          color="#ffc107"
        />
        
        <MetricCard
          title="Bounce Rate"
          value={`${(metrics.bounce_rate || 0).toFixed(1)}%`}
          change={chartUtils.calculateChange(
            metrics.bounce_rate,
            metrics.previous_bounce_rate
          )?.value}
          changeType={chartUtils.calculateChange(
            metrics.bounce_rate,
            metrics.previous_bounce_rate
          )?.type === 'positive' ? 'negative' : 'positive'} // Lower bounce rate is better
          icon="📉"
          color="#dc3545"
        />
      </div>

      {/* Charts */}
      <ChartGrid columns={2}>
        {/* Interaction Trends */}
        {analyticsData?.trends && (
          <div className="chart-card">
            <LineChart
              data={{
                labels: analyticsData.trends.map(item => item.date),
                datasets: selectedMetrics.map(metricId => {
                  const metric = availableMetrics.find(m => m.id === metricId);
                  return {
                    label: metric.label,
                    data: analyticsData.trends.map(item => item[metricId] || 0),
                    borderColor: metric.color,
                    backgroundColor: metric.color + '20',
                    fill: false
                  };
                })
              }}
              title="Interaction Trends"
              height={300}
            />
          </div>
        )}

        {/* Interaction Types Distribution */}
        {analyticsData?.interaction_types && (
          <div className="chart-card">
            <DoughnutChart
              data={chartUtils.formatCategoryData(
                Object.entries(analyticsData.interaction_types).map(([type, count]) => ({
                  category: type.replace('_', ' ').toUpperCase(),
                  value: count
                }))
              )}
              title="Interaction Types Distribution"
              height={300}
            />
          </div>
        )}

        {/* User Journey */}
        {getUserJourneyData() && (
          <div className="chart-card">
            <LineChart
              data={getUserJourneyData()}
              title="User Journey Flow"
              height={300}
              gradient={true}
            />
          </div>
        )}

        {/* Conversion Funnel */}
        {getFunnelData() && (
          <div className="chart-card">
            <BarChart
              data={getFunnelData()}
              title="Conversion Funnel"
              height={300}
              horizontal={true}
            />
          </div>
        )}
      </ChartGrid>

      {/* Activity Heatmap */}
      {analyticsData?.heatmap && (
        <div className="heatmap-section">
          <h2>Activity Heatmap</h2>
          <div className="heatmap-container">
            <div className="heatmap-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                <div key={day} className="heatmap-day">
                  <div className="day-label">{day}</div>
                  <div className="hour-cells">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const data = analyticsData.heatmap.find(
                        item => item.day_of_week === dayIndex && item.hour === hour
                      );
                      const intensity = data ? data.intensity : 0;
                      return (
                        <div
                          key={hour}
                          className="hour-cell"
                          style={{
                            backgroundColor: `rgba(0, 123, 255, ${intensity})`,
                            opacity: Math.max(0.1, intensity)
                          }}
                          title={`${day} ${hour}:00 - ${data?.interaction_count || 0} interactions`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="heatmap-legend">
              <span>Less</span>
              <div className="legend-gradient"></div>
              <span>More</span>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Logs Table */}
      <div className="logs-section">
        <h2>Recent Interactions</h2>
        <DataTable
          data={formatInteractionLogs()}
          columns={tableColumns}
          searchable={true}
          sortable={true}
          pagination={true}
          pageSize={20}
        />
      </div>

      {/* User Segments Analysis */}
      {analyticsData?.user_segments && (
        <div className="segments-section">
          <h2>User Segments Analysis</h2>
          <div className="segments-grid">
            {analyticsData.user_segments.map(segment => (
              <div key={segment.name} className="segment-card">
                <h3>{segment.name}</h3>
                <div className="segment-metrics">
                  <div className="segment-metric">
                    <span className="metric-label">Users:</span>
                    <span className="metric-value">{segment.user_count.toLocaleString()}</span>
                  </div>
                  <div className="segment-metric">
                    <span className="metric-label">Avg Sessions:</span>
                    <span className="metric-value">{segment.avg_sessions.toFixed(1)}</span>
                  </div>
                  <div className="segment-metric">
                    <span className="metric-label">Engagement:</span>
                    <span className="metric-value">{(segment.engagement_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="segment-metric">
                    <span className="metric-label">Retention:</span>
                    <span className="metric-value">{(segment.retention_rate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionAnalytics;