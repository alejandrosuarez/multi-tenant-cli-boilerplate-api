import { useState, useEffect } from 'react';
import { mediaAPI } from '../../services/api';
import { Card, Button, Row, Col, Badge, Spinner, Image } from 'react-bootstrap';
import RequestAttributeButton from '../RequestAttributeButton';

const EntityList = ({ entities, onEdit, onView, onDelete, tenantId, onShowLogs, currentUser }) => {
  const [entityImages, setEntityImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

  useEffect(() => {
    const loadImagesForEntities = async () => {
      const newLoadingImages = {};
      for (const entity of entities) {
        if (entity.id && !entityImages[entity.id]) {
          newLoadingImages[entity.id] = true;
        }
      }
      setLoadingImages(newLoadingImages);

      for (const entity of entities) {
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
            console.error(`Failed to load image for entity ${entity.id}:`, err);
          } finally {
            setLoadingImages(prev => ({ ...prev, [entity.id]: false }));
          }
        }
      }
    };

    loadImagesForEntities();
  }, [entities, tenantId]);

  if (entities.length === 0) {
    return (
      <div className="entity-list-empty">
        <div className="neumorphic-card p-5 text-center">
          <div className="mb-3">
            <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
          </div>
          <h5 className="text-muted mb-2">No entities found</h5>
          <p className="text-muted small">Start by creating your first entity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entity-list-container">
      <Row xs={1} md={2} lg={3} className="g-4">
        {entities.map((entity) => (
          <Col key={entity.id} className="d-flex">
            <div className="entity-card neumorphic-card h-100 w-100">
              {/* Header with image and main info */}
              <div className="entity-card-header">
                <div className="entity-image-container">
                  {loadingImages[entity.id] ? (
                    <div className="image-placeholder">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : entityImages[entity.id] ? (
                    <Image 
                      src={entityImages[entity.id].url}
                      alt={entity.attributes.name || 'Entity'}
                      className="entity-image"
                      fluid
                      rounded
                    />
                  ) : (
                    <div className="image-placeholder">
                      <i className="fas fa-image" style={{ fontSize: '1.5rem', color: '#6c757d' }}></i>
                    </div>
                  )}
                </div>
                
                <div className="entity-main-info">
                  <div className="entity-title-row">
                    <h5 className="entity-title">{entity.attributes.name || 'Unnamed Entity'}</h5>
                    {entity.entity_type && (
                      <Badge bg="primary" pill className="entity-type-badge">
                        {entity.entity_type}
                      </Badge>
                    )}
                  </div>
                  
                  {entity.attributes.description && (
                    <p className="entity-description">{entity.attributes.description}</p>
                  )}
                </div>
              </div>

              {/* Attributes section */}
              {entity.attributes && Object.keys(entity.attributes).filter(key => key !== 'name' && key !== 'description').length > 0 && (
                <div className="entity-attributes">
                  <h6 className="attributes-title">
                    <i className="fas fa-list-ul me-2"></i>
                    Additional Details
                  </h6>
                  <div className="attributes-grid">
                    {Object.entries(entity.attributes)
                      .filter(([key]) => key !== 'name' && key !== 'description')
                      .slice(0, 4) // Limit to first 4 attributes to prevent overflow
                      .map(([key, value]) => {
                        const isEmpty = !value || value === '';
                        return (
                          <div key={key} className="attribute-item">
                            <span className="attribute-key">
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            </span>
                            <div className="attribute-value-section">
                              <span className="attribute-value" title={String(value)}>
                                {isEmpty ? (
                                  <span className="text-muted font-italic">No info</span>
                                ) : (
                                  String(value)
                                )}
                              </span>
                              {isEmpty && (
                                <div className="mt-1">
                                  <RequestAttributeButton
                                    attributeName={key}
                                    entityId={entity.id}
                                    currentUser={currentUser}
                                    entityOwner={entity.user_id}
                                    tenantId={tenantId || entity.tenant_id}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {Object.keys(entity.attributes).filter(key => key !== 'name' && key !== 'description').length > 4 && (
                      <div className="attribute-item more-attributes">
                        <span className="attribute-key text-muted">
                          <i className="fas fa-ellipsis-h me-1"></i>
                          More
                        </span>
                        <span className="attribute-value text-muted">
                          +{Object.keys(entity.attributes).filter(key => key !== 'name' && key !== 'description').length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer with metadata and actions */}
              <div className="entity-card-footer">
                <div className="entity-metadata">
                  <small className="text-muted">
                    <i className="fas fa-calendar-plus me-1"></i>
                    Created: {new Date(entity.created_at).toLocaleDateString()}
                  </small>
                  {entity.updated_at !== entity.created_at && (
                    <small className="text-muted">
                      <i className="fas fa-calendar-edit me-1"></i>
                      Updated: {new Date(entity.updated_at).toLocaleDateString()}
                    </small>
                  )}
                </div>
                
                <div className="entity-actions">
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="action-btn"
                    onClick={() => onShowLogs?.(entity.id)}
                    title="View Activity Logs"
                  >
                    <i className="fas fa-chart-line"></i>
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="action-btn"
                    onClick={() => onView?.(entity)}
                    title="Quick View"
                  >
                    <i className="fas fa-eye"></i>
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="action-btn"
                    onClick={() => onEdit(entity)}
                    title="Edit Entity"
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="action-btn"
                    onClick={() => onDelete(entity.id)}
                    title="Delete Entity"
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default EntityList;
