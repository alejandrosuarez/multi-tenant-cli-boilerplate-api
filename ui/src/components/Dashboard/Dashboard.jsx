import { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI } from '../../services/api';
import EntityList from './EntityList';
import EntityForm from './EntityForm';
import { useRealtime } from '../../hooks/useRealtime';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';

const Dashboard = ({ user, onLogout }) => {
  const [entities, setEntities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

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

  const handleCreateEntity = async (entityData) => {
    console.log('handleCreateEntity called', entityData);
    try {
      await entitiesAPI.create(entityData, tenantId);
      console.log('Entity created successfully, setting showForm to false');
      setShowForm(false);
      loadEntities();
    } catch (err) {
      setError('Failed to create entity');
      console.error('Create entity error:', err);
    }
  };

  const handleUpdateEntity = async (entityData) => {
    console.log('handleUpdateEntity called', entityData);
    try {
      await entitiesAPI.update(editingEntity.id, entityData, tenantId);
      console.log('Entity updated successfully, setting showForm to false');
      setShowForm(false);
      setEditingEntity(null);
      loadEntities();
    } catch (err) {
      setError('Failed to update entity');
      console.error('Update entity error:', err);
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
    setEditingEntity(entity);
    setShowForm(true);
  };

  const handleLogout = () => {
    console.log('handleLogout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <Container className="main-layout py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h1 className="mb-1">Dashboard</h1>
              <p className="text-muted mb-0">Welcome back, {user.email}!</p>
              <p className="text-muted small mb-0">Tenant: {tenantId}</p>
            </Col>
            <Col xs="auto">
              <Button variant="outline-secondary" onClick={handleLogout}>
                Logout
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={showForm ? 6 : 12}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              {categories.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Filter by Category</Form.Label>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.display_name || category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>My Entities</h2>
                <div className="d-flex gap-2">
                  <Button 
                    variant={isRealtimeActive ? 'primary' : 'outline-secondary'}
                    onClick={toggleRealtime}
                    title={isRealtimeActive ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                  >
                    {isRealtimeActive ? '🔄 Live' : '⏸️ Paused'}
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowForm(true)} 
                  >
                    Add Entity
                  </Button>
                </div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Form.Group>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : (
                <>
                  <EntityList
                    entities={entities}
                    onEdit={handleEdit}
                    onDelete={handleDeleteEntity}
                    tenantId={tenantId}
                  />
                  
                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 mt-3">
                      <Button
                        onClick={() => loadEntities(currentPage - 1)}
                        disabled={currentPage <= 1}
                        variant="outline-secondary"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center text-muted small">
                        Page {currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        onClick={() => loadEntities(currentPage + 1)}
                        disabled={currentPage >= pagination.totalPages}
                        variant="outline-secondary"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {showForm && (
          <Col lg={6}>
            <EntityForm
              entity={editingEntity}
              tenantId={tenantId}
              onSubmit={editingEntity ? handleUpdateEntity : handleCreateEntity}
              onCancel={() => {
                console.log('EntityForm onCancel called, setting showForm to false');
                setShowForm(false);
                setEditingEntity(null);
              }}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Dashboard;