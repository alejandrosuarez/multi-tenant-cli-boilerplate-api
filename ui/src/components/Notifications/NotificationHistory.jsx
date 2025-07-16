import React, { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import './NotificationHistory.css';

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: '30days',
    customStartDate: '',
    customEndDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const listRef = useRef(null);

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'entity_created', label: 'Entity Created' },
    { value: 'entity_updated', label: 'Entity Updated' },
    { value: 'entity_deleted', label: 'Entity Deleted' },
    { value: 'attribute_request', label: 'Attribute Request' },
    { value: 'attribute_response', label: 'Attribute Response' },
    { value: 'interaction_received', label: 'Interaction' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'tenant_update', label: 'Tenant Update' },
    { value: 'user_mention', label: 'Mention' },
    { value: 'bulk_operation_complete', label: 'Bulk Operation' }
  ];

  const dateRanges = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '90days', label: 'Last 90 days' },
    { value: '1year', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  useEffect(() => {
    loadNotifications(true);
  }, [filters, sortBy, currentTenant]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== '') {
        loadNotifications(true);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const loadNotifications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;
      const params = buildApiParams(currentPage);
      
      const response = await notificationsAPI.getNotifications(
        currentPage,
        20,
        false // Don't filter to unread only for history
      );

      const newNotifications = response.data.notifications || [];
      
      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setTotalCount(response.data.total || 0);
      setHasMore(newNotifications.length === 20);
      setError(null);
    } catch (err) {
      console.error('Error loading notification history:', err);
      setError('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const buildApiParams = (currentPage) => {
    const params = {
      page: currentPage,
      limit: 20,
      sort: sortBy
    };

    if (filters.type !== 'all') {
      params.type = filters.type;
    }

    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (showArchived) {
      params.include_archived = true;
    }

    // Date range filtering
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (filters.dateRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (filters.customStartDate) {
            startDate = new Date(filters.customStartDate);
          }
          if (filters.customEndDate) {
            params.end_date = filters.customEndDate;
          }
          break;
      }

      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
      }
    }

    return params;
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadNotifications(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const archiveSelected = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      const promises = Array.from(selectedNotifications).map(id =>
        notificationsAPI.archiveNotification(id)
      );
      await Promise.all(promises);
      
      setSelectedNotifications(new Set());
      loadNotifications(true);
    } catch (err) {
      console.error('Error archiving notifications:', err);
      setError('Failed to archive notifications');
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedNotifications.size} notifications? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = Array.from(selectedNotifications).map(id =>
        notificationsAPI.deleteNotification(id)
      );
      await Promise.all(promises);
      
      setSelectedNotifications(new Set());
      loadNotifications(true);
    } catch (err) {
      console.error('Error deleting notifications:', err);
      setError('Failed to delete notifications');
    }
  };

  const exportNotifications = async () => {
    try {
      const params = buildApiParams(1);
      params.export = true;
      params.format = 'csv';
      
      // This would need to be implemented in the API
      const response = await notificationsAPI.exportNotifications(params);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting notifications:', err);
      setError('Failed to export notifications');
    }
  };

  // Filter notifications based on current filters and search
  const filteredNotifications = notifications.filter(notification => {
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query) ||
        notification.type?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const getNotificationIcon = (type) => {
    const iconMap = {
      entity_created: 'fas fa-plus-circle',
      entity_updated: 'fas fa-edit',
      entity_deleted: 'fas fa-trash',
      attribute_request: 'fas fa-question-circle',
      attribute_response: 'fas fa-reply',
      interaction_received: 'fas fa-comments',
      system_alert: 'fas fa-exclamation-triangle',
      tenant_update: 'fas fa-building',
      user_mention: 'fas fa-at',
      bulk_operation_complete: 'fas fa-tasks'
    };
    return iconMap[type] || 'fas fa-bell';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="notification-history">
      <div className="history-header">
        <div className="header-title">
          <h2>
            <i className="fas fa-history"></i>
            Notification History
          </h2>
          <p>View and manage your notification history ({totalCount} total)</p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={exportNotifications}
            disabled={notifications.length === 0}
          >
            <i className="fas fa-download"></i>
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      <div className="history-filters">
        <div className="filter-row">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range:</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="type">By Type</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </div>

        {filters.dateRange === 'custom' && (
          <div className="custom-date-range">
            <div className="date-input">
              <label>From:</label>
              <input
                type="date"
                value={filters.customStartDate}
                onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
              />
            </div>
            <div className="date-input">
              <label>To:</label>
              <input
                type="date"
                value={filters.customEndDate}
                onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="filter-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived notifications
          </label>
        </div>
      </div>

      {selectedNotifications.size > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">
            {selectedNotifications.size} selected
          </span>
          <div className="bulk-buttons">
            <button
              className="btn btn-outline"
              onClick={archiveSelected}
            >
              <i className="fas fa-archive"></i>
              Archive
            </button>
            <button
              className="btn btn-danger"
              onClick={deleteSelected}
            >
              <i className="fas fa-trash"></i>
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="history-list" ref={listRef}>
        {loading && notifications.length === 0 ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            Loading notification history...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-history"></i>
            <h3>No notifications found</h3>
            <p>
              {searchQuery || filters.type !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Your notification history will appear here'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="list-header">
              <div className="select-all">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length}
                  onChange={handleSelectAll}
                />
                <span>Select All</span>
              </div>
              <div className="result-count">
                Showing {filteredNotifications.length} of {totalCount} notifications
              </div>
            </div>

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`history-item ${!notification.read ? 'unread' : ''} ${
                  notification.archived ? 'archived' : ''
                } ${selectedNotifications.has(notification.id) ? 'selected' : ''}`}
              >
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                  />
                </div>

                <div className="item-icon">
                  <i className={getNotificationIcon(notification.type)}></i>
                </div>

                <div className="item-content">
                  <div className="item-header">
                    <h4>{notification.title}</h4>
                    <div className="item-meta">
                      <span className="notification-type">
                        {notificationTypes.find(t => t.value === notification.type)?.label || notification.type}
                      </span>
                      <span className="notification-date">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="item-message">{notification.message}</p>
                  {notification.data && (
                    <div className="item-data">
                      {Object.entries(notification.data).map(([key, value]) => (
                        <span key={key} className="data-tag">
                          <strong>{key}:</strong> {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="item-status">
                  {!notification.read && (
                    <span className="status-badge unread">Unread</span>
                  )}
                  {notification.archived && (
                    <span className="status-badge archived">Archived</span>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="load-more">
                <button
                  className="btn btn-outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-chevron-down"></i>
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;