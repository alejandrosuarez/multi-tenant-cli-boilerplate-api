import React, { useState, useEffect } from 'react';
import './RealTimeIndicator.css';

const RealTimeIndicator = ({
  isConnected = false,
  lastUpdate = null,
  updateCount = 0,
  showDetails = true,
  position = 'top-right',
  size = 'medium',
  onToggleConnection = null,
  connectionStatus = 'disconnected', // 'connected', 'connecting', 'disconnected', 'error'
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const updateTime = new Date(lastUpdate);
      const diffInSeconds = Math.floor((now - updateTime) / 1000);

      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds}s ago`);
      } else if (diffInSeconds < 3600) {
        setTimeAgo(`${Math.floor(diffInSeconds / 60)}m ago`);
      } else if (diffInSeconds < 86400) {
        setTimeAgo(`${Math.floor(diffInSeconds / 3600)}h ago`);
      } else {
        setTimeAgo(`${Math.floor(diffInSeconds / 86400)}d ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚫';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'status-connected';
      case 'connecting':
        return 'status-connecting';
      case 'error':
        return 'status-error';
      default:
        return 'status-disconnected';
    }
  };

  return (
    <div 
      className={`realtime-indicator ${position} ${size} ${getStatusClass()} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="indicator-main">
        <div className="status-dot">
          <span className="status-icon">{getStatusIcon()}</span>
          {connectionStatus === 'connecting' && <div className="pulse-ring"></div>}
        </div>
        
        {showDetails && (
          <div className="indicator-details">
            <div className="status-text">{getStatusText()}</div>
            {lastUpdate && (
              <div className="last-update">
                Updated {timeAgo}
              </div>
            )}
            {updateCount > 0 && (
              <div className="update-count">
                {updateCount} updates
              </div>
            )}
          </div>
        )}

        {onToggleConnection && (
          <button
            className="toggle-connection-btn"
            onClick={onToggleConnection}
            title={isConnected ? 'Disconnect' : 'Connect'}
          >
            {isConnected ? '⏸️' : '▶️'}
          </button>
        )}
      </div>

      {showTooltip && (
        <div className="indicator-tooltip">
          <div className="tooltip-content">
            <div className="tooltip-status">
              <strong>Status:</strong> {getStatusText()}
            </div>
            {lastUpdate && (
              <div className="tooltip-update">
                <strong>Last Update:</strong> {new Date(lastUpdate).toLocaleString()}
              </div>
            )}
            {updateCount > 0 && (
              <div className="tooltip-count">
                <strong>Total Updates:</strong> {updateCount}
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="tooltip-error">
                Connection lost. Click to retry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Feed Component for showing real-time updates
export const ActivityFeed = ({ 
  activities = [], 
  maxItems = 10, 
  showTimestamps = true,
  className = '' 
}) => {
  const [visibleActivities, setVisibleActivities] = useState([]);

  useEffect(() => {
    setVisibleActivities(activities.slice(0, maxItems));
  }, [activities, maxItems]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'notification':
        return '🔔';
      case 'user':
        return '👤';
      case 'system':
        return '⚙️';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return activityTime.toLocaleDateString();
    }
  };

  return (
    <div className={`activity-feed ${className}`}>
      <div className="activity-header">
        <h4>Recent Activity</h4>
        <RealTimeIndicator 
          isConnected={true}
          updateCount={activities.length}
          showDetails={false}
          size="small"
        />
      </div>
      
      <div className="activity-list">
        {visibleActivities.length === 0 ? (
          <div className="no-activity">
            No recent activity
          </div>
        ) : (
          visibleActivities.map((activity, index) => (
            <div key={activity.id || index} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-message">
                  {activity.message}
                </div>
                {showTimestamps && activity.timestamp && (
                  <div className="activity-timestamp">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Connection Status Badge Component
export const ConnectionStatusBadge = ({ 
  status, 
  label, 
  onClick,
  className = '' 
}) => {
  return (
    <div 
      className={`connection-badge ${status} ${onClick ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="badge-indicator"></div>
      <span className="badge-label">{label || status}</span>
    </div>
  );
};

export default RealTimeIndicator;