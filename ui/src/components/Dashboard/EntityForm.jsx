import { useState, useEffect } from 'react';
import { mediaAPI, categoriesAPI } from '../../services/api';
import { Form, Button, Card, Row, Col, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';

const EntityForm = ({ entity, tenantId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    entity_type: '',
    attributes: {
      name: '',
      description: ''
    }
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formStep, setFormStep] = useState(1);

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

      setFormData(prev => ({
        ...prev,
        entity_type: entity.entity_type || '',
        attributes: {
          ...mergedAttributes || {},
          name: entity.attributes.name || '',
          description: entity.attributes.description || ''
        }
      }));
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
    setUploadProgress(0);

    try {
      const entityData = {
        entity_type: formData.entity_type,
        attributes: formData.attributes
      };

      const result = await onSubmit(entityData);
      
      if (imageFiles.length > 0 && !entity) {
        console.log('Image upload for new entities needs entity ID from response');
      } else if (imageFiles.length > 0 && entity) {
        try {
          setUploadProgress(50);
          await mediaAPI.uploadToEntity(entity.id, imageFiles, tenantId);
          setUploadProgress(100);
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
      setUploadProgress(0);
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
      attributes: {
        ...prev.attributes,
        [name]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  const removeFile = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    return formData.attributes.name && selectedCategory;
  };

  const getFormProgress = () => {
    let progress = 0;
    if (formData.attributes.name) progress += 25;
    if (selectedCategory) progress += 25;
    if (formData.attributes.description) progress += 25;
    if (Object.keys(formData.attributes).filter(k => k !== 'name' && k !== 'description').some(k => formData.attributes[k])) progress += 25;
    return progress;
  };

  return (
    <div className="entity-form-container">
      <div className="neumorphic-card">
        {/* Form Header */}
        <div className="form-header">
          <div className="form-title-section">
            <h4 className="form-title">
              <i className={`fas ${entity ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
              {entity ? 'Edit Entity' : 'Create New Entity'}
            </h4>
            {entity && (
              <Badge bg="secondary" className="entity-id-badge">
                ID: {entity.id?.substring(0, 8)}...
              </Badge>
            )}
          </div>
          
          {!entity && (
            <div className="form-progress">
              <small className="text-muted mb-1 d-block">Form Progress</small>
              <ProgressBar 
                now={getFormProgress()} 
                variant={getFormProgress() === 100 ? 'success' : 'info'}
                size="sm"
              />
            </div>
          )}
        </div>

        {formError && (
          <Alert variant="danger" className="form-alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {formError}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="entity-form">
          {/* Step 1: Basic Information */}
          <div className="form-section">
            <div className="section-header">
              <h5 className="section-title">
                <i className="fas fa-info-circle me-2"></i>
                Basic Information
              </h5>
            </div>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <i className="fas fa-tag me-1"></i>
                    Entity Name *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Enter entity name"
                    value={formData.attributes.name || ''}
                    onChange={handleChange}
                    required
                    className="neumorphic-input"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <i className="fas fa-layer-group me-1"></i>
                    Entity Type *
                  </Form.Label>
                  <Form.Select
                    name="entity_type"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    required
                    className="neumorphic-input"
                  >
                    <option value="">Select Entity Type</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.display_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">
                <i className="fas fa-align-left me-1"></i>
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                placeholder="Enter a description (optional)"
                value={formData.attributes.description || ''}
                onChange={handleChange}
                rows="3"
                className="neumorphic-input"
              />
            </Form.Group>
          </div>

          {/* Step 2: Attributes */}
          {Object.keys(formData.attributes).filter(key => key !== 'name' && key !== 'description').length > 0 && (
            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <i className="fas fa-list-ul me-2"></i>
                  Attributes
                </h5>
              </div>

              <div className="attributes-grid-form">
                {Object.entries(formData.attributes)
                  .filter(([key]) => key !== 'name' && key !== 'description')
                  .map(([key, value]) => (
                    <div key={key} className="attribute-form-item">
                      <Form.Group className="form-group">
                        <Form.Label className="form-label">
                          <i className="fas fa-tag"></i>
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name={key}
                          value={value || ''}
                          onChange={handleAttributeChange}
                          className="neumorphic-input"
                          placeholder={`Enter ${key.toLowerCase().replace(/([A-Z])/g, ' $1')}`}
                        />
                      </Form.Group>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Step 3: Media Upload */}
          <div className="form-section">
            <div className="section-header">
              <h5 className="section-title">
                <i className="fas fa-images me-2"></i>
                Media Upload
              </h5>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="form-label">
                <i className="fas fa-camera me-1"></i>
                Images
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="neumorphic-input"
              />
              <Form.Text className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Supported formats: JPG, PNG, WebP (Max 5MB each)
              </Form.Text>
            </Form.Group>

            {imageFiles.length > 0 && (
              <div className="selected-files">
                <h6 className="mb-2">Selected Files:</h6>
                <div className="file-list">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <i className="fas fa-file-image me-2"></i>
                        <span className="file-name">{file.name}</span>
                        <small className="file-size text-muted">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </small>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="file-remove-btn"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mb-3">
              <ProgressBar 
                now={uploadProgress} 
                label={`${uploadProgress}%`}
                variant="success"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className="action-btn cancel-btn"
            >
              <i className="fas fa-times me-1"></i>
              Cancel
            </Button>
            
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !isFormValid()}
              className="action-btn submit-btn"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {entity ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className={`fas ${entity ? 'fa-save' : 'fa-plus'} me-1`}></i>
                  {entity ? 'Update Entity' : 'Create Entity'}
                </>
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EntityForm;