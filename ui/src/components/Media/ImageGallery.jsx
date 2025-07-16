import React, { useState, useEffect } from 'react';
import './ImageGallery.css';

const ImageGallery = ({ 
  mediaFiles, 
  selectedFiles, 
  onSelectionChange, 
  onDelete,
  entities 
}) => {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showMetadata, setShowMetadata] = useState(false);

  const handleImageClick = (media) => {
    setLightboxImage(media);
  };

  const handleSelection = (mediaId, isSelected) => {
    if (isSelected) {
      onSelectionChange([...selectedFiles, mediaId]);
    } else {
      onSelectionChange(selectedFiles.filter(id => id !== mediaId));
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === mediaFiles.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(mediaFiles.map(media => media.id));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return '✅';
      case 'processing': return '⏳';
      case 'fallback': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return '#27ae60';
      case 'processing': return '#f39c12';
      case 'fallback': return '#e67e22';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (mediaFiles.length === 0) {
    return (
      <div className="image-gallery empty">
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>No media files found</h3>
          <p>Upload some images to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            ⊞
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            ☰
          </button>
          <button
            className={`metadata-btn ${showMetadata ? 'active' : ''}`}
            onClick={() => setShowMetadata(!showMetadata)}
            title="Toggle Metadata"
          >
            ℹ️
          </button>
        </div>

        <div className="selection-controls">
          <button
            onClick={handleSelectAll}
            className="select-all-btn"
          >
            {selectedFiles.length === mediaFiles.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className={`gallery-content ${viewMode}`}>
        {mediaFiles.map((media) => (
          <div
            key={media.id}
            className={`media-item ${selectedFiles.includes(media.id) ? 'selected' : ''}`}
          >
            <div className="media-checkbox">
              <input
                type="checkbox"
                checked={selectedFiles.includes(media.id)}
                onChange={(e) => handleSelection(media.id, e.target.checked)}
              />
            </div>

            <div className="media-image-container" onClick={() => handleImageClick(media)}>
              <img
                src={media.thumbnail_url || media.url}
                alt={media.label || 'Media file'}
                className="media-image"
                loading="lazy"
              />
              <div className="media-overlay">
                <button className="view-btn">👁️ View</button>
              </div>
              <div 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(media.status) }}
                title={`Status: ${media.status}`}
              >
                {getStatusIcon(media.status)}
              </div>
            </div>

            <div className="media-info">
              <div className="media-title">
                {media.label || `Image ${media.id}`}
              </div>
              <div className="media-entity">
                📁 {media.entityTitle}
              </div>
              
              {showMetadata && (
                <div className="media-metadata">
                  <div className="metadata-row">
                    <span className="metadata-label">Size:</span>
                    <span className="metadata-value">{formatFileSize(media.file_size)}</span>
                  </div>
                  <div className="metadata-row">
                    <span className="metadata-label">Type:</span>
                    <span className="metadata-value">{media.content_type || 'Unknown'}</span>
                  </div>
                  <div className="metadata-row">
                    <span className="metadata-label">Uploaded:</span>
                    <span className="metadata-value">{formatDate(media.created_at)}</span>
                  </div>
                  {media.dimensions && (
                    <div className="metadata-row">
                      <span className="metadata-label">Dimensions:</span>
                      <span className="metadata-value">{media.dimensions}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="media-actions">
                <button
                  onClick={() => handleImageClick(media)}
                  className="action-btn view"
                  title="View Full Size"
                >
                  👁️
                </button>
                <button
                  onClick={() => window.open(media.url, '_blank')}
                  className="action-btn download"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => onDelete(media.id)}
                  className="action-btn delete"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            
            <div className="lightbox-image-container">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.label || 'Media file'}
                className="lightbox-image"
              />
            </div>
            
            <div className="lightbox-info">
              <h3>{lightboxImage.label || `Image ${lightboxImage.id}`}</h3>
              <div className="lightbox-details">
                <div className="detail-row">
                  <strong>Entity:</strong> {lightboxImage.entityTitle}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(lightboxImage.status) }}
                  >
                    {getStatusIcon(lightboxImage.status)} {lightboxImage.status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Size:</strong> {formatFileSize(lightboxImage.file_size)}
                </div>
                <div className="detail-row">
                  <strong>Type:</strong> {lightboxImage.content_type || 'Unknown'}
                </div>
                <div className="detail-row">
                  <strong>Uploaded:</strong> {formatDate(lightboxImage.created_at)}
                </div>
                {lightboxImage.dimensions && (
                  <div className="detail-row">
                    <strong>Dimensions:</strong> {lightboxImage.dimensions}
                  </div>
                )}
              </div>
              
              <div className="lightbox-actions">
                <button
                  onClick={() => window.open(lightboxImage.url, '_blank')}
                  className="lightbox-btn download"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() => {
                    onDelete(lightboxImage.id);
                    setLightboxImage(null);
                  }}
                  className="lightbox-btn delete"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;