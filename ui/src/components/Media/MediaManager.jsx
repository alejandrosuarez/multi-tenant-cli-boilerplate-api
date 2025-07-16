import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { mediaAPI, entitiesAPI } from '../../services/api';
import ImageGallery from './ImageGallery';
import BulkUpload from './BulkUpload';
import MediaAnalytics from './MediaAnalytics';
import './MediaManager.css';

const MediaManager = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState('gallery');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    loadMediaData();
    loadEntities();
  }, [currentTenant]);

  const loadMediaData = async () => {
    try {
      setLoading(true);
      // Get all user entities to collect their media
      const entitiesResponse = await entitiesAPI.getMyEntities(currentTenant?.id);
      const userEntities = entitiesResponse.data.entities || [];
      
      // Collect all media files from entities
      const allMedia = [];
      for (const entity of userEntities) {
        try {
          const mediaResponse = await mediaAPI.getEntityImages(entity.id, currentTenant?.id);
          const entityMedia = mediaResponse.data.images || [];
          entityMedia.forEach(media => {
            allMedia.push({
              ...media,
              entityId: entity.id,
              entityType: entity.entity_type,
              entityTitle: entity.attributes?.title || entity.attributes?.name || `${entity.entity_type} #${entity.id}`
            });
          });
        } catch (error) {
          console.warn(`Failed to load media for entity ${entity.id}:`, error);
        }
      }
      
      setMediaFiles(allMedia);
    } catch (error) {
      console.error('Failed to load media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    try {
      const response = await entitiesAPI.getMyEntities(currentTenant?.id);
      setEntities(response.data.entities || []);
    } catch (error) {
      console.error('Failed to load entities:', error);
    }
  };

  const handleFileUpload = async (files, entityId, label) => {
    try {
      await mediaAPI.uploadToEntity(entityId, files, currentTenant?.id, label);
      await loadMediaData(); // Refresh media data
      return true;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      await mediaAPI.deleteImage(mediaId, currentTenant?.id);
      setMediaFiles(prev => prev.filter(media => media.id !== mediaId));
      setSelectedFiles(prev => prev.filter(id => id !== mediaId));
    } catch (error) {
      console.error('Failed to delete media:', error);
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await Promise.all(
        selectedFiles.map(mediaId => mediaAPI.deleteImage(mediaId, currentTenant?.id))
      );
      setMediaFiles(prev => prev.filter(media => !selectedFiles.includes(media.id)));
      setSelectedFiles([]);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      throw error;
    }
  };

  const filteredAndSortedMedia = mediaFiles
    .filter(media => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          media.entityTitle.toLowerCase().includes(query) ||
          media.entityType.toLowerCase().includes(query) ||
          (media.label && media.label.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(media => {
      if (filterBy === 'all') return true;
      if (filterBy === 'processed') return media.status === 'processed';
      if (filterBy === 'fallback') return media.status === 'fallback';
      if (filterBy === 'processing') return media.status === 'processing';
      return media.entityType === filterBy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name_asc':
          return a.entityTitle.localeCompare(b.entityTitle);
        case 'name_desc':
          return b.entityTitle.localeCompare(a.entityTitle);
        case 'size_desc':
          return (b.file_size || 0) - (a.file_size || 0);
        case 'size_asc':
          return (a.file_size || 0) - (b.file_size || 0);
        default:
          return 0;
      }
    });

  const tabs = [
    { id: 'gallery', label: 'Media Gallery', icon: '🖼️' },
    { id: 'upload', label: 'Bulk Upload', icon: '📤' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  if (loading) {
    return (
      <div className="media-manager">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading media files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-manager">
      <div className="media-manager-header">
        <h1>Media Manager</h1>
        <div className="media-stats">
          <span className="stat">
            <strong>{mediaFiles.length}</strong> files
          </span>
          <span className="stat">
            <strong>{entities.length}</strong> entities
          </span>
          {selectedFiles.length > 0 && (
            <span className="stat selected">
              <strong>{selectedFiles.length}</strong> selected
            </span>
          )}
        </div>
      </div>

      <div className="media-manager-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'gallery' && (
        <div className="media-gallery-section">
          <div className="gallery-controls">
            <div className="search-and-filter">
              <input
                type="text"
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Files</option>
                <option value="processed">Processed</option>
                <option value="fallback">Fallback</option>
                <option value="processing">Processing</option>
                {[...new Set(mediaFiles.map(m => m.entityType))].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="size_desc">Largest First</option>
                <option value="size_asc">Smallest First</option>
              </select>
            </div>

            {selectedFiles.length > 0 && (
              <div className="bulk-actions">
                <button
                  onClick={handleBulkDelete}
                  className="bulk-delete-btn"
                >
                  Delete Selected ({selectedFiles.length})
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="clear-selection-btn"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          <ImageGallery
            mediaFiles={filteredAndSortedMedia}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            onDelete={handleDeleteMedia}
            entities={entities}
          />
        </div>
      )}

      {activeTab === 'upload' && (
        <BulkUpload
          entities={entities}
          onUpload={handleFileUpload}
          onUploadComplete={loadMediaData}
        />
      )}

      {activeTab === 'analytics' && (
        <MediaAnalytics
          mediaFiles={mediaFiles}
          entities={entities}
        />
      )}
    </div>
  );
};

export default MediaManager;