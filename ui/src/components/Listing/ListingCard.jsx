import React, { useState } from 'react';

const ListingCard = ({ entity }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasImages = entity.images && entity.images.length > 0;

  const handleNextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % entity.images.length);
    }
  };

  const handlePrevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex - 1 + entity.images.length) % entity.images.length
      );
    }
  };

  return (
    <div className="neumorphic-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {hasImages ? (
        <div style={{ position: 'relative', width: '100%', paddingTop: '75%', overflow: 'hidden', borderRadius: '10px', marginBottom: '10px' }}>
          <img
            src={entity.images[currentImageIndex].url}
            alt={entity.name || 'Entity Image'}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {entity.images.length > 1 && (
            <div style={{ position: 'absolute', top: '50%', width: '100%', display: 'flex', justifyContent: 'space-between', transform: 'translateY(-50%)', padding: '0 10px' }}>
              <button onClick={handlePrevImage} className="neumorphic-button" style={{ padding: '5px 10px' }}>
                &lt;
              </button>
              <button onClick={handleNextImage} className="neumorphic-button" style={{ padding: '5px 10px' }}>
                &gt;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', paddingTop: '75%', background: '#ccc', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          No Image
        </div>
      )}

      <h3 style={{ marginBottom: '10px' }}>{entity.name || 'Unnamed Entity'}</h3>
      <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
        Type: {entity.entity_type || 'N/A'}
      </p>
      <p style={{ fontSize: '0.9em', marginBottom: '15px', flexGrow: 1 }}>
        {entity.description || 'No description provided.'}
      </p>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: '10px', marginTop: 'auto' }}>
        <h4 style={{ marginBottom: '5px' }}>Attributes:</h4>
        {Object.entries(entity.attributes || {}).map(([key, value]) => (
          <p key={key} style={{ fontSize: '0.8em', color: '#555' }}>
            <strong>{key}:</strong> {String(value)}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ListingCard;