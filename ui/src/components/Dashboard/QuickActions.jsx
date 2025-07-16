import React, { useState } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import { entitiesAPI } from '../../services/api';
import { analyticsAPI } from '../../services/analytics';
import { adminAPI } from '../../services/admin';
import './QuickActions.css';

const QuickActions = ({ onCreateEntity, onViewActivity, userRole, tenantId }) => {
  const [loading, setLoading] = useState(false);

  // Define quick actions based on user role
  const getQuickActions = () => {
    const baseActions = [
      {
        id: 'create_entity',
        title: 'Create Entity',
        description: 'Add a new entity',
        icon: 'fas fa-plus',
        color: '#007bff',
        action: onCreateEntity
      },
      {
        id: 'view_activity',
        title: 'View Activity',
        description: 'Check recent activity',
        icon: 'fas fa-chart-line',
        color: '#28a745',
        action: onViewActivity
      },
      {
        id: 'export_data',
        title: 'Export Data',
        description: 'Download your data',
        icon: 'fas fa-download',
        color: '#17a2b8',
        action: handleExportData
      },
      {
        id: 'search_entities',
        title: 'Search Entities',
        description: 'Find specific entities',
        icon: 'fas fa-search',
        color: '#ffc107',
        action: handleSearchEntities
      }
    ];

    // Add admin-specific actions
    if (userRole === 'admin' || userRole === 'tenant_admin') {
      baseActions.push(
        {
          id: 'system_health',
          title: 'System Health',
          description: 'Check system status',
          icon: 'fas fa-heartbeat',
          color: '#dc3545',
          action: handleSystemHealth
        },
        {
          id: 'bulk_operations',
          title: 'Bulk Operations',
          description: 'Manage multiple entities',
          icon: 'fas fa-tasks',
          color: '#6f42c1',
          action: handleBulkOperations
        }
      );
    }

    return baseActions;
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.exportAnalyticsData(
        'entities',
        { tenantId },
        'csv',
        tenantId
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `entities-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEntities = () => {
    // Focus on search input if it exists
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      searchInput.focus();
    } else {
      alert('Search functionality will be available in the entities section below.');
    }
  };

  const handleSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSystemHealth();
      const health = response.data;
      
      alert(`System Health Status:
Status: ${health.status}
Uptime: ${health.uptime || 'N/A'}
Memory Usage: ${health.memory_usage || 'N/A'}
CPU Usage: ${health.cpu_usage || 'N/A'}
Database: ${health.database_status || 'N/A'}`);
      
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      alert('Failed to fetch system health information.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperations = () => {
    alert('Bulk operations will be available in the entity management section. Select multiple entities to perform bulk actions.');
  };

  const quickActions = getQuickActions();

  return (
    <div className="quick-actions-grid">
      {quickActions.map((action) => (
        <button
          key={action.id}
          className="quick-action-card"
          onClick={action.action}
          disabled={loading}
        >
          <div className="quick-action-icon" style={{ color: action.color }}>
            <i className={action.icon}></i>
          </div>
          <div className="quick-action-title">{action.title}</div>
          <div className="quick-action-description">{action.description}</div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;