import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../../hooks/useRealtime.js';
import ActivityFeed from '../UI/ActivityFeed.jsx';
import './EntityActivityTracker.css';

const EntityActivityTracker = ({ 
  entityId = null,
  entityType = null,
  userId = null,
  tenantId = null,
  showFilters = true,
  showStats = true,
  maxActivities = 50,
  autoRefresh = true,
  refreshInterval = 5000,
  onActivitySelect = null,
  className = ''
}) => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    timeRange: '24h'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(entityId);
  const activitiesRef = useRef([]);

  // Build event types based on tracking scope
  const getEventTypes = useCallback(() => {
    const eventTypes = [];
    
    if (entityId) {
      eventTypes.push(`entity:${entityId}`);
    } else if (entityType) {
      eventTypes.push(`entity_type:${entityType}`);
    } else if (userId) {
      eventTypes.push(`user_entities:${userId}`);
    } else if (tenantId) {
      eventTypes.push(`tenant:${tenantId}`);
    } else {
      // Track all entity activities
      eventTypes.push('entity_created', 'entity_updated', 'entity_deleted');
      eventTypes.push('attribute_request', 'attribute_fulfilled');
      eventTypes.push('media_uploaded', 'media_processed');
      eventTypes.push('interaction_created');
    }
    
    return eventTypes;
  }, [entityId, entityType, userId, tenantId]);

  // Handle real-time activity updates
  const handleActivityUpdate = useCallback((data, message) => {
    const activity = {
      id: message.id || `${Date.now()}-${Math.random()}`,
      type: message.type,
      entityId: data.entity_id || data.entityId,
      entityType: data.entity_type || data.entityType,
      entityName: data.entity_name || data.name,
      userId: data.user_id || data.userId,
      userName: data.user_name || data.userName,
      action: data.action || message.type,
      description: data.description || formatActivityDescription(message.type, data),
      timestamp: new Date(message.timestamp || Date.now()),
      severity: message.severity || 'info',
      metadata: data.metadata || {},
      changes: data.changes || null,
      previousValues: data.previous_values || null
    };

    setActivities(prev => {
      const newActivities = [activity, ...prev];
      activitiesRef.current = newActivities.slice(0, maxActivities);
      return activitiesRef.current;
    });

    // Update stats
    updateStats(activity);
  }, [maxActivities]);

  // Set up real-time connection
  const { isConnected } = useRealtime(handleActivityUpdate, {
    eventTypes: getEventTypes(),
    useWebSocket: true,
    autoConnect: autoRefresh,
    throttleMs: 500
  });

  // Format activity description
  const formatActivityDescription = (type, data) => {
    const entityName = data.entity_name || data.name || data.entity_id || 'Unknown';
    const userName = data.user_name || data.user_id || 'System';
    
    switch (type) {
      case 'entity_created':
        return `${userName} created ${data.entity_type} "${entityName}"`;
      case 'entity_updated':
        return `${userName} updated ${data.entity_type} "${entityName}"`;
      case 'entity_deleted':
        return `${userName} deleted ${data.entity_type} "${entityName}"`;
      case 'attribute_request':
        return `${userName} requested "${data.attribute}" for "${entityName}"`;
      case 'attribute_fulfilled':
        return `${userName} provided "${data.attribute}" for "${entityName}"`;
      case 'media_uploaded':
        return `${userName} uploaded ${data.filename} to "${entityName}"`;
      case 'media_processed':
        return `Image ${data.filename} processed for "${entityName}"`;
      case 'interaction_created':
        return `${userName} interacted with "${entityName}"`;
      case 'entity_viewed':
        return `${userName} viewed "${entityName}"`;
      case 'entity_shared':
        return `${userName} shared "${entityName}"`;
      default:
        return data.description || `${type} on "${entityName}"`;
    }
  };

  // Update activity statistics
  const updateStats = useCallback((activity) => {
    setStats(prevStats => {
      const newStats = { ...prevStats };
      
      // Update activity counts by type
      if (!newStats.byType) newStats.byType = {};
      newStats.byType[activity.type] = (newStats.byType[activity.type] || 0) + 1;
      
      // Update activity counts by entity type
      if (activity.entityType) {
        if (!newStats.byEntityType) newStats.byEntityType = {};
        newStats.byEntityType[activity.entityType] = (newStats.byEntityType[activity.entityType] || 0) + 1;
      }
      
      // Update activity counts by user
      if (activity.userId) {
        if (!newStats.byUser) newStats.byUser = {};
        newStats.byUser[activity.userId] = (newStats.byUser[activity.userId] || 0) + 1;
      }
      
      // Update hourly activity
      const hour = activity.timestamp.getHours();
      if (!newStats.byHour) newStats.byHour = {};
      newStats.byHour[hour] = (newStats.byHour[hour] || 0) + 1;
      
      // Update total count
      newStats.total = (newStats.total || 0) + 1;
      
      // Update recent activity rate (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentActivities = activitiesRef.current.filter(a => a.timestamp > oneHourAgo);
      newStats.recentRate = recentActivities.length;
      
      return newStats;
    });
  }, []);

  // Apply filters to activities
  useEffect(() => {
    let filtered = [...activities];
    
    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(activity => 
        activity.type.includes(filters.type) || 
        activity.action.includes(filters.type)
      );
    }
    
    // Filter by severity
    if (filters.severity !== 'all') {
      filtered = filtered.filter(activity => activity.severity === filters.severity);
    }
    
    // Filter by time range
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let cutoff;
      
      switch (filters.timeRange) {
        case '1h':
          cutoff = new Date(now - 60 * 60 * 1000);
          break;
        case '24h':
          cutoff = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = null;
      }
      
      if (cutoff) {
        filtered = filtered.filter(activity => activity.timestamp > cutoff);
      }
    }
    
    setFilteredActivities(filtered);
  }, [activities, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle activity selection
  const handleActivityClick = (activity) => {
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
  };

  // Get activity type options for filter
  const getActivityTypes = () => {
    const types = new Set();
    activities.forEach(activity => {
      types.add(activity.type);
      types.add(activity.action);
    });
    return Array.from(types).sort();
  };

  // Calculate activity summary
  const getActivitySummary = () => {
    const summary = {
      total: filteredActivities.length,
      entities: new Set(filteredActivities.map(a => a.entityId)).size,
      users: new Set(filteredActivities.map(a => a.userId)).size,
      types: new Set(filteredActivities.map(a => a.type)).size
    };
    
    return summary;
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const summary = getActivitySummary();

  return (
    <div className={`entity-activity-tracker ${className}`}>
      <div className="tracker-header">
        <div className="tracker-title">
          <h3>Entity Activity Tracker</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span className="status-text">
              {isConnected ? 'Live Tracking' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {showStats && (
          <div className="activity-summary">
            <div className="summary-item">
              <span className="summary-value">{summary.total}</span>
              <span className="summary-label">Activities</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{summary.entities}</span>
              <span className="summary-label">Entities</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{summary.users}</span>
              <span className="summary-label">Users</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{stats.recentRate || 0}</span>
              <span className="summary-label">Last Hour</span>
            </div>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="tracker-filters">
          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="entity">Entity Changes</option>
              <option value="attribute">Attributes</option>
              <option value="media">Media</option>
              <option value="interaction">Interactions</option>
              {getActivityTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Severity:</label>
            <select 
              value={filters.severity} 
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Time Range:</label>
            <select 
              value={filters.timeRange} 
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>
      )}

      <div className="tracker-content">
        {isLoading ? (
          <div className="tracker-loading">
            <div className="loading-spinner"></div>
            <span>Loading activity tracker...</span>
          </div>
        ) : (
          <ActivityFeed
            eventTypes={getEventTypes()}
            maxItems={maxActivities}
            autoScroll={true}
            showTimestamps={true}
            groupByTime={false}
            onActivityClick={handleActivityClick}
            className="entity-activity-feed"
          />
        )}
      </div>

      {showStats && stats.byType && (
        <div className="tracker-stats">
          <h4>Activity Statistics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <h5>By Type</h5>
              <div className="stat-list">
                {Object.entries(stats.byType)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div key={type} className="stat-item">
                      <span className="stat-name">{type}</span>
                      <span className="stat-value">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            {stats.byEntityType && (
              <div className="stat-card">
                <h5>By Entity Type</h5>
                <div className="stat-list">
                  {Object.entries(stats.byEntityType)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="stat-item">
                        <span className="stat-name">{type}</span>
                        <span className="stat-value">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityActivityTracker;