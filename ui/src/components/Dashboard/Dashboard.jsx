import { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI } from '../../services/api';
import EntityList from './EntityList';
import EntityForm from './EntityForm';
import { useRealtime } from '../../hooks/useRealtime';

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
        response = await entitiesAPI.getMyEntities(tenantId, page);
      }
      
      setEntities(response.data.entities || response.data);
      setPagination(response.data.pagination);
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
    <div className="main-layout">
      <header className="neumorphic-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user.email}!</p>
            <p style={{ fontSize: '0.8em', color: '#666' }}>Tenant: {tenantId}</p>
          </div>
          <button onClick={handleLogout} className="neumorphic-button">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="grid grid-2">
        <div>
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="neumorphic-card" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Filter by Category
              </label>
              <select
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
              </select>
            </div>
          )}
          
          <div className="neumorphic-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>My Entities</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={toggleRealtime}
                  className={`neumorphic-button ${isRealtimeActive ? 'active' : ''}`}
                  title={isRealtimeActive ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                >
                  {isRealtimeActive ? '🔄 Live' : '⏸️ Paused'}
                </button>
                <button 
                  onClick={() => setShowForm(true)} 
                  className="neumorphic-button"
                >
                  Add Entity
                </button>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neumorphic-input"
              style={{ marginBottom: '20px' }}
            />

            {loading ? (
              <div className="loading-spinner"></div>
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
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={() => loadEntities(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="neumorphic-button"
                    >
                      Previous
                    </button>
                    <span style={{ padding: '10px', color: '#666' }}>
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => loadEntities(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                      className="neumorphic-button"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          {showForm && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

export default Dashboard;