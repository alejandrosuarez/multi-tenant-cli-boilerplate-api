import { useState, useEffect } from 'react';
import { mediaAPI, categoriesAPI } from '../../services/api';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';

const EntityForm = ({ entity, tenantId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type: '',
    attributes: {}
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    console.log('EntityForm useEffect: entity prop changed', entity);
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll(tenantId);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setFormError('Failed to load categories for form.');
      }
    };

    fetchCategories();

    if (entity) {
      const category = categories.find(cat => cat.name === entity.entity_type);
      const mergedAttributes = category ? { ...category.base_schema, ...entity.attributes } : entity.attributes;

      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        entity_type: entity.entity_type || '',
        attributes: mergedAttributes || {}
      });
      setSelectedCategory(entity.entity_type || '');
      console.log('EntityForm useEffect: formData set to', { name: entity.name || '', description: entity.description || '', entity_type: entity.entity_type || '', attributes: mergedAttributes || {} });
    }
  }, [entity, tenantId]);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.name === selectedCategory);
      if (category) {
        setFormData(prev => ({
          ...prev,
          entity_type: category.name,
          attributes: category.base_schema || {}
        }));
      }
    }
  }, [selectedCategory, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      const entityData = {
        name: formData.name,
        description: formData.description,
        entity_type: formData.entity_type,
        attributes: formData.attributes
      };

      const result = await onSubmit(entityData);
      
      if (imageFiles.length > 0 && !entity) {
        console.log('Image upload for new entities needs entity ID from response');
      } else if (imageFiles.length > 0 && entity) {
        try {
          await mediaAPI.uploadToEntity(entity.id, imageFiles, tenantId);
        } catch (err) {
          console.error('Image upload error:', err);
          setFormError('Image upload failed.');
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setFormError(err.response?.data?.error || 'Failed to save entity.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleAttributeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [name]: value
      }
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>{entity ? 'Edit Entity' : 'Create Entity'}</Card.Title>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Entity Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Entity Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Entity Type</Form.Label>
            <Form.Select
              name="entity_type"
              value={selectedCategory}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Select Entity Type</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.display_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description (optional)</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Images (optional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
            />
            {imageFiles.length > 0 && (
              <Form.Text className="text-muted">
                {imageFiles.length} file(s) selected
              </Form.Text>
            )}
          </Form.Group>

          <h5 className="mt-4 mb-3">Attributes</h5>
          {Object.entries(formData.attributes).map(([key, value]) => (
            <Form.Group className="mb-3" key={key}>
              <Form.Label>{key}:</Form.Label>
              <Form.Control
                type="text"
                name={key}
                value={value || ''}
                onChange={handleAttributeChange}
              />
            </Form.Group>
          ))}

          <div className="d-grid gap-2 mt-4">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : (entity ? 'Update' : 'Create')}
            </Button>
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EntityForm;