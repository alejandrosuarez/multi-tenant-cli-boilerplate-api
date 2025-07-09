import { useState, useEffect } from 'react';
import { logsAPI } from '../../services/api';
import { Modal, Card, Badge, Alert, Spinner, Pagination, Form, Button, Row, Col } from 'react-bootstrap';

const LogsViewer = ({ show, onHide, entityId = null, title = "Logs" }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [availableEventTypes, setAvailableEventTypes] = useState([]);

  useEffect(() => {
    if (show) {
      loadLogs();
    }
  }, [show, entityId, currentPage, eventTypeFilter]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      if (entityId) {
        // Load entity-specific logs
        response = await logsAPI.getEntityLogs(entityId, currentPage, 20, eventTypeFilter || null);
      } else {
        // Load user's interaction logs
        response = await logsAPI.getMyInteractions(currentPage, 20, eventTypeFilter || null);
      }
      
      setLogs(response.data.logs || response.data.interactions || []);
      setPagination(response.data.pagination);
      
      // Extract unique event types for filter
      const eventTypes = [...new Set(logs.map(log => log.event_type))];
      setAvailableEventTypes(eventTypes);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load logs');
      console.error('Load logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeBadgeVariant = (eventType) => {
    const variants = {
      'login': 'success',
      'logout': 'secondary',
      'create': 'primary',
      'update': 'warning',
      'delete': 'danger',
      'view': 'info',
      'search': 'light',
      'error': 'danger'
    };
    return variants[eventType] || 'secondary';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatEventPayload = (payload) => {
    if (!payload || Object.keys(payload).length === 0) return null;
    
    return (
      <div className="mt-2">
        <small className="text-muted">Event Data:</small>
        <pre className="bg-light p-2 rounded mt-1" style={{ fontSize: '0.75rem', maxHeight: '100px', overflow: 'auto' }}>
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEventTypeChange = (e) => {
    setEventTypeFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setEventTypeFilter('');
    setCurrentPage(1);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Filters */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Filter by Event Type</Form.Label>
              <Form.Select value={eventTypeFilter} onChange={handleEventTypeChange}>
                <option value="">All Event Types</option>
                {availableEventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-end">
            <Button 
              variant="outline-secondary" 
              onClick={handleClearFilters}
              disabled={!eventTypeFilter}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p>No logs found{eventTypeFilter ? ` for event type "${eventTypeFilter}"` : ''}</p>
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <Card key={log.id || index} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Badge bg={getEventTypeBadgeVariant(log.event_type)} className="me-2">
                        {log.event_type}
                      </Badge>
                      <small className="text-muted">
                        {formatTimestamp(log.timestamp)}
                      </small>
                    </div>
                    {log.user_id && (
                      <small className="text-muted">
                        User: {log.user_id}
                      </small>
                    )}
                  </div>
                  
                  {log.entity_id && (
                    <div className="mb-2">
                      <small className="text-muted">
                        Entity ID: <code>{log.entity_id}</code>
                      </small>
                    </div>
                  )}
                  
                  {log.tenant_context && (
                    <div className="mb-2">
                      <small className="text-muted">
                        Tenant: {log.tenant_context}
                      </small>
                    </div>
                  )}
                  
                  {formatEventPayload(log.event_payload)}
                </Card.Body>
              </Card>
            ))}
            
            {/* Pagination */}
            {pagination && pagination.total > 20 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev 
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                  
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, Math.ceil(pagination.total / 20)) }, (_, i) => {
                    const pageNum = currentPage - 2 + i;
                    if (pageNum < 1 || pageNum > Math.ceil(pagination.total / 20)) return null;
                    
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  
                  <Pagination.Next 
                    disabled={currentPage >= Math.ceil(pagination.total / 20)}
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </Pagination>
                
                <div className="ms-3 d-flex align-items-center">
                  <small className="text-muted">
                    Page {currentPage} of {Math.ceil(pagination.total / 20)} 
                    ({pagination.total} total logs)
                  </small>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LogsViewer;
