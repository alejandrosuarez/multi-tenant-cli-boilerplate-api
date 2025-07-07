import { useState, useEffect } from 'react';
import { mediaAPI } from '../../services/api';

const EntityList = ({ entities, onEdit, onDelete, tenantId }) => {
  const [entityImages, setEntityImages] = useState({});

  useEffect(() => {
    // Load images for entities that have them
    entities.forEach(async (entity) => {
      if (entity.id && !entityImages[entity.id]) {
        try {
          const response = await mediaAPI.getEntityImages(entity.id, tenantId, 'small');
          if (response.data.images && response.data.images.length > 0) {
            setEntityImages(prev => ({
              ...prev,
              [entity.id]: response.data.images[0] // Use first image
            }));
          }
        } catch (err) {
          // Ignore errors for images
        }
      }
    });
  }, [entities, tenantId]);

  if (entities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No entities found</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {entities.map((entity) => (
        <div key={entity.id} className="neumorphic-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '10px' }}>{entity.name || 'Unnamed Entity'}</h3>
              
              {entity.entity_type && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ 
                    background: '#e0e5ec', 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8em',
                    color: '#666',
                    boxShadow: 'inset 2px 2px 4px #c8ccd1, inset -2px -2px 4px #f0f5fa'
                  }}>
                    {entity.entity_type}
                  </span>
                </div>
              )}
              
              {entity.description && (
                <p style={{ color: '#666', marginBottom: '10px' }}>{entity.description}</p>
              )}
              
              {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Attributes:</strong>
                  <div style={{ marginTop: '5px' }}>
                    {Object.entries(entity.attributes).map(([key, value]) => (
                      <div key={key} style={{ fontSize: '0.9em', color: '#666' }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {entityImages[entity.id] && (
                <div style={{ marginBottom: '10px' }}>
                  <img
                    src={entityImages[entity.id].url}
                    alt={entity.name}
                    style={{
                      maxWidth: '100px',
                      maxHeight: '100px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      boxShadow: '4px 4px 8px #c2c8d0, -4px -4px 8px #ffffff'
                    }}
                  />
                </div>
              )}

              <div style={{ fontSize: '0.8em', color: '#999' }}>
                Created: {new Date(entity.created_at).toLocaleDateString()}
                {entity.updated_at !== entity.created_at && (
                  <span> • Updated: {new Date(entity.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
              <button
                onClick={() => onEdit(entity)}
                className="neumorphic-button"
                style={{ padding: '8px 12px', fontSize: '0.9em' }}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(entity.id)}
                className="neumorphic-button"
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '0.9em',
                  background: '#f8d7da',
                  color: '#721c24'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EntityList;