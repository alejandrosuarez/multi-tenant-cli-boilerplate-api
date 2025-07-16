import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '../../hooks/useRealtime.js';
import './ActivityFeed.css';

const ActivityFeed = ({ 
  eventTypes = ['*'], 
  maxItems = 100,
  autoScroll = true,
  showTimestamps = true,
  groupByTime = false,
  timeGroupInterval = 300000, // 5 minutes
  filters = {},
  onActivityClick = null,
  className = ''
}) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const feedRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Handle real-time activity updates
  const handleActivityUpdate = useCallback((data, message) => {
    if (isPaused) return;

    const activity = {
      id: message.id || `${Date.now()}-${Math.random()}`,
      type: message.type,
      data: data,
      timestamp: new Date(message.timestamp || Date.now()),
      user: message.user || null,
      entity: message.entity || null,
      tenant: message.tenant || null,
      severity: message.severity || 'info',
      description: message.description || formatActivityDescription(message.type, data)
    };

    setActivities(prev => {
      const newActivities = [activity, ...prev];
      return newActivities.slice(0, maxItems);
    });

    // Auto-scroll to bottom if enabled and user hasn't scrolled up
    if (autoScroll && shouldAutoScroll.current && feedRef.current) {
      setTimeout(() => {
        feedRef.current.scrollTop = 0;
      }, 100);
    }
  }, [isPaused, maxItems, autoScroll]);

  // Set up real-time connection
  const { isConnected, connectionStatus } = useRealtime(handleActivityUpdate, {
    eventTypes,
    useWebSocket: true,
    autoConnect: true,
    selectiveUpdates: Object.keys(filters).length > 0,
    updateFilters: filters
  });

  // Format activity description based on type and data
  const formatActivityDescription = (type, data) => {
    switch (type) {
      case 'entity_created':
        return `Created ${data.entity_type} entity "${data.name || data.id}"`;
      case 'entity_updated':
        return `Updated ${data.entity_type} entity "${data.name || data.id}"`;
      case 'entity_deleted':
        return `Deleted ${data.entity_type} entity "${data.name || data.id}"`;
      case 'attribute_request':
        return `Requested attribute "${data.attribute}" for entity ${data.entity_id}`;
      case 'attribute_fulfilled':
        return `Fulfilled attribute request for "${data.attribute}"`;
      case 'notification_sent':
        return `Sent ${data.type} notification to ${data.recipient}`;
      case 'user_login':
        return `User ${data.user_id} logged in`;
      case 'user_logout':
        return `User ${data.user_id} logged out`;
      case 'bulk_operation':
        return `${data.operation} operation on ${data.count} entities`;
      case 'media_uploaded':
        return `Uploaded ${data.filename} to entity ${data.entity_id}`;
      case 'media_processed':
        return `Processed image ${data.filename}`;
      case 'system_event':
        return data.message || `System event: ${data.event}`;
      default:
        return data.message || `${type} event`;
    }
  };

  // Group activities by time if enabled
  const groupedActivities = groupByTime ? groupActivitiesByTime(activities, timeGroupInterval) : activities;

  // Filter activities based on current filter
  const filteredActivities = filter === 'all' 
    ? groupedActivities 
    : groupedActivities.filter(activity => {
        if (Array.isArray(activity)) {
          return activity.some(a => a.type.includes(filter) || a.severity === filter);
        }
        return activity.type.includes(filter) || activity.severity === filter;
      });

  // Handle scroll to detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (feedRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      shouldAutoScroll.current = scrollTop < 50; // Near top
    }
  }, []);

  // Get activity icon based on type
  const getActivityIcon = (type, severity) => {
    if (severity === 'error') return '❌';
    if (severity === 'warning') return '⚠️';
    if (severity === 'success') return '✅';
    
    switch (type) {
      case 'entity_created': return '➕';
      case 'entity_updated': return '✏️';
      case 'entity_deleted': return '🗑️';
      case 'attribute_request': return '❓';
      case 'attribute_fulfilled': return '✅';
      case 'notification_sent': return '📧';
      case 'user_login': return '🔑';
      case 'user_logout': return '🚪';
      case 'bulk_operation': return '📦';
      case 'media_uploaded': return '📁';
      case 'media_processed': return '🖼️';
      case 'system_event': return '⚙️';
      default: return '📝';
    }
  };

  // Get relative time string
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  // Load initial activities
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className={`activity-feed ${className}`}>
      <div className="activity-feed-header">
        <div className="activity-feed-title">
          <h3>Activity Feed</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span className="status-text">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="activity-feed-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Activities</option>
            <option value="entity">Entities</option>
            <option value="attribute">Attributes</option>
            <option value="notification">Notifications</option>
            <option value="user">Users</option>
            <option value="system">System</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
          </select>
          
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`pause-button ${isPaused ? 'paused' : ''}`}
            title={isPaused ? 'Resume feed' : 'Pause feed'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          
          <button 
            onClick={() => setActivities([])}
            className="clear-button"
            title="Clear feed"
          >
            🗑️
          </button>
        </div>
      </div>

      <div 
        className="activity-feed-content"
        ref={feedRef}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="activity-loading">
            <div className="loading-spinner"></div>
            <span>Loading activities...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="activity-empty">
            <span>No activities to show</span>
            {isPaused && <p>Feed is paused</p>}
          </div>
        ) : (
          <div className="activity-list">
            {filteredActivities.map((activity, index) => {
              // Handle grouped activities
              if (Array.isArray(activity)) {
                return (
                  <div key={`group-${index}`} className="activity-group">
                    <div className="activity-group-header">
                      <span className="activity-group-time">
                        {getRelativeTime(activity[0].timestamp)}
                      </span>
                      <span className="activity-group-count">
                        {activity.length} activities
                      </span>
                    </div>
                    {activity.map((groupedActivity, groupIndex) => (
                      <ActivityItem
                        key={groupedActivity.id}
                        activity={groupedActivity}
                        showTimestamp={false}
                        onClick={onActivityClick}
                        getIcon={getActivityIcon}
                        getRelativeTime={getRelativeTime}
                      />
                    ))}
                  </div>
                );
              }

              // Handle individual activities
              return (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  showTimestamp={showTimestamps}
                  onClick={onActivityClick}
                  getIcon={getActivityIcon}
                  getRelativeTime={getRelativeTime}
                />
              );
            })}
          </div>
        )}
      </div>

      {isPaused && (
        <div className="activity-feed-overlay">
          <div className="pause-indicator">
            <span>⏸️ Feed Paused</span>
            <button onClick={() => setIsPaused(false)}>Resume</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual activity item component
const ActivityItem = ({ 
  activity, 
  showTimestamp, 
  onClick, 
  getIcon, 
  getRelativeTime 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  return (
    <div 
      className={`activity-item ${activity.severity} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <div className="activity-icon">
        {getIcon(activity.type, activity.severity)}
      </div>
      
      <div className="activity-content">
        <div className="activity-description">
          {activity.description}
        </div>
        
        {activity.user && (
          <div className="activity-user">
            by {activity.user.name || activity.user.id}
          </div>
        )}
        
        {activity.entity && (
          <div className="activity-entity">
            Entity: {activity.entity.name || activity.entity.id}
          </div>
        )}
        
        {showTimestamp && (
          <div className="activity-timestamp">
            {getRelativeTime(activity.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to group activities by time
const groupActivitiesByTime = (activities, interval) => {
  const groups = [];
  let currentGroup = [];
  let lastTimestamp = null;

  activities.forEach(activity => {
    if (!lastTimestamp || (lastTimestamp - activity.timestamp) > interval) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup.length === 1 ? currentGroup[0] : currentGroup);
      }
      currentGroup = [activity];
      lastTimestamp = activity.timestamp;
    } else {
      currentGroup.push(activity);
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup.length === 1 ? currentGroup[0] : currentGroup);
  }

  return groups;
};

export default ActivityFeed;