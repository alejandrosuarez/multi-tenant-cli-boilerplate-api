import { useState, useEffect } from 'react';
import { mediaAPI } from '../../services/api';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';

const EntityList = ({ entities, onEdit, onDelete, tenantId }) => {
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
      <div className="text-center py-5 text-muted">
        <p>No entities found</p>
      </div>
    );
  }

  return (
    <Row xs={1} md={2} lg={3} className="g-4">
      {entities.map((entity) => (
        <Col key={entity.id} className="d-flex">
          <Card className="shadow-sm w-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="flex-grow-1">
                  <Card.Title className="mb-2">{entity.attributes.name || 'Unnamed Entity'}</Card.Title>
                  
                  {entity.entity_type && (
                    <div className="mb-2">
                      <Badge bg="info">{entity.entity_type}</Badge>
                    </div>
                  )}
                  
                  {entity.attributes.description && (
                    <Card.Text className="text-muted mb-2">{entity.attributes.description}</Card.Text>
                  )}
                  
                  {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                    <div className="mb-2">
                      <h6 className="mb-1">Attributes:</h6>
                      {Object.entries(entity.attributes).map(([key, value]) => (
                        <p key={key} className="text-muted small mb-0">
                          <strong>{key}:</strong> {String(value)}
                        </p>
                      ))}
                    </div>
                  )}

                  {loadingImages[entity.id] ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : entityImages[entity.id] ? (
                    <div className="mb-2">
                      <Card.Img 
                        variant="top" 
                        src={entityImages[entity.id].url}
                        alt={entity.name}
                        style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                        className="rounded shadow-sm"
                      />
                    </div>
                  ) : null}

                  <Card.Text className="text-muted small mt-auto">
                    Created: {new Date(entity.created_at).toLocaleDateString()}
                    {entity.updated_at !== entity.created_at && (
                      <span> • Updated: {new Date(entity.updated_at).toLocaleDateString()}</span>
                    )}
                  </Card.Text>
                </div>

                <div className="d-flex flex-column gap-2 ms-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onEdit(entity)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(entity.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default EntityList;