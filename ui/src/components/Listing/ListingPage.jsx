import React, { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI } from '../../services/api';
import ListingCard from './ListingCard';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
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
    <div className="listing-page">
      <div className="listing-container">
        <div className="listing-header neumorphic-card">
          <div className="brand-section">
            <h1 className="listing-title">All Listings</h1>
            <p className="listing-subtitle">Discover amazing entities and resources</p>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="listing-alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        <div className="search-filters neumorphic-card">
          <Row className="g-3">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neumorphic-input"
              />
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="neumorphic-input"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.display_name || category.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button onClick={loadEntities} className="neumorphic-button w-100" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Apply Filters'}
              </Button>
            </Col>
          </Row>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="text-muted mt-2">Loading entities...</p>
          </div>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {entities.length > 0 ? (
              entities.map((entity) => (
                <Col key={entity.id} className="d-flex">
                  <ListingCard entity={entity} />
                </Col>
              ))
            ) : (
              <Col className="text-center py-5">
                <div className="no-results neumorphic-card">
                  <i className="fas fa-search fa-3x mb-3 text-muted"></i>
                  <p className="mb-0">No listings found.</p>
                  <small className="text-muted">Try adjusting your search criteria.</small>
                </div>
              </Col>
            )}
          </Row>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination-container">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="neumorphic-button"
            >
              <i className="fas fa-chevron-left me-2"></i>
              Previous
            </Button>
            <span className="page-info">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="neumorphic-button"
            >
              Next
              <i className="fas fa-chevron-right ms-2"></i>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingPage;