import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import analyticsAPI from '../../services/analytics';
import { LineChart, BarChart, MetricCard, ChartGrid, chartUtils } from '../UI/Charts';
import { dataExport } from '../../utils/dataExport';
import './TrendAnalysis.css';

const TrendAnalysis = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const [trendData, setTrendData] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['entities', 'users', 'interactions']);
  const [timeRange, setTimeRange] = useState('90d');
  const [granularity, setGranularity] = useState('day');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous_period');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);

  // Available metrics for trend analysis
  const availableMetrics = [
    { 
      id: 'entities', 
      label: 'Entity Creation', 
      color: '#007bff',
      description: 'Track entity creation patterns over time'
    },
    { 
      id: 'users', 
      label: 'User Activity', 
      color: '#28a745',
      description: 'Monitor user engagement and activity levels'
    },
    { 
      id: 'interactions', 
      label: 'User Interactions', 
      color: '#ffc107',
      description: 'Analyze user interaction patterns'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      color: '#6f42c1',
      description: 'Track notification delivery and engagement'
    },
    { 
      id: 'api_usage', 
      label: 'API Usage', 
      color: '#fd7e14',
      description: 'Monitor API request patterns and usage'
    },
    { 
      id: 'performance', 
      label: 'Performance Metrics', 
      color: '#dc3545',
      description: 'Track system performance over time'
    }
  ];

  // Load trend analysis data
  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trend data for each selected metric
      const trendPromises = selectedMetrics.map(metric =>
        analyticsAPI.getTrendAnalysis(metric, currentTenant?.id, timeRange, granularity)
      );

      // Load comparative analysis
      const comparativePromise = analyticsAPI.getComparativeAnalytics(
        selectedMetrics,
        currentTenant?.id,
        timeRange,
        comparisonPeriod
      );

      const [trendResponses, comparativeResponse] = await Promise.all([
        Promise.all(trendPromises),
        comparativePromise
      ]);

      // Process trend data
      const processedTrends = {};
      selectedMetrics.forEach((metric, index) => {
        processedTrends[metric] = trendResponses[index].data;
      });

      setTrendData({
        trends: processedTrends,
        comparative: comparativeResponse.data,
        insights: comparativeResponse.data.insights || []
      });

      setInsights(comparativeResponse.data.insights || []);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError('Failed to load trend analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (selectedMetrics.length > 0) {
      loadTrendData();
    }
  }, [currentTenant, selectedMetrics, timeRange, granularity, comparisonPeriod]);

  // Handle metric selection
  const handleMetricToggle = (metricId) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };

  // Get trend chart data for a specific metric
  const getTrendChartData = (metricId) => {
    const trend = trendData?.trends[metricId];
    if (!trend) return null;

    const metric = availableMetrics.find(m => m.id === metricId);
    
    return {
      labels: trend.data.map(item => item.date),
      datasets: [{
        label: metric.label,
        data: trend.data.map(item => item.value),
        borderColor: metric.color,
        backgroundColor: metric.color + '20',
        fill: true,
        tension: 0.4
      }]
    };
  };

  // Get combined trends chart data
  const getCombinedTrendsData = () => {
    if (!trendData?.trends) return null;

    const datasets = selectedMetrics.map(metricId => {
      const trend = trendData.trends[metricId];
      const metric = availableMetrics.find(m => m.id === metricId);
      
      if (!trend) return null;

      return {
        label: metric.label,
        data: trend.data.map(item => item.value),
        borderColor: metric.color,
        backgroundColor: metric.color + '20',
        fill: false,
        tension: 0.4
      };
    }).filter(Boolean);

    if (datasets.length === 0) return null;

    // Use the first trend's dates as labels
    const firstTrend = Object.values(trendData.trends)[0];
    
    return {
      labels: firstTrend.data.map(item => item.date),
      datasets
    };
  };

  // Get growth rate data
  const getGrowthRateData = () => {
    if (!trendData?.comparative) return null;

    return {
      labels: selectedMetrics.map(metricId => {
        const metric = availableMetrics.find(m => m.id === metricId);
        return metric.label;
      }),
      datasets: [{
        label: 'Growth Rate (%)',
        data: selectedMetrics.map(metricId => {
          const comparison = trendData.comparative.metrics[metricId];
          return comparison?.growth_rate || 0;
        }),
        backgroundColor: selectedMetrics.map(metricId => {
          const metric = availableMetrics.find(m => m.id === metricId);
          return metric.color + '80';
        }),
        borderColor: selectedMetrics.map(metricId => {
          const metric = availableMetrics.find(m => m.id === metricId);
          return metric.color;
        }),
        borderWidth: 2
      }]
    };
  };

  // Get seasonal patterns data
  const getSeasonalPatternsData = () => {
    if (!trendData?.trends) return null;

    // Analyze patterns by day of week or month
    const patterns = {};
    
    selectedMetrics.forEach(metricId => {
      const trend = trendData.trends[metricId];
      if (trend?.seasonal_patterns) {
        patterns[metricId] = trend.seasonal_patterns;
      }
    });

    if (Object.keys(patterns).length === 0) return null;

    const labels = granularity === 'day' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const datasets = Object.entries(patterns).map(([metricId, pattern]) => {
      const metric = availableMetrics.find(m => m.id === metricId);
      return {
        label: metric.label,
        data: labels.map((_, index) => pattern[index] || 0),
        borderColor: metric.color,
        backgroundColor: metric.color + '20',
        fill: false
      };
    });

    return { labels, datasets };
  };

  // Export trend data
  const exportTrendData = async (format) => {
    try {
      const exportData = {
        metrics: selectedMetrics,
        timeRange,
        granularity,
        trends: trendData?.trends,
        comparative: trendData?.comparative,
        insights,
        exported_at: new Date().toISOString()
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = [];
        
        // Add headers
        const headers = ['Date', ...selectedMetrics.map(id => {
          const metric = availableMetrics.find(m => m.id === id);
          return metric.label;
        })];
        csvData.push(headers);

        // Add data rows
        if (trendData?.trends) {
          const firstTrend = Object.values(trendData.trends)[0];
          firstTrend.data.forEach(item => {
            const row = [item.date];
            selectedMetrics.forEach(metricId => {
              const trend = trendData.trends[metricId];
              const dataPoint = trend.data.find(d => d.date === item.date);
              row.push(dataPoint?.value || 0);
            });
            csvData.push(row);
          });
        }

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trend_analysis_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // JSON export
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trend_analysis_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting trend data:', err);
      setError('Failed to export trend data');
    }
  };

  if (loading) {
    return (
      <div className="trend-analysis">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading trend analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trend-analysis">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadTrendData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trend-analysis">
      <div className="analysis-header">
        <div className="header-content">
          <h1>Trend Analysis</h1>
          <p>Identify patterns and insights from your data over time</p>
        </div>
        
        <div className="analysis-controls">
          <div className="control-group">
            <label>Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="180d">Last 6 Months</option>
              <option value="365d">Last Year</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Granularity:</label>
            <select 
              value={granularity} 
              onChange={(e) => setGranularity(e.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Compare to:</label>
            <select 
              value={comparisonPeriod} 
              onChange={(e) => setComparisonPeriod(e.target.value)}
            >
              <option value="previous_period">Previous Period</option>
              <option value="previous_year">Previous Year</option>
              <option value="baseline">Baseline</option>
            </select>
          </div>
          
          <div className="export-controls">
            <button onClick={() => exportTrendData('json')} className="export-button">
              Export JSON
            </button>
            <button onClick={() => exportTrendData('csv')} className="export-button">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="metric-selection">
        <h2>Select Metrics to Analyze</h2>
        <div className="metrics-grid">
          {availableMetrics.map(metric => (
            <div 
              key={metric.id} 
              className={`metric-card ${selectedMetrics.includes(metric.id) ? 'selected' : ''}`}
              onClick={() => handleMetricToggle(metric.id)}
            >
              <div className="metric-header">
                <div 
                  className="metric-color" 
                  style={{ backgroundColor: metric.color }}
                ></div>
                <h3>{metric.label}</h3>
              </div>
              <p>{metric.description}</p>
              <div className="metric-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric.id)}
                  onChange={() => handleMetricToggle(metric.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="insights-section">
          <h2>Key Insights</h2>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">
                  {insight.type === 'positive' ? '📈' : 
                   insight.type === 'negative' ? '📉' : 
                   insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div className="insight-content">
                  <h3>{insight.title}</h3>
                  <p>{insight.description}</p>
                  {insight.value && (
                    <div className="insight-value">
                      {insight.value}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Metrics */}
      {trendData?.comparative && (
        <div className="comparative-metrics">
          <h2>Period Comparison</h2>
          <div className="comparison-grid">
            {selectedMetrics.map(metricId => {
              const metric = availableMetrics.find(m => m.id === metricId);
              const comparison = trendData.comparative.metrics[metricId];
              
              if (!comparison) return null;

              return (
                <MetricCard
                  key={metricId}
                  title={metric.label}
                  value={comparison.current_value?.toLocaleString() || '0'}
                  change={`${comparison.growth_rate > 0 ? '+' : ''}${comparison.growth_rate.toFixed(1)}%`}
                  changeType={comparison.growth_rate > 0 ? 'positive' : 
                             comparison.growth_rate < 0 ? 'negative' : 'neutral'}
                  icon={comparison.growth_rate > 0 ? '📈' : 
                        comparison.growth_rate < 0 ? '📉' : '➡️'}
                  color={metric.color}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Trend Charts */}
      <ChartGrid columns={2}>
        {/* Combined Trends */}
        {getCombinedTrendsData() && (
          <div className="chart-card">
            <LineChart
              data={getCombinedTrendsData()}
              title="Combined Trends"
              height={350}
            />
          </div>
        )}

        {/* Growth Rate Comparison */}
        {getGrowthRateData() && (
          <div className="chart-card">
            <BarChart
              data={getGrowthRateData()}
              title="Growth Rate Comparison"
              height={350}
            />
          </div>
        )}

        {/* Individual Metric Trends */}
        {selectedMetrics.map(metricId => {
          const chartData = getTrendChartData(metricId);
          const metric = availableMetrics.find(m => m.id === metricId);
          
          if (!chartData) return null;

          return (
            <div key={metricId} className="chart-card">
              <LineChart
                data={chartData}
                title={`${metric.label} Trend`}
                height={300}
                gradient={true}
              />
            </div>
          );
        })}

        {/* Seasonal Patterns */}
        {getSeasonalPatternsData() && (
          <div className="chart-card">
            <LineChart
              data={getSeasonalPatternsData()}
              title="Seasonal Patterns"
              height={300}
            />
          </div>
        )}
      </ChartGrid>

      {/* Trend Statistics */}
      {trendData?.trends && (
        <div className="statistics-section">
          <h2>Trend Statistics</h2>
          <div className="statistics-grid">
            {selectedMetrics.map(metricId => {
              const trend = trendData.trends[metricId];
              const metric = availableMetrics.find(m => m.id === metricId);
              
              if (!trend?.statistics) return null;

              return (
                <div key={metricId} className="statistics-card">
                  <h3>{metric.label}</h3>
                  <div className="statistics-list">
                    <div className="statistic">
                      <span className="stat-label">Average:</span>
                      <span className="stat-value">
                        {trend.statistics.average?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="statistic">
                      <span className="stat-label">Peak:</span>
                      <span className="stat-value">
                        {trend.statistics.peak?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="statistic">
                      <span className="stat-label">Low:</span>
                      <span className="stat-value">
                        {trend.statistics.low?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="statistic">
                      <span className="stat-label">Volatility:</span>
                      <span className="stat-value">
                        {(trend.statistics.volatility * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="statistic">
                      <span className="stat-label">Trend Direction:</span>
                      <span className={`stat-value trend-${trend.statistics.direction}`}>
                        {trend.statistics.direction === 'up' ? '↗️ Upward' :
                         trend.statistics.direction === 'down' ? '↘️ Downward' :
                         '➡️ Stable'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;