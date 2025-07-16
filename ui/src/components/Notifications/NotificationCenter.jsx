import React, { useState, useEffect } from 'react'
import { useNotifications } from '../../contexts/NotificationContext'

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    preferences,
    updatePreferences,
    loadNotifications
  } = useNotifications()

  const [selectedNotifications, setSelectedNotifications] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadNotifications()
        setError(null)
      } catch (err) {
        setError('Error loading notifications')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const handleMarkSelectedAsRead = async () => {
    for (const id of selectedNotifications) {
      await markAsRead(id)
    }
    setSelectedNotifications([])
  }

  const handleDeleteSelected = async () => {
    for (const id of selectedNotifications) {
      await removeNotification(id)
    }
    setSelectedNotifications([])
  }

  if (loading) {
    return <div>Loading notifications...</div>
  }

  if (error) {
    return (
      <div>
        Error loading notifications: {error}
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div>
        <h1>Notification Center</h1>
        <div>No notifications</div>
        <div>You're all caught up!</div>
      </div>
    )
  }

  return (
    <div>
      <h1>Notification Center</h1>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <label htmlFor="filter-type">Filter by type:</label>
        <select
          id="filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        
        <button onClick={() => setShowSettings(!showSettings)}>
          Settings
        </button>
      </div>

      {selectedNotifications.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedNotifications.length} selected</span>
          <button onClick={handleMarkSelectedAsRead}>
            Mark selected as read
          </button>
          <button onClick={handleDeleteSelected}>
            Delete selected
          </button>
        </div>
      )}

      <div className="notification-list">
        <div className="notification-header">
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedNotifications(filteredNotifications.map(n => n.id))
              } else {
                setSelectedNotifications([])
              }
            }}
          />
          <span>Notifications</span>
        </div>
        
        {filteredNotifications.map(notification => (
          <div
            key={notification.id}
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            data-testid={`notification-${notification.id}`}
          >
            <input
              type="checkbox"
              checked={selectedNotifications.includes(notification.id)}
              onChange={() => handleSelectNotification(notification.id)}
            />
            
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <small>{new Date(notification.created_at).toLocaleString()}</small>
            </div>
            
            <div className="notification-actions">
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  aria-label="Mark as read"
                  data-testid={`mark-read-button-${notification.id}`}
                >
                  Mark as read
                </button>
              )}
              <button onClick={() => removeNotification(notification.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showSettings && (
        <div className="notification-settings">
          <h3>Notification Preferences</h3>
          
          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.types?.entity_updates}
                onChange={(e) => updatePreferences({
                  ...preferences,
                  types: {
                    ...preferences.types,
                    entity_updates: e.target.checked
                  }
                })}
              />
              Entity Updates
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={preferences.types?.attribute_requests}
                onChange={(e) => updatePreferences({
                  ...preferences,
                  types: {
                    ...preferences.types,
                    attribute_requests: e.target.checked
                  }
                })}
              />
              Attribute Requests
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter