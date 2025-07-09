import React from 'react';
import { Card, Button, Carousel, Badge } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import './ListingCard.css';

const ListingCard = ({ entity }) => {
  const { tenantId } = useParams();
  const hasImages = entity.images && entity.images.length > 0;

  // Generate the correct link path based on whether we're in a tenant context
  const getEntityLink = () => {
    if (tenantId) {
      return `/tenant/${tenantId}/entity/${entity.id}`;
    }
    return `/entity/${entity.id}`;
  };

  return (
    <div className="listing-card neumorphic-card">
      {/* Image Section */}
      <div className="card-image-section">
        {hasImages ? (
          <Carousel interval={null} indicators={false} controls={entity.images.length > 1} className="card-carousel">
            {entity.images.map((image, idx) => (
              <Carousel.Item key={idx}>
                <div className="image-container">
                  <img 
                    src={image.url}
                    alt={entity.attributes.name || 'Entity Image'}
                    className="card-image"
                  />
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="no-image-placeholder">
            <i className="fas fa-image fa-2x text-muted"></i>
            <span className="text-muted">No Image</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="card-content">
        <div className="card-header-section">
          <h5 className="card-title">{entity.attributes.name || 'Unnamed Entity'}</h5>
          <div className="card-type">
            <Badge bg="info" className="type-badge">
              <i className="fas fa-tag me-1"></i>
              {entity.entity_type || 'N/A'}
            </Badge>
          </div>
        </div>
        
        <p className="card-description">
          {entity.attributes.description || 'No description provided.'}
        </p>

        {/* Attributes Preview */}
        <div className="attributes-preview">
          <h6 className="attributes-title">Key Attributes:</h6>
          <div className="attributes-list">
            {Object.entries(entity.attributes || {})
              .filter(([key]) => key !== 'name' && key !== 'description')
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key} className="attribute-item">
                  <span className="attribute-key">{key}:</span>
                  <span className="attribute-value">{String(value)}</span>
                </div>
              ))}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="card-actions">
          <Button 
            as={Link} 
            to={getEntityLink()} 
            className="view-details-btn neumorphic-button"
          >
            <i className="fas fa-eye me-2"></i>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;