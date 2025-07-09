import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Image, Carousel } from 'react-bootstrap';
import { entitiesAPI, mediaAPI, categoriesAPI } from '../services/api';
import { DetailsSkeleton } from '../components/UI/Skeleton';
import RequestAttributeButton from '../components/RequestAttributeButton';
import './EntityDetailsPage.css';

const EntityDetailsPage = () => {
  const { entityId, tenantId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntityData();
    loadCurrentUser();
  }, [entityId, tenantId]);

  const loadCurrentUser = () => {
    // Get current user from localStorage or context
    // This is a simplified version - in a real app you'd use proper auth context
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');
    if (token && userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        console.warn('Failed to parse user data:', err);
      }
    }
  };

  const loadEntityData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch entity data
      let entityResponse;
      if (tenantId) {
        // Tenant-specific entity
        entityResponse = await entitiesAPI.getById(entityId, tenantId);
      } else {
        // Try to fetch without tenant context (public entity)
        entityResponse = await entitiesAPI.getById(entityId, null);
      }

      if (entityResponse.data) {
        setEntity(entityResponse.data);

        // Fetch entity images
        try {
          const imagesResponse = await mediaAPI.getEntityImages(
            entityId, 
            tenantId || entityResponse.data.tenant_id
          );
          if (imagesResponse.data?.images) {
            setImages(imagesResponse.data.images);
          }
        } catch (err) {
          console.warn('Failed to load images:', err);
        }

        // Fetch category details if available
        if (entityResponse.data.entity_type && (tenantId || entityResponse.data.tenant_id)) {
          try {
            const categoriesResponse = await categoriesAPI.getAll(
              tenantId || entityResponse.data.tenant_id
            );
            const entityCategory = categoriesResponse.data.categories?.find(
              cat => cat.name === entityResponse.data.entity_type
            );
            if (entityCategory) {
              setCategory(entityCategory);
            }
          } catch (err) {
            console.warn('Failed to load category:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error loading entity:', err);
      setError(err.response?.data?.error || 'Failed to load entity details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToListing = () => {
    if (tenantId) {
      navigate(`/tenant/${tenantId}/listing`);
    } else {
      navigate('/listing');
    }
  };

  const formatAttributeValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return value || 'N/A';
  };

  const formatAttributeKey = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Container className="entity-details-page py-5">
        <DetailsSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="entity-details-page py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger" className="text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h5>Entity Not Found</h5>
              <p>{error}</p>
              <Button variant="outline-primary" onClick={handleBackToListing}>
                <i className="fas fa-arrow-left me-2"></i>
                Back to Listing
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!entity) {
    return (
      <Container className="entity-details-page py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="warning" className="text-center">
              <i className="fas fa-search fa-2x mb-3"></i>
              <h5>Entity Not Found</h5>
              <p>The entity you're looking for doesn't exist or is not publicly available.</p>
              <Button variant="outline-primary" onClick={handleBackToListing}>
                <i className="fas fa-arrow-left me-2"></i>
                Back to Listing
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Filter out basic info from attributes to show separately
  const basicAttributes = ['name', 'description'];
  
  // Get all possible attributes from category schema if available
  const allPossibleAttributes = category?.base_schema ? Object.keys(category.base_schema) : [];
  const entityAttributeKeys = Object.keys(entity.attributes || {});
  const allAttributeKeys = [...new Set([...entityAttributeKeys, ...allPossibleAttributes])]
    .filter(key => !basicAttributes.includes(key));
  
  // Create full attributes list with empty values for missing ones
  const allAttributes = allAttributeKeys.map(key => {
    const value = entity.attributes?.[key];
    const isEmpty = value === null || value === undefined || value === '';
    return [key, value, isEmpty];
  });

  return (
    <div className="entity-details-page">
      <div className="entity-details-container">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center justify-content-between">
              <Button 
                variant="outline-secondary" 
                onClick={handleBackToListing}
                className="back-btn"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Listing
              </Button>
              <div className="entity-meta">
                {entity.public_shareable && (
                  <Badge bg="success" className="me-2">
                    <i className="fas fa-globe me-1"></i>
                    Public
                  </Badge>
                )}
                {category && (
                  <Badge bg="primary">
                    <i className="fas fa-tag me-1"></i>
                    {category.display_name || category.name}
                  </Badge>
                )}
              </div>
            </div>
          </Col>
        </Row>

      <Row>
        {/* Main Content */}
        <Col lg={8}>
          {/* Entity Header */}
          <Card className="entity-header-card mb-4">
            <Card.Body>
              <div className="entity-title-section">
                <h1 className="entity-title">
                  {entity.attributes?.name || 'Untitled Entity'}
                </h1>
                {entity.attributes?.description && (
                  <p className="entity-description text-muted">
                    {entity.attributes.description}
                  </p>
                )}
              </div>
              
              <div className="entity-info mt-3">
                <small className="text-muted">
                  <i className="fas fa-calendar me-1"></i>
                  Created: {new Date(entity.created_at).toLocaleDateString()}
                  {entity.updated_at !== entity.created_at && (
                    <>
                      {' • '}
                      <i className="fas fa-edit me-1"></i>
                      Updated: {new Date(entity.updated_at).toLocaleDateString()}
                    </>
                  )}
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* Images */}
          {images.length > 0 && (
            <Card className="entity-images-card mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-images me-2"></i>
                  Images ({images.length})
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {images.length === 1 ? (
                  <div className="single-image-container">
                    <Image
                      src={images[0].url}
                      alt={entity.attributes?.name || 'Entity image'}
                      className="single-entity-image"
                      fluid
                    />
                    {images[0].label && (
                      <div className="image-label">
                        {images[0].label}
                      </div>
                    )}
                  </div>
                ) : (
                  <Carousel interval={null} className="entity-image-carousel">
                    {images.map((image, index) => (
                      <Carousel.Item key={image.id || index}>
                        <div className="carousel-image-container">
                          <Image
                            src={image.url}
                            alt={`${entity.attributes?.name || 'Entity'} - Image ${index + 1}`}
                            className="carousel-entity-image"
                            fluid
                          />
                        </div>
                        {image.label && (
                          <Carousel.Caption>
                            <p>{image.label}</p>
                          </Carousel.Caption>
                        )}
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Additional Attributes */}
          {allAttributes.length > 0 && (
            <Card className="entity-attributes-card">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-list-ul me-2"></i>
                  Details
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {allAttributes.map(([key, value, isEmpty]) => (
                    <Col md={6} key={key} className="mb-3">
                      <div className="attribute-item">
                        <label className="attribute-label">
                          {formatAttributeKey(key)}
                        </label>
                        <div className="attribute-value-container">
                          <div className="attribute-value">
                            {isEmpty ? (
                              <span className="text-muted font-italic">No information available</span>
                            ) : (
                              formatAttributeValue(value)
                            )}
                          </div>
                          {isEmpty && (
                            <div className="mt-2">
                              <RequestAttributeButton
                                attributeName={key}
                                entityId={entityId}
                                currentUser={currentUser}
                                entityOwner={entity.user_id}
                                tenantId={tenantId || entity.tenant_id}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <div className="entity-sidebar">
            {/* Entity Info Card */}
            <Card className="entity-info-card mb-4">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Entity Information
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="info-item mb-3">
                  <label className="info-label">Type</label>
                  <div className="info-value">
                    {category?.display_name || entity.entity_type || 'Unknown'}
                  </div>
                </div>

                <div className="info-item mb-3">
                  <label className="info-label">Entity ID</label>
                  <div className="info-value">
                    <code>{entity.id}</code>
                  </div>
                </div>

                {category?.description && (
                  <div className="info-item mb-3">
                    <label className="info-label">Category Description</label>
                    <div className="info-value text-muted">
                      {category.description}
                    </div>
                  </div>
                )}

                <div className="info-item">
                  <label className="info-label">Visibility</label>
                  <div className="info-value">
                    {entity.public_shareable ? (
                      <Badge bg="success">
                        <i className="fas fa-globe me-1"></i>
                        Public
                      </Badge>
                    ) : (
                      <Badge bg="secondary">
                        <i className="fas fa-lock me-1"></i>
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Actions Card */}
            <Card className="entity-actions-card">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-tools me-2"></i>
                  Actions
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={handleBackToListing}
                  >
                    <i className="fas fa-list me-2"></i>
                    View All Entities
                  </Button>
                  
                  {tenantId && (
                    <Button 
                      variant="outline-secondary"
                      as={Link}
                      to={`/tenant/${tenantId}/listing`}
                    >
                      <i className="fas fa-building me-2"></i>
                      Browse Tenant
                    </Button>
                  )}

                  <Button
                    variant="outline-info"
                    onClick={() => window.location.reload()}
                  >
                    <i className="fas fa-sync me-2"></i>
                    Refresh
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
      </div>
    </div>
  );
};

export default EntityDetailsPage;
