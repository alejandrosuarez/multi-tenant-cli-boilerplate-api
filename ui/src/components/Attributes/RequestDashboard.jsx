import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { requestAttributeAPI } from '../../services/api';
import './RequestDashboard.css';

const RequestDashboard = () => {
  const { currentTenant } = useTenant();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestAttributeAPI.getRequestsForMyEntities(
        currentTenant?.id,
        1,
        50,
        filter === 'all' ? null : filter
      );
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRespond = async (requestId, response) => {
    try {
      setSubmitting(true);
      await requestAttributeAPI.respondToRequest(requestId, response, currentTenant?.id);
      await loadRequests();
      setSelectedRequest(null);
      setResponseText('');
    } catch (error) {
      console.error('Error responding to request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'fulfilled': return '#10b981';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const requestDate = new Date(date);
    const diffInHours = Math.floor((now - requestDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    overdue: requests.filter(r => r.status === 'overdue').length
  };

  return (
    <div className="request-dashboard">
      <div className="dashboard-header">
        <h2>Attribute Requests Dashboard</h2>
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card fulfilled">
            <div className="stat-number">{stats.fulfilled}</div>
            <div className="stat-label">Fulfilled</div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-number">{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="filter-buttons">
          {['all', 'pending', 'fulfilled', 'overdue'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <button className="refresh-btn" onClick={loadRequests}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No requests found</h3>
              <p>No attribute requests match your current filter.</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <span className="priority-icon">
                      {getPriorityIcon(request.priority)}
                    </span>
                    <div className="request-details">
                      <h4>{request.attribute}</h4>
                      <p className="entity-name">Entity: {request.entity_name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="request-meta">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                    <span className="time-ago">{getTimeAgo(request.created_at)}</span>
                  </div>
                </div>

                {request.message && (
                  <div className="request-message">
                    <p>{request.message}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      className="quick-response-btn"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Quick Response
                    </button>
                    <button
                      className="mark-na-btn"
                      onClick={() => handleRespond(request.id, 'N/A')}
                    >
                      Mark as N/A
                    </button>
                  </div>
                )}

                {request.status === 'fulfilled' && request.response && (
                  <div className="request-response">
                    <strong>Response:</strong> {request.response}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {selectedRequest && (
        <div className="response-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Respond to Request</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="request-summary">
                <p><strong>Attribute:</strong> {selectedRequest.attribute}</p>
                <p><strong>Entity:</strong> {selectedRequest.entity_name}</p>
                {selectedRequest.message && (
                  <p><strong>Message:</strong> {selectedRequest.message}</p>
                )}
              </div>
              <div className="response-form">
                <label htmlFor="response">Your Response:</label>
                <textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setSelectedRequest(null)}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={() => handleRespond(selectedRequest.id, responseText)}
                disabled={!responseText.trim() || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDashboard;