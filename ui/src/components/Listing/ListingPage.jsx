import React, { useState, useEffect } from 'react';
import { entitiesAPI, categoriesAPI } from '../../services/api';
import ListingCard from './ListingCard';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';

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
    <Container className="main-layout py-4">
      <h1 className="text-center mb-4">All Listings</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
              <Button onClick={loadEntities} className="w-100" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Apply Filters'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
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
              <p>No listings found.</p>
            </Col>
          )}
        </Row>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            variant="outline-primary"
          >
            Previous
          </Button>
          <span className="align-self-center text-muted small">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            variant="outline-primary"
          >
            Next
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ListingPage;