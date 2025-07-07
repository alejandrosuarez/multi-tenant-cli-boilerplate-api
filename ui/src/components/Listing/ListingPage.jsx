import React, { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI } from '../../services/api';
import ListingCard from './ListingCard';

const ListingPage = () => {
  const [entities, setEntities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Assuming a default tenantId for public listings, or it could come from context
  const tenantId = 'default'; 

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEntities();
  }, [searchQuery, selectedCategory, currentPage]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(tenantId);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    }
  };

  const loadEntities = async () => {
    setLoading(true);
    try {
      const response = await entitiesAPI.search(
        searchQuery,
        tenantId,
        currentPage,
        20, // limit
        'created_at',
        'desc',
        true // include_images
      );
      
      setEntities(response.data.entities || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to load entities:', err);
      setError('Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="main-layout">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>All Listings</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="neumorphic-card" style={{ marginBottom: '20px', padding: '1.5em' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neumorphic-input"
            style={{ flex: 1 }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="neumorphic-input"
            style={{ flex: 0.5 }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.display_name || category.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={loadEntities} className="neumorphic-button" disabled={loading}>
          {loading ? 'Searching...' : 'Apply Filters'}
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="grid grid-2">
          {entities.length > 0 ? (
            entities.map((entity) => (
              <ListingCard key={entity.id} entity={entity} />
            ))
          ) : (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>No listings found.</p>
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="neumorphic-button"
          >
            Previous
          </button>
          <span style={{ padding: '10px', color: '#666' }}>
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            className="neumorphic-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingPage;