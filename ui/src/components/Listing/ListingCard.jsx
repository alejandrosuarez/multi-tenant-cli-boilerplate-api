import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TouchButton from '../UI/TouchButton';
import SwipeableCard from '../UI/SwipeableCard';
import './ListingCard.css';

const ListingCard = ({ entity }) => {
  const { tenantId } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasImages = entity.images && entity.images.length > 0;

  // Generate the correct link path based on whether we're in a tenant context
  const getEntityLink = () => {
    if (tenantId) {
      return `/tenant/${tenantId}/entity/${entity.id}`;
    }
    return `/entity/${entity.id}`;
  };

  const nextImage = () => {
    if (hasImages && entity.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % entity.images.length);
    }
  };

  const prevImage = () => {
    if (hasImages && entity.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + entity.images.length) % entity.images.length);
    }
  };

  const handleSwipeLeft = () => {
    nextImage();
  };

  const handleSwipeRight = () => {
    prevImage();
  };

  return (
    <SwipeableCard
      className="listing-card"
      onSwipeLeft={hasImages && entity.images.length > 1 ? handleSwipeLeft : null}
      onSwipeRight={hasImages && entity.images.length > 1 ? handleSwipeRight : null}
    >
      {/* Image Section */}
      <div className="card-image-section">
        {hasImages ? (
          <div className="image-carousel">
            <div className="image-container">
              <img 
                src={entity.images[currentImageIndex].url}
                alt={entity.attributes?.name || 'Entity Image'}
                className="card-image"
                loading="lazy"
              />
              
              {/* Image Navigation */}
              {entity.images.length > 1 && (
                <>
                  <TouchButton
                    onClick={prevImage}
                    className="image-nav-btn image-nav-prev"
                    variant="ghost"
                    size="small"
                    icon="fas fa-chevron-left"
                  />
                  <TouchButton
                    onClick={nextImage}
                    className="image-nav-btn image-nav-next"
                    variant="ghost"
                    size="small"
                    icon="fas fa-chevron-right"
                  />
                  
                  {/* Image Indicators */}
                  <div className="image-indicators">
                    {entity.images.map((_, idx) => (
                      <button
                        key={idx}
                        className={`image-indicator ${idx === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        aria-label={`View image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="no-image-placeholder">
            <i className="fas fa-image"></i>
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="card-content">
        <div className="card-header-section">
          <h3 className="card-title">{entity.attributes?.name || 'Unnamed Entity'}</h3>
          <div className="card-type">
            <span className="type-badge">
              <i className="fas fa-tag"></i>
              {entity.entity_type || 'N/A'}
            </span>
          </div>
        </div>
        
        <p className="card-description">
          {entity.attributes?.description || 'No description provided.'}
        </p>

        {/* Attributes Preview */}
        {entity.attributes && Object.keys(entity.attributes).length > 2 && (
          <div className="attributes-preview">
            <h4 className="attributes-title">Key Details</h4>
            <div className="attributes-list">
              {Object.entries(entity.attributes)
                .filter(([key]) => key !== 'name' && key !== 'description')
                .slice(0, 3)
                .map(([key, value]) => (
                  <div key={key} className="attribute-item">
                    <span className="attribute-key">{key.replace(/_/g, ' ')}</span>
                    <span className="attribute-value">{String(value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <div className="card-actions">
          <Link to={getEntityLink()} className="view-details-btn-link">
            <TouchButton 
              variant="primary"
              icon="fas fa-eye"
              className="view-details-btn"
            >
              View Details
            </TouchButton>
          </Link>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ListingCard;