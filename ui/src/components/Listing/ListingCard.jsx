import React, { useState } from 'react';
import { Card, Button, Carousel, Badge } from 'react-bootstrap';

const ListingCard = ({ entity }) => {
  const hasImages = entity.images && entity.images.length > 0;

  return (
    <Card className="shadow-sm h-100 d-flex flex-column">
      {hasImages ? (
        <Carousel interval={null} indicators={false} controls={entity.images.length > 1}>
          {entity.images.map((image, idx) => (
            <Carousel.Item key={idx}>
              <Card.Img 
                variant="top" 
                src={image.url}
                alt={entity.name || 'Entity Image'}
                style={{ height: '200px', objectFit: 'cover' }}
              />
            </Carousel.Item>
          ))}
        </Carousel>
      ) : (
        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
          <span className="text-muted">No Image</span>
        </div>
      )}

      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-2">{entity.name || 'Unnamed Entity'}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Type: <Badge bg="info">{entity.entity_type || 'N/A'}</Badge>
        </Card.Subtitle>
        <Card.Text className="mb-3 flex-grow-1">
          {entity.description || 'No description provided.'}
        </Card.Text>

        <div className="mt-auto pt-3 border-top">
          <h6 className="mb-2">Attributes:</h6>
          {Object.entries(entity.attributes || {}).map(([key, value]) => (
            <p key={key} className="text-muted small mb-1">
              <strong>{key}:</strong> {String(value)}
            </p>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ListingCard;