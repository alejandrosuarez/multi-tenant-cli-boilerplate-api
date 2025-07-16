import React, { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI } from '../../services/api';
import ListingCard from './ListingCard';
import TouchButton from '../UI/TouchButton';
import CollapsibleSection from '../UI/CollapsibleSection';
import './ListingPage.css';

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
      console.warn('Failed to load categories, using fallback:', err);
      // Provide fallback categories based on the entity types we see in the API
      setCategories([
        { id: 'vehicle', name: 'vehicle', display_name: 'Vehicles' },
        { id: 'property', name: 'property', display_name: 'Properties' },
        { id: 'equipment', name: 'equipment', display_name: 'Equipment' }
      ]);
    }
  };

  const loadEntities = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      // Try search endpoint first
      let response;
      try {
        response = await entitiesAPI.search(
          searchQuery,
          tenantId,
          currentPage,
          20, // limit
          'created_at',
          'desc',
          true // include_images
        );
      } catch (searchError) {
        console.warn('Search endpoint failed, falling back to basic entities endpoint:', searchError);
        
        // Fallback to basic entities endpoint
        response = await entitiesAPI.getAll(tenantId, currentPage, 20);
        
        // Filter entities locally if search query exists
        if (searchQuery && response.data.entities) {
          const filteredEntities = response.data.entities.filter(entity => {
            const searchLower = searchQuery.toLowerCase();
            return (
              entity.entity_type?.toLowerCase().includes(searchLower) ||
              Object.values(entity.attributes || {}).some(value => 
                String(value).toLowerCase().includes(searchLower)
              )
            );
          });
          response.data.entities = filteredEntities;
        }
      }
      
      setEntities(response.data.entities || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to load entities:', err);
      setError('Unable to load entities. Please try again later.');
      
      // Set empty state instead of leaving in loading state
      setEntities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="listing-page">
      <div className="container">
        {/* Header Section */}
        <div className="listing-header">
          <div className="brand-section">
            <h1 className="listing-title">
              <i className="fas fa-store"></i>
              All Listings
            </h1>
            <p className="listing-subtitle">Discover amazing entities and resources</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="listing-alert error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
            <TouchButton
              onClick={() => setError('')}
              variant="ghost"
              size="small"
              icon="fas fa-times"
            />
          </div>
        )}

        {/* Search and Filters */}
        <CollapsibleSection 
          title="Search & Filters" 
          icon="fas fa-filter"
          defaultExpanded={true}
          badge={entities.length > 0 ? entities.length : null}
        >
          <div className="search-filters">
            <div className="filter-row">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control-mobile"
                />
                <TouchButton
                  onClick={loadEntities}
                  variant="primary"
                  icon="fas fa-search"
                  disabled={loading}
                >
                  Search
                </TouchButton>
              </div>
              
              <div className="category-select-group">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-control-mobile"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.display_name || category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading entities...</p>
          </div>
        ) : (
          <>
            {/* Results Grid */}
            <div className="listings-grid">
              {entities.length > 0 ? (
                entities.map((entity) => (
                  <ListingCard key={entity.id} entity={entity} />
                ))
              ) : (
                <div className="no-results">
                  <div className="no-results-content">
                    <i className="fas fa-search"></i>
                    <h3>No listings found</h3>
                    <p>Try adjusting your search criteria or browse all categories.</p>
                    <TouchButton
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                      }}
                      variant="secondary"
                      icon="fas fa-refresh"
                    >
                      Clear Filters
                    </TouchButton>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Page {currentPage} of {pagination.totalPages}
                </div>
                <div className="pagination-controls">
                  <TouchButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    variant="secondary"
                    icon="fas fa-chevron-left"
                  >
                    Previous
                  </TouchButton>
                  
                  <TouchButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                    variant="secondary"
                    icon="fas fa-chevron-right"
                  >
                    Next
                  </TouchButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListingPage;