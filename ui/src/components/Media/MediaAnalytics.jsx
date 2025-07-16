import React, { useState, useEffect, useMemo } from 'react';
import Charts from '../UI/Charts';
import './MediaAnalytics.css';

const MediaAnalytics = ({ mediaFiles, entities }) => {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const analytics = useMemo(() => {
    if (!mediaFiles || mediaFiles.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        averageSize: 0,
        statusDistribution: {},
        typeDistribution: {},
        entityDistribution: {},
        uploadTrends: [],
        sizeDistribution: {},
        processingStats: {},
        storageOptimization: {}
      };
    }

    // Filter files by time range
    const now = new Date();
    const cutoffDate = new Date();
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 30);
    }

    const filteredFiles = mediaFiles.filter(file => 
      new Date(file.created_at) >= cutoffDate
    );

    // Basic stats
    const totalFiles = filteredFiles.length;
    const totalSize = filteredFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    // Status distribution
    const statusDistribution = filteredFiles.reduce((acc, file) => {
      const status = file.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // File type distribution
    const typeDistribution = filteredFiles.reduce((acc, file) => {
      const type = file.content_type?.split('/')[1] || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Entity distribution
    const entityDistribution = filteredFiles.reduce((acc, file) => {
      const entityType = file.entityType || 'unknown';
      acc[entityType] = (acc[entityType] || 0) + 1;
      return acc;
    }, {});

    // Upload trends (daily for last period)
    const uploadTrends = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayFiles = filteredFiles.filter(file => 
        file.created_at.startsWith(dateStr)
      );
      
      uploadTrends.push({
        date: dateStr,
        count: dayFiles.length,
        size: dayFiles.reduce((sum, file) => sum + (file.file_size || 0), 0)
      });
    }

    // Size distribution
    const sizeRanges = {
      'Small (< 100KB)': 0,
      'Medium (100KB - 1MB)': 0,
      'Large (1MB - 10MB)': 0,
      'Very Large (> 10MB)': 0
    };

    filteredFiles.forEach(file => {
      const size = file.file_size || 0;
      if (size < 100 * 1024) {
        sizeRanges['Small (< 100KB)']++;
      } else if (size < 1024 * 1024) {
        sizeRanges['Medium (100KB - 1MB)']++;
      } else if (size < 10 * 1024 * 1024) {
        sizeRanges['Large (1MB - 10MB)']++;
      } else {
        sizeRanges['Very Large (> 10MB)']++;
      }
    });

    // Processing stats
    const processingStats = {
      processed: statusDistribution.processed || 0,
      processing: statusDistribution.processing || 0,
      fallback: statusDistribution.fallback || 0,
      error: statusDistribution.error || 0,
      processingRate: totalFiles > 0 ? ((statusDistribution.processed || 0) / totalFiles * 100) : 0,
      fallbackRate: totalFiles > 0 ? ((statusDistribution.fallback || 0) / totalFiles * 100) : 0
    };

    // Storage optimization insights
    const fallbackFiles = filteredFiles.filter(file => file.status === 'fallback');
    const largeFiles = filteredFiles.filter(file => (file.file_size || 0) > 5 * 1024 * 1024);
    const duplicateNames = {};
    filteredFiles.forEach(file => {
      const name = file.label || file.original_filename || 'unnamed';
      duplicateNames[name] = (duplicateNames[name] || 0) + 1;
    });
    const potentialDuplicates = Object.values(duplicateNames).filter(count => count > 1).length;

    const storageOptimization = {
      fallbackFiles: fallbackFiles.length,
      fallbackSize: fallbackFiles.reduce((sum, file) => sum + (file.file_size || 0), 0),
      largeFiles: largeFiles.length,
      largeFilesSize: largeFiles.reduce((sum, file) => sum + (file.file_size || 0), 0),
      potentialDuplicates,
      compressionOpportunity: largeFiles.length + fallbackFiles.length
    };

    return {
      totalFiles,
      totalSize,
      averageSize,
      statusDistribution,
      typeDistribution,
      entityDistribution,
      uploadTrends,
      sizeDistribution: sizeRanges,
      processingStats,
      storageOptimization
    };
  }, [mediaFiles, timeRange]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatPercentage = (value) => {
    return Math.round(value * 100) / 100 + '%';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return '#27ae60';
      case 'processing': return '#f39c12';
      case 'fallback': return '#e67e22';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const chartData = {
    statusDistribution: {
      labels: Object.keys(analytics.statusDistribution),
      datasets: [{
        data: Object.values(analytics.statusDistribution),
        backgroundColor: Object.keys(analytics.statusDistribution).map(getStatusColor),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    uploadTrends: {
      labels: analytics.uploadTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        label: 'Files Uploaded',
        data: analytics.uploadTrends.map(trend => trend.count),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    sizeDistribution: {
      labels: Object.keys(analytics.sizeDistribution),
      datasets: [{
        data: Object.values(analytics.sizeDistribution),
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    typeDistribution: {
      labels: Object.keys(analytics.typeDistribution),
      datasets: [{
        data: Object.values(analytics.typeDistribution),
        backgroundColor: ['#9b59b6', '#1abc9c', '#34495e', '#f1c40f', '#e67e22'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    }
  };

  if (mediaFiles.length === 0) {
    return (
      <div className="media-analytics empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No media data available</h3>
          <p>Upload some images to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-analytics">
      <div className="analytics-header">
        <h2>Media Analytics</h2>
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

      <div className="analytics-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'storage', label: 'Storage', icon: '💾' },
          { id: 'processing', label: 'Processing', icon: '⚙️' },
          { id: 'optimization', label: 'Optimization', icon: '🔧' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`analytics-tab ${selectedMetric === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedMetric(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {selectedMetric === 'overview' && (
        <div className="analytics-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <div className="stat-value">{analytics.totalFiles}</div>
                <div className="stat-label">Total Files</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💾</div>
              <div className="stat-content">
                <div className="stat-value">{formatFileSize(analytics.totalSize)}</div>
                <div className="stat-label">Total Size</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📏</div>
              <div className="stat-content">
                <div className="stat-value">{formatFileSize(analytics.averageSize)}</div>
                <div className="stat-label">Average Size</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-value">{Object.keys(analytics.entityDistribution).length}</div>
                <div className="stat-label">Entity Types</div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Upload Trends</h3>
              <Charts
                type="line"
                data={chartData.uploadTrends}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
            
            <div className="chart-container">
              <h3>File Status Distribution</h3>
              <Charts
                type="doughnut"
                data={chartData.statusDistribution}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'storage' && (
        <div className="analytics-section">
          <div className="charts-grid">
            <div className="chart-container">
              <h3>File Size Distribution</h3>
              <Charts
                type="pie"
                data={chartData.sizeDistribution}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
            
            <div className="chart-container">
              <h3>File Type Distribution</h3>
              <Charts
                type="doughnut"
                data={chartData.typeDistribution}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          <div className="storage-details">
            <h3>Storage Breakdown by Entity Type</h3>
            <div className="entity-storage-list">
              {Object.entries(analytics.entityDistribution).map(([entityType, count]) => {
                const entityFiles = mediaFiles.filter(f => f.entityType === entityType);
                const entitySize = entityFiles.reduce((sum, f) => sum + (f.file_size || 0), 0);
                
                return (
                  <div key={entityType} className="entity-storage-item">
                    <div className="entity-info">
                      <div className="entity-name">{entityType}</div>
                      <div className="entity-stats">
                        {count} files • {formatFileSize(entitySize)}
                      </div>
                    </div>
                    <div className="entity-bar">
                      <div 
                        className="entity-bar-fill"
                        style={{ 
                          width: `${(count / analytics.totalFiles) * 100}%`,
                          backgroundColor: '#3498db'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'processing' && (
        <div className="analytics-section">
          <div className="processing-stats">
            <div className="processing-overview">
              <h3>Processing Overview</h3>
              <div className="processing-metrics">
                <div className="processing-metric">
                  <div className="metric-label">Processing Rate</div>
                  <div className="metric-value success">
                    {formatPercentage(analytics.processingStats.processingRate)}
                  </div>
                </div>
                <div className="processing-metric">
                  <div className="metric-label">Fallback Rate</div>
                  <div className="metric-value warning">
                    {formatPercentage(analytics.processingStats.fallbackRate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="status-breakdown">
              <h3>Status Breakdown</h3>
              <div className="status-list">
                {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                  <div key={status} className="status-item">
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(status) }}
                    />
                    <div className="status-info">
                      <div className="status-name">{status}</div>
                      <div className="status-count">{count} files</div>
                    </div>
                    <div className="status-percentage">
                      {formatPercentage((count / analytics.totalFiles) * 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h3>Processing Status Distribution</h3>
            <Charts
              type="bar"
              data={{
                labels: Object.keys(analytics.statusDistribution),
                datasets: [{
                  label: 'Files',
                  data: Object.values(analytics.statusDistribution),
                  backgroundColor: Object.keys(analytics.statusDistribution).map(getStatusColor),
                  borderWidth: 1,
                  borderColor: '#fff'
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      )}

      {selectedMetric === 'optimization' && (
        <div className="analytics-section">
          <div className="optimization-overview">
            <h3>Storage Optimization Opportunities</h3>
            <div className="optimization-cards">
              <div className="optimization-card">
                <div className="card-icon">⚠️</div>
                <div className="card-content">
                  <div className="card-title">Fallback Images</div>
                  <div className="card-value">{analytics.storageOptimization.fallbackFiles}</div>
                  <div className="card-description">
                    Images using fallback processing ({formatFileSize(analytics.storageOptimization.fallbackSize)})
                  </div>
                </div>
              </div>

              <div className="optimization-card">
                <div className="card-icon">📏</div>
                <div className="card-content">
                  <div className="card-title">Large Files</div>
                  <div className="card-value">{analytics.storageOptimization.largeFiles}</div>
                  <div className="card-description">
                    Files over 5MB ({formatFileSize(analytics.storageOptimization.largeFilesSize)})
                  </div>
                </div>
              </div>

              <div className="optimization-card">
                <div className="card-icon">🔄</div>
                <div className="card-content">
                  <div className="card-title">Potential Duplicates</div>
                  <div className="card-value">{analytics.storageOptimization.potentialDuplicates}</div>
                  <div className="card-description">
                    Files with similar names that might be duplicates
                  </div>
                </div>
              </div>

              <div className="optimization-card">
                <div className="card-icon">🔧</div>
                <div className="card-content">
                  <div className="card-title">Optimization Score</div>
                  <div className="card-value">
                    {Math.max(0, 100 - (analytics.storageOptimization.compressionOpportunity / analytics.totalFiles * 100)).toFixed(0)}%
                  </div>
                  <div className="card-description">
                    Overall storage optimization score
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="optimization-recommendations">
            <h3>Recommendations</h3>
            <div className="recommendations-list">
              {analytics.storageOptimization.fallbackFiles > 0 && (
                <div className="recommendation-item">
                  <div className="recommendation-icon">⚠️</div>
                  <div className="recommendation-content">
                    <div className="recommendation-title">Reprocess Fallback Images</div>
                    <div className="recommendation-description">
                      {analytics.storageOptimization.fallbackFiles} images are using fallback processing. 
                      Consider reprocessing them for better optimization.
                    </div>
                  </div>
                </div>
              )}

              {analytics.storageOptimization.largeFiles > 0 && (
                <div className="recommendation-item">
                  <div className="recommendation-icon">📏</div>
                  <div className="recommendation-content">
                    <div className="recommendation-title">Compress Large Files</div>
                    <div className="recommendation-description">
                      {analytics.storageOptimization.largeFiles} files are over 5MB. 
                      Consider compressing them to save storage space.
                    </div>
                  </div>
                </div>
              )}

              {analytics.storageOptimization.potentialDuplicates > 0 && (
                <div className="recommendation-item">
                  <div className="recommendation-icon">🔄</div>
                  <div className="recommendation-content">
                    <div className="recommendation-title">Review Potential Duplicates</div>
                    <div className="recommendation-description">
                      Found {analytics.storageOptimization.potentialDuplicates} groups of files with similar names. 
                      Review for potential duplicates.
                    </div>
                  </div>
                </div>
              )}

              {analytics.storageOptimization.compressionOpportunity === 0 && (
                <div className="recommendation-item success">
                  <div className="recommendation-icon">✅</div>
                  <div className="recommendation-content">
                    <div className="recommendation-title">Storage Well Optimized</div>
                    <div className="recommendation-description">
                      Your media storage is well optimized with no immediate optimization opportunities.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaAnalytics;