import { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI, authAPI } from '../../services/api';
import EntityList from './EntityList';
import EntityModal from './EntityModal';
import LogsViewer from './LogsViewer';
import { useRealtime } from '../../hooks/useRealtime';
import { logsAPI } from '../../services/api';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge, Dropdown, ButtonGroup } from 'react-bootstrap';
import { EntityListSkeleton, DashboardHeaderSkeleton, FormSkeleton, NavSkeleton } from '../UI/Skeleton';

const Dashboard = ({ user, onLogout }) => {
  const [entities, setEntities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedEntityForLogs, setSelectedEntityForLogs] = useState(null);

  const tenantId = user.tenant || 'default';

  const { isActive: isRealtimeActive, toggle: toggleRealtime } = useRealtime(() => {
    if (!loading) {
      loadEntities();
    }
  }, parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 5000);

  useEffect(() => {
    loadCategories();
    loadEntities();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadEntities();
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(tenantId);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadEntities = async (page = currentPage) => {
    setLoading(true);
    try {
      let response;
      
      if (searchQuery) {
        response = await entitiesAPI.search(searchQuery, tenantId, page);
      } else if (selectedCategory) {
        response = await categoriesAPI.getEntitiesByCategory(selectedCategory, tenantId, page);
      } else {
        response = await entitiesAPI.getAll(tenantId, page);
      }
      
      const newEntities = response.data.entities || response.data;
      const newPagination = response.data.pagination;

      // Only update state if data has actually changed to prevent re-render blink
      if (JSON.stringify(newEntities) !== JSON.stringify(entities)) {
        setEntities(newEntities);
      }
      if (JSON.stringify(newPagination) !== JSON.stringify(pagination)) {
        setPagination(newPagination);
      }
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load entities');
      console.error('Load entities error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowLogs = (entityId) => {
    setSelectedEntityForLogs(entityId);
    setShowLogs(true);
  };
  
  const handleShowMyLogs = () => {
    setSelectedEntityForLogs(null); // null means show user's logs
    setShowLogs(true);
  };

  const handleCreateEntity = async (entityData) => {
    console.log('handleCreateEntity called', entityData);
    try {
      await entitiesAPI.create(entityData, tenantId);
      console.log('Entity created successfully');
      loadEntities();
    } catch (err) {
      setError('Failed to create entity');
      console.error('Create entity error:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleUpdateEntity = async (entityData) => {
    console.log('handleUpdateEntity called', entityData);
    try {
      await entitiesAPI.update(selectedEntity.id, entityData, tenantId);
      console.log('Entity updated successfully');
      loadEntities();
    } catch (err) {
      setError('Failed to update entity');
      console.error('Update entity error:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleDeleteEntity = async (id) => {
    console.log('handleDeleteEntity called', id);
    if (!confirm('Are you sure you want to delete this entity?')) return;
    
    try {
      await entitiesAPI.delete(id, tenantId);
      console.log('Entity deleted successfully');
      loadEntities();
    } catch (err) {
      setError('Failed to delete entity');
      console.error('Delete entity error:', err);
    }
  };

  const handleEdit = (entity) => {
    console.log('handleEdit called', entity);
    setSelectedEntity(entity);
    setModalMode('edit');
    setShowEntityModal(true);
  };

  const handleView = (entity) => {
    console.log('handleView called', entity);
    setSelectedEntity(entity);
    setModalMode('view');
    setShowEntityModal(true);
  };

  const handleCreate = () => {
    console.log('handleCreate called');
    setSelectedEntity(null);
    setModalMode('create');
    setShowEntityModal(true);
  };

  const handleModalClose = () => {
    setShowEntityModal(false);
    setSelectedEntity(null);
    setModalMode('create');
  };

  const handleLogout = async () => {
    console.log('handleLogout called');
    try {
      // Call the API logout endpoint to properly end the session
      await authAPI.logout();
    } catch (err) {
      console.error('Logout API call failed:', err);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage and update state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <div className="dashboard-container">
      <Container className="main-layout py-4">
{/* Dashboard Header */}
        {loading ? <DashboardHeaderSkeleton /> : (
        <div className="dashboard-header neumorphic-card mb-4">
          <Row className="align-items-center">
            <Col>
              <div className="user-info">
                <div className="user-avatar">
                  <i className="fas fa-user-circle" style={{ fontSize: '2.5rem', color: '#0d6efd' }}></i>
                </div>
                <div className="user-details">
                  <h1 className="dashboard-title">
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                  </h1>
                  <p className="user-welcome">Welcome back, {user.email}!</p>
                  <div className="tenant-info">
                    <Badge bg="secondary" className="tenant-badge">
                      <i className="fas fa-building me-1"></i>
                      {tenantId}
                    </Badge>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs="auto">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="user-menu-btn">
                  <i className="fas fa-cog me-1"></i>
                  Settings
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={handleShowMyLogs}>
                    <i className="fas fa-history me-2"></i>
                    View My Activity
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </div>
        )}

        {error && (
          <Alert variant="danger" className="dashboard-alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        <Row>
          <Col lg={12}>
            <div className="entities-section neumorphic-card">
              {/* Section Header */}
              <div className="section-header">
                <div className="section-title">
                  <h2>
                    <i className="fas fa-cube me-2"></i>
                    My Entities
                  </h2>
                  <p className="section-subtitle">Manage your entities and view activity</p>
                </div>
                
                <div className="section-actions">
                  <ButtonGroup className="me-2">
                    <Button 
                      variant={isRealtimeActive ? 'success' : 'outline-secondary'}
                      onClick={toggleRealtime}
                      title={isRealtimeActive ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                      className="realtime-btn"
                    >
                      <i className={`fas ${isRealtimeActive ? 'fa-sync-alt' : 'fa-pause'} me-1`}></i>
                      {isRealtimeActive ? 'Live' : 'Paused'}
                    </Button>
                  </ButtonGroup>
                  
                  <ButtonGroup>
                    <Button 
                      variant="outline-info" 
                      onClick={handleShowMyLogs}
                      title="View My Activity Logs"
                    >
                      <i className="fas fa-chart-line me-1"></i>
                      Activity
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleCreate}
                      title="Create New Entity"
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Entity
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
              
              {/* Filters Section */}
              <div className="filters-section">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="filter-label">
                        <i className="fas fa-search me-1"></i>
                        Search Entities
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search by name, type, or attributes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="neumorphic-input"
                      />
                    </Form.Group>
                  </Col>
                  
                  {categories.length > 0 && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="filter-label">
                          <i className="fas fa-filter me-1"></i>
                          Filter by Category
                        </Form.Label>
                        <Form.Select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="neumorphic-input"
                        >
                          <option value="">All Categories</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.display_name || category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              </div>

              {/* Entities Content */}
              <div className="entities-content">
{loading ? (
                <EntityListSkeleton />
              ) : (
                <>
                  <EntityList
                    entities={entities}
                    onEdit={handleEdit}
                    onView={handleView}
                    onDelete={handleDeleteEntity}
                    onShowLogs={handleShowLogs}
                    tenantId={tenantId}
                    currentUser={user}
                  />
                  
                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="pagination-section">
                      <div className="pagination-controls">
                        <Button
                          onClick={() => loadEntities(currentPage - 1)}
                          disabled={currentPage <= 1}
                          variant="outline-secondary"
                          className="pagination-btn"
                        >
                          <i className="fas fa-chevron-left me-1"></i>
                          Previous
                        </Button>
                        
                        <div className="pagination-info">
                          <span className="current-page">{currentPage}</span>
                          <span className="page-separator">of</span>
                          <span className="total-pages">{pagination.totalPages}</span>
                        </div>
                        
                        <Button
                          onClick={() => loadEntities(currentPage + 1)}
                          disabled={currentPage >= pagination.totalPages}
                          variant="outline-secondary"
                          className="pagination-btn"
                        >
                          Next
                          <i className="fas fa-chevron-right ms-1"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          </Col>

        {/* Entity Modal */}
        <EntityModal
          show={showEntityModal}
          onHide={handleModalClose}
          entity={selectedEntity}
          tenantId={tenantId}
          mode={modalMode}
          onSubmit={modalMode === 'edit' ? handleUpdateEntity : handleCreateEntity}
        />
        </Row>
        
        {/* Enhanced Logs Viewer Modal */}
        <LogsViewer
          show={showLogs}
          onHide={() => setShowLogs(false)}
          entityId={selectedEntityForLogs}
          title={selectedEntityForLogs ? "Entity Activity Logs" : "My Activity Dashboard"}
        />
      </Container>
    </div>
  );
};

export default Dashboard;
