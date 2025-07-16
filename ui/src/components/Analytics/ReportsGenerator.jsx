import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import analyticsAPI from '../../services/analytics';
import { dataExport } from '../../utils/dataExport';
import './ReportsGenerator.css';

const ReportsGenerator = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    type: 'dashboard',
    metrics: [],
    filters: {
      dateRange: {
        start: '',
        end: '',
        preset: '30d'
      },
      entityTypes: [],
      tenants: [],
      users: []
    },
    format: 'pdf',
    includeCharts: true,
    includeRawData: false
  });
  
  const [savedReports, setSavedReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    recipients: [],
    enabled: true
  });

  // Available report types
  const reportTypes = [
    { id: 'dashboard', label: 'Dashboard Overview', description: 'Comprehensive system overview' },
    { id: 'entities', label: 'Entity Analytics', description: 'Entity creation, usage, and trends' },
    { id: 'users', label: 'User Activity', description: 'User engagement and behavior' },
    { id: 'performance', label: 'Performance Report', description: 'System performance metrics' },
    { id: 'notifications', label: 'Notification Analytics', description: 'Notification delivery and engagement' },
    { id: 'custom', label: 'Custom Report', description: 'Build your own report' }
  ];

  // Available metrics for custom reports
  const availableMetrics = [
    { id: 'entity_count', label: 'Entity Count', category: 'entities' },
    { id: 'entity_creation_rate', label: 'Entity Creation Rate', category: 'entities' },
    { id: 'active_users', label: 'Active Users', category: 'users' },
    { id: 'user_engagement', label: 'User Engagement', category: 'users' },
    { id: 'api_requests', label: 'API Requests', category: 'performance' },
    { id: 'response_time', label: 'Response Time', category: 'performance' },
    { id: 'error_rate', label: 'Error Rate', category: 'performance' },
    { id: 'notification_delivery', label: 'Notification Delivery', category: 'notifications' },
    { id: 'notification_engagement', label: 'Notification Engagement', category: 'notifications' }
  ];

  // Load saved and scheduled reports
  useEffect(() => {
    loadReports();
  }, [currentTenant]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [savedResponse, scheduledResponse] = await Promise.all([
        analyticsAPI.getSavedReports(currentTenant?.id),
        analyticsAPI.getScheduledReports(currentTenant?.id)
      ]);
      
      setSavedReports(savedResponse.data.reports || []);
      setScheduledReports(scheduledResponse.data.schedules || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Handle report config changes
  const handleConfigChange = (field, value) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested config changes
  const handleNestedConfigChange = (parent, field, value) => {
    setReportConfig(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle metrics selection
  const handleMetricToggle = (metricId) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(id => id !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  // Generate report
  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      setError(null);

      const response = await analyticsAPI.generateReport(reportConfig, currentTenant?.id);
      const reportId = response.data.reportId;

      // Poll for report completion
      const pollReport = async () => {
        try {
          const statusResponse = await analyticsAPI.getReportStatus(reportId, currentTenant?.id);
          const status = statusResponse.data.status;

          if (status === 'completed') {
            // Download the report
            const downloadResponse = await analyticsAPI.downloadReport(
              reportId, 
              currentTenant?.id, 
              reportConfig.format
            );
            
            // Create download link
            const url = window.URL.createObjectURL(downloadResponse.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportConfig.name || 'report'}.${reportConfig.format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Refresh saved reports
            loadReports();
          } else if (status === 'failed') {
            throw new Error('Report generation failed');
          } else {
            // Continue polling
            setTimeout(pollReport, 2000);
          }
        } catch (err) {
          throw err;
        }
      };

      await pollReport();
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Schedule report
  const scheduleReport = async () => {
    try {
      await analyticsAPI.scheduleReport(reportConfig, scheduleConfig, currentTenant?.id);
      loadReports();
      alert('Report scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling report:', err);
      setError('Failed to schedule report');
    }
  };

  // Delete saved report
  const deleteSavedReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await analyticsAPI.deleteReport(reportId, currentTenant?.id);
      loadReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    }
  };

  // Delete scheduled report
  const deleteScheduledReport = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      await analyticsAPI.deleteScheduledReport(scheduleId, currentTenant?.id);
      loadReports();
    } catch (err) {
      console.error('Error deleting scheduled report:', err);
      setError('Failed to delete scheduled report');
    }
  };

  // Toggle scheduled report
  const toggleScheduledReport = async (scheduleId, enabled) => {
    try {
      await analyticsAPI.updateScheduledReport(scheduleId, { enabled }, currentTenant?.id);
      loadReports();
    } catch (err) {
      console.error('Error updating scheduled report:', err);
      setError('Failed to update scheduled report');
    }
  };

  // Export data directly
  const exportData = async (format) => {
    try {
      const response = await analyticsAPI.exportAnalyticsData(
        reportConfig.type,
        reportConfig.filters,
        format,
        currentTenant?.id
      );
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_export_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="reports-generator">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-generator">
      <div className="reports-header">
        <h1>Reports Generator</h1>
        <p>Create custom reports and schedule automated delivery</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="reports-content">
        {/* Report Configuration */}
        <div className="report-config-section">
          <h2>Create New Report</h2>
          
          <div className="config-form">
            <div className="form-group">
              <label>Report Name</label>
              <input
                type="text"
                value={reportConfig.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="Enter report name"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={reportConfig.description}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                placeholder="Describe what this report contains"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Report Type</label>
              <select
                value={reportConfig.type}
                onChange={(e) => handleConfigChange('type', e.target.value)}
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom metrics selection */}
            {reportConfig.type === 'custom' && (
              <div className="form-group">
                <label>Select Metrics</label>
                <div className="metrics-grid">
                  {availableMetrics.map(metric => (
                    <label key={metric.id} className="metric-checkbox">
                      <input
                        type="checkbox"
                        checked={reportConfig.metrics.includes(metric.id)}
                        onChange={() => handleMetricToggle(metric.id)}
                      />
                      <span>{metric.label}</span>
                      <small>{metric.category}</small>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="form-group">
              <label>Date Range</label>
              <div className="date-range-controls">
                <select
                  value={reportConfig.filters.dateRange.preset}
                  onChange={(e) => handleNestedConfigChange('filters', 'dateRange', {
                    ...reportConfig.filters.dateRange,
                    preset: e.target.value
                  })}
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                
                {reportConfig.filters.dateRange.preset === 'custom' && (
                  <div className="custom-date-range">
                    <input
                      type="date"
                      value={reportConfig.filters.dateRange.start}
                      onChange={(e) => handleNestedConfigChange('filters', 'dateRange', {
                        ...reportConfig.filters.dateRange,
                        start: e.target.value
                      })}
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={reportConfig.filters.dateRange.end}
                      onChange={(e) => handleNestedConfigChange('filters', 'dateRange', {
                        ...reportConfig.filters.dateRange,
                        end: e.target.value
                      })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Format and Options */}
            <div className="form-row">
              <div className="form-group">
                <label>Format</label>
                <select
                  value={reportConfig.format}
                  onChange={(e) => handleConfigChange('format', e.target.value)}
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeCharts}
                    onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                  />
                  Include Charts
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeRawData}
                    onChange={(e) => handleConfigChange('includeRawData', e.target.checked)}
                  />
                  Include Raw Data
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={generateReport}
                disabled={generatingReport || !reportConfig.name}
                className="generate-button"
              >
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>

              <button
                onClick={scheduleReport}
                disabled={!reportConfig.name}
                className="schedule-button"
              >
                Schedule Report
              </button>

              <div className="export-buttons">
                <button onClick={() => exportData('csv')} className="export-button">
                  Export CSV
                </button>
                <button onClick={() => exportData('json')} className="export-button">
                  Export JSON
                </button>
                <button onClick={() => exportData('xlsx')} className="export-button">
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Reports */}
        <div className="saved-reports-section">
          <h2>Saved Reports</h2>
          {savedReports.length === 0 ? (
            <p className="no-reports">No saved reports yet</p>
          ) : (
            <div className="reports-list">
              {savedReports.map(report => (
                <div key={report.id} className="report-item">
                  <div className="report-info">
                    <h3>{report.name}</h3>
                    <p>{report.description}</p>
                    <div className="report-meta">
                      <span>Type: {report.type}</span>
                      <span>Format: {report.format}</span>
                      <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button
                      onClick={() => analyticsAPI.downloadReport(report.id, currentTenant?.id, report.format)}
                      className="download-button"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteSavedReport(report.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Reports */}
        <div className="scheduled-reports-section">
          <h2>Scheduled Reports</h2>
          {scheduledReports.length === 0 ? (
            <p className="no-reports">No scheduled reports</p>
          ) : (
            <div className="reports-list">
              {scheduledReports.map(schedule => (
                <div key={schedule.id} className="report-item">
                  <div className="report-info">
                    <h3>{schedule.report_name}</h3>
                    <p>{schedule.description}</p>
                    <div className="report-meta">
                      <span>Frequency: {schedule.frequency}</span>
                      <span>Next Run: {new Date(schedule.next_run).toLocaleDateString()}</span>
                      <span className={`status ${schedule.enabled ? 'enabled' : 'disabled'}`}>
                        {schedule.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button
                      onClick={() => toggleScheduledReport(schedule.id, !schedule.enabled)}
                      className={`toggle-button ${schedule.enabled ? 'pause' : 'resume'}`}
                    >
                      {schedule.enabled ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteScheduledReport(schedule.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsGenerator;