import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../services/api';
import './SavedSearches.css';

const SavedSearches = ({ onSearchLoad, currentSearch = null }) => {
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    isPublic: false,
    tags: []
  });
  const [searchTags, setSearchTags] = useState([]);
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const { user } = useAuth();
  const { currentTenant } = useTenant();

  useEffect(() => {
    loadSavedSearches();
    loadSearchTags();
  }, [currentTenant, sortBy, sortOrder, filterTag]);

  const loadSavedSearches = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/search/saved', {
        params: {
          tenant_id: currentTenant?.id,
          sort_by: sortBy,
          sort_order: sortOrder,
          tag: filterTag || undefined
        }
      });
      setSavedSearches(response.data.searches || []);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchTags = async () => {
    try {
      const response = await api.get('/search/tags', {
        params: {
          tenant_id: currentTenant?.id
        }
      });
      setSearchTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to load search tags:', error);
    }
  };

  const saveCurrentSearch = async () => {
    if (!currentSearch || !saveForm.name.trim()) return;

    try {
      const searchData = {
        name: saveForm.name.trim(),
        description: saveForm.description.trim(),
        query: currentSearch.query || '',
        filters: currentSearch.filters || {},
        is_public: saveForm.isPublic,
        tags: saveForm.tags,
        tenant_id: currentTenant?.id
      };

      const response = await api.post('/search/saved', searchData);
      
      setSavedSearches(prev => [response.data.search, ...prev]);
      setShowSaveDialog(false);
      setSaveForm({
        name: '',
        description: '',
        isPublic: false,
        tags: []
      });
      
      // Refresh tags list
      loadSearchTags();
    } catch (error) {
      console.error('Failed to save search:', error);
      alert('Failed to save search. Please try again.');
    }
  };

  const deleteSearch = async (searchId) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;

    try {
      await api.delete(`/search/saved/${searchId}`);
      setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (error) {
      console.error('Failed to delete search:', error);
      alert('Failed to delete search. Please try again.');
    }
  };

  const duplicateSearch = async (search) => {
    const name = prompt('Enter a name for the duplicated search:', `${search.name} (Copy)`);
    if (!name) return;

    try {
      const searchData = {
        name: name.trim(),
        description: search.description,
        query: search.query,
        filters: search.filters,
        is_public: false,
        tags: search.tags,
        tenant_id: currentTenant?.id
      };

      const response = await api.post('/search/saved', searchData);
      setSavedSearches(prev => [response.data.search, ...prev]);
    } catch (error) {
      console.error('Failed to duplicate search:', error);
      alert('Failed to duplicate search. Please try again.');
    }
  };

  const shareSearch = async (search) => {
    try {
      const response = await api.post(`/search/saved/${search.id}/share`);
      const shareUrl = response.data.share_url;
      
      if (navigator.share) {
        await navigator.share({
          title: `Saved Search: ${search.name}`,
          text: search.description || 'Check out this saved search',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share search:', error);
      alert('Failed to generate share URL. Please try again.');
    }
  };

  const updateSearch = async (searchId, updates) => {
    try {
      const response = await api.patch(`/search/saved/${searchId}`, updates);
      setSavedSearches(prev => prev.map(s => 
        s.id === searchId ? { ...s, ...response.data.search } : s
      ));
    } catch (error) {
      console.error('Failed to update search:', error);
    }
  };

  const addTag = (tag) => {
    if (tag && !saveForm.tags.includes(tag)) {
      setSaveForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setSaveForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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

  const getSearchPreview = (search) => {
    const parts = [];
    if (search.query) parts.push(`Query: "${search.query}"`);
    if (search.filters?.conditions?.length) {
      parts.push(`${search.filters.conditions.length} filter(s)`);
    }
    return parts.join(' • ') || 'No query or filters';
  };

  return (
    <div className="saved-searches">
      <div className="saved-searches-header">
        <h3>Saved Searches</h3>
        <div className="header-actions">
          {currentSearch && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="save-current-button"
            >
              💾 Save Current Search
            </button>
          )}
        </div>
      </div>

      <div className="search-controls">
        <div className="filter-controls">
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="tag-filter"
          >
            <option value="">All Tags</option>
            {searchTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="sort-select"
          >
            <option value="updated_at-desc">Recently Updated</option>
            <option value="created_at-desc">Recently Created</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="usage_count-desc">Most Used</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading saved searches...</div>
      ) : savedSearches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h4>No Saved Searches</h4>
          <p>Save your frequently used searches for quick access.</p>
        </div>
      ) : (
        <div className="searches-list">
          {savedSearches.map(search => (
            <div key={search.id} className="search-item">
              <div className="search-content">
                <div className="search-header">
                  <h4 className="search-name">{search.name}</h4>
                  <div className="search-meta">
                    {search.is_public && <span className="public-badge">Public</span>}
                    {search.usage_count > 0 && (
                      <span className="usage-count">Used {search.usage_count} times</span>
                    )}
                  </div>
                </div>

                {search.description && (
                  <p className="search-description">{search.description}</p>
                )}

                <div className="search-preview">
                  {getSearchPreview(search)}
                </div>

                {search.tags && search.tags.length > 0 && (
                  <div className="search-tags">
                    {search.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="search-footer">
                  <span className="search-date">
                    Updated {formatDate(search.updated_at)}
                  </span>
                  <span className="search-author">
                    by {search.created_by_name || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="search-actions">
                <button
                  onClick={() => onSearchLoad && onSearchLoad(search)}
                  className="load-button"
                  title="Load this search"
                >
                  📂
                </button>
                <button
                  onClick={() => duplicateSearch(search)}
                  className="duplicate-button"
                  title="Duplicate this search"
                >
                  📋
                </button>
                <button
                  onClick={() => shareSearch(search)}
                  className="share-button"
                  title="Share this search"
                >
                  🔗
                </button>
                {search.created_by === user?.id && (
                  <button
                    onClick={() => deleteSearch(search.id)}
                    className="delete-button"
                    title="Delete this search"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <div className="dialog-header">
              <h3>Save Current Search</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="close-button"
              >
                ✕
              </button>
            </div>

            <div className="dialog-content">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter search name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                  <div className="selected-tags">
                    {saveForm.tags.map(tag => (
                      <span key={tag} className="selected-tag">
                        {tag}
                        <button onClick={() => removeTag(tag)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                    className="tag-input"
                  />
                </div>
                {searchTags.length > 0 && (
                  <div className="suggested-tags">
                    <span>Suggested: </span>
                    {searchTags.slice(0, 5).map(tag => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="suggested-tag"
                        disabled={saveForm.tags.includes(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveForm.isPublic}
                    onChange={(e) => setSaveForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Make this search public (visible to other users in your tenant)
                </label>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentSearch}
                className="save-button"
                disabled={!saveForm.name.trim()}
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSearches;