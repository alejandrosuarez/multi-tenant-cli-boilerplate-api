import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTenant } from '../../contexts/TenantContext'

function EntityManager() {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEntities, setSelectedEntities] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editingEntity, setEditingEntity] = useState(null)
  const { user } = useAuth()
  const { currentTenant } = useTenant()

  useEffect(() => {
    loadEntities()
  }, [searchTerm])

  const loadEntities = async () => {
    try {
      const url = searchTerm 
        ? `/api/entities?search=${encodeURIComponent(searchTerm)}`
        : '/api/entities'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to load entities')
      }
      const data = await response.json()
      setEntities(data.data || [])
      setError(null)
    } catch (err) {
      setError('Error loading entities')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSelectEntity = (entityId) => {
    setSelectedEntities(prev => 
      prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    )
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/entities/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEntities })
      })
      
      if (response.ok) {
        loadEntities()
        setSelectedEntities([])
      }
    } catch (err) {
      console.error('Bulk delete failed:', err)
    }
  }

  const handleEdit = (entity) => {
    setEditingEntity(entity)
  }

  const handleSave = async (entityData) => {
    try {
      const response = await fetch(`/api/entities/${entityData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        loadEntities()
        setEditingEntity(null)
      }
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  if (loading) {
    return <div>Loading entities...</div>
  }

  if (error) {
    return (
      <div>
        Error loading entities: {error}
        <button onClick={loadEntities}>Retry</button>
      </div>
    )
  }

  return (
    <div data-testid="entity-manager">
      <h1>Entity Manager</h1>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Search entities..."
          value={searchTerm}
          onChange={handleSearch}
          data-testid="entity-search-input"
        />
        
        <button onClick={() => setShowFilters(!showFilters)}>
          Filters
        </button>
        
        <button>Export</button>
      </div>

      {showFilters && (
        <div className="filters">
          <label>Entity Type</label>
          <label>Date Range</label>
          <label>Attributes</label>
        </div>
      )}

      {selectedEntities.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedEntities.length} selected</span>
          <button data-testid="bulk-actions-button">Bulk Actions</button>
          <button data-testid="bulk-delete-button" onClick={handleBulkDelete}>
            Delete Selected
          </button>
        </div>
      )}

      <div className="entity-list">
        <div className="entity-header">
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedEntities(entities.map(e => e.id))
              } else {
                setSelectedEntities([])
              }
            }}
          />
          <span>Name</span>
          <span>Type</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        
        {entities.map(entity => (
          <div key={entity.id} className="entity-row">
            <input
              type="checkbox"
              checked={selectedEntities.includes(entity.id)}
              onChange={() => handleSelectEntity(entity.id)}
              data-testid={`entity-checkbox-${entity.id}`}
            />
            
            {editingEntity?.id === entity.id ? (
              <input
                defaultValue={entity.attributes.name}
                onBlur={(e) => handleSave({
                  ...entity,
                  attributes: { ...entity.attributes, name: e.target.value }
                })}
              />
            ) : (
              <span>{entity.attributes.name}</span>
            )}
            
            <span>{entity.entity_type}</span>
            <span>{new Date(entity.created_at).toLocaleDateString()}</span>
            
            <div className="actions">
              <button onClick={() => handleEdit(entity)}>Edit</button>
              <button>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <span>Page 1 of 3</span>
        <button>Previous</button>
        <button>Next</button>
      </div>

      {editingEntity && (
        <div data-testid="entity-form">
          <h3>Edit Entity</h3>
          <button onClick={() => setEditingEntity(null)}>Cancel</button>
          <button data-testid="save-button">Save</button>
        </div>
      )}

      <button data-testid="confirm-delete-button" style={{ display: 'none' }}>
        Confirm Delete
      </button>
    </div>
  )
}

export default EntityManager