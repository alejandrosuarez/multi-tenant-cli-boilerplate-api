import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert, Badge, ProgressBar, Image } from 'react-bootstrap';
import { mediaAPI, categoriesAPI } from '../../services/api';
import { FormSkeleton } from '../UI/Skeleton';
import './EntityModal.css';

const EntityModal = ({ 
  show, 
  onHide, 
  entity, 
  tenantId, 
  onSubmit, 
  mode = 'edit' // 'edit', 'create', 'view'
}) => {
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
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'attributes', 'media'

  const isReadOnly = mode === 'view';
  const isEditMode = mode === 'edit' && entity;
  const isCreateMode = mode === 'create';

  useEffect(() => {
    if (show) {
      setInitialLoading(true);
      loadInitialData();
    }
  }, [show, entity, tenantId]);

  const loadInitialData = async () => {
    try {
      // Load categories
      const categoriesResponse = await categoriesAPI.getAll(tenantId);
      setCategories(categoriesResponse.data.categories || []);

      // Load existing images if editing
      if (entity && entity.id) {
        try {
          const imagesResponse = await mediaAPI.getEntityImages(entity.id, tenantId);
          setExistingImages(imagesResponse.data.images || []);
        } catch (err) {
          console.error('Failed to load existing images:', err);
        }
      }

      // Set form data
      if (entity) {
        const category = categoriesResponse.data.categories?.find(cat => cat.name === entity.entity_type);
        const mergedAttributes = category ? { ...category.base_schema, ...entity.attributes } : entity.attributes;

        setFormData({
          entity_type: entity.entity_type || '',
          attributes: {
            ...mergedAttributes || {},
            name: entity.attributes.name || '',
            description: entity.attributes.description || ''
          }
        });
        setSelectedCategory(entity.entity_type || '');
      } else {
        // Reset form for new entity
        setFormData({
          entity_type: '',
          attributes: {
            name: '',
            description: ''
          }
        });
        setSelectedCategory('');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setFormError('Failed to load form data.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setFormData({
      entity_type: '',
      attributes: {
        name: '',
        description: ''
      }
    });
    setSelectedCategory('');
    setImageFiles([]);
    setExistingImages([]);
    setFormError('');
    setUploadProgress(0);
    setActiveTab('basic');
    onHide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    setLoading(true);
    setFormError('');
    setUploadProgress(0);

    try {
      const entityData = {
        entity_type: formData.entity_type,
        attributes: formData.attributes
      };

      await onSubmit(entityData);
      
      // Handle image uploads for existing entities
      if (imageFiles.length > 0 && entity && entity.id) {
        try {
          setUploadProgress(50);
          await mediaAPI.uploadToEntity(entity.id, imageFiles, tenantId);
          setUploadProgress(100);
        } catch (err) {
          console.error('Image upload error:', err);
          setFormError('Entity saved, but image upload failed.');
        }
      }

      // Close modal on success
      handleClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setFormError(err.response?.data?.error || 'Failed to save entity.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryName = e.target.value;
    setSelectedCategory(categoryName);
    
    if (categoryName) {
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        setFormData(prev => ({
          ...prev,
          entity_type: category.name,
          attributes: {
            ...prev.attributes,
            ...category.base_schema
          }
        }));
      }
    }
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  const removeFile = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId) => {
    if (isReadOnly) return;
    
    try {
      await mediaAPI.deleteImage(imageId, tenantId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Failed to delete image:', err);
      setFormError('Failed to delete image.');
    }
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

  const getModalTitle = () => {
    switch (mode) {
      case 'view':
        return 'View Entity';
      case 'edit':
        return 'Edit Entity';
      case 'create':
        return 'Create New Entity';
      default:
        return 'Entity';
    }
  };

  const renderTabContent = () => {
    if (initialLoading) {
      return <FormSkeleton />;
    }

    switch (activeTab) {
      case 'basic':
        return (
          <div className="tab-content">
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                disabled={isReadOnly}
              />
            </Form.Group>
          </div>
        );

      case 'attributes':
        const attributeKeys = Object.keys(formData.attributes).filter(key => key !== 'name' && key !== 'description');
        
        if (attributeKeys.length === 0) {
          return (
            <div className="tab-content">
              <div className="text-center text-muted py-4">
                <i className="fas fa-info-circle fa-2x mb-2"></i>
                <p>No additional attributes for this entity type.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="tab-content">
            <Row>
              {attributeKeys.map(key => (
                <Col md={6} key={key}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name={key}
                      value={formData.attributes[key] || ''}
                      onChange={handleAttributeChange}
                      className="neumorphic-input"
                      placeholder={`Enter ${key}`}
                      disabled={isReadOnly}
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </div>
        );

      case 'media':
        return (
          <div className="tab-content">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="fas fa-images me-2"></i>
                  Current Images
                </h6>
                <div className="existing-images-grid">
                  {existingImages.map((image) => (
                    <div key={image.id} className="existing-image-item">
                      <div className="image-container">
                        <Image
                          src={image.url}
                          alt="Entity image"
                          className="existing-image"
                          fluid
                          rounded
                        />
                        {!isReadOnly && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="image-remove-btn"
                            onClick={() => removeExistingImage(image.id)}
                            title="Remove image"
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            {!isReadOnly && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <i className="fas fa-camera me-1"></i>
                    Upload New Images
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
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="lg"
      className="entity-modal"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className="entity-modal-header">
        <Modal.Title className="d-flex align-items-center">
          <i className={`fas ${mode === 'view' ? 'fa-eye' : mode === 'edit' ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
          {getModalTitle()}
          {entity && (
            <Badge bg="secondary" className="ms-2">
              ID: {entity.id?.substring(0, 8)}...
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="entity-modal-body">
        {formError && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {formError}
          </Alert>
        )}

        {/* Progress Bar for Create Mode */}
        {isCreateMode && !initialLoading && (
          <div className="form-progress mb-3">
            <small className="text-muted mb-1 d-block">Form Progress</small>
            <ProgressBar 
              now={getFormProgress()} 
              variant={getFormProgress() === 100 ? 'success' : 'info'}
              size="sm"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="entity-tabs mb-3">
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <i className="fas fa-info-circle me-1"></i>
              Basic Info
            </button>
            <button
              className={`tab-btn ${activeTab === 'attributes' ? 'active' : ''}`}
              onClick={() => setActiveTab('attributes')}
            >
              <i className="fas fa-list-ul me-1"></i>
              Attributes
            </button>
            <button
              className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <i className="fas fa-images me-1"></i>
              Media
            </button>
          </div>
        </div>

        {/* Form Content */}
        <Form onSubmit={handleSubmit}>
          {renderTabContent()}

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
        </Form>
      </Modal.Body>

      <Modal.Footer className="entity-modal-footer">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={loading}
        >
          <i className="fas fa-times me-1"></i>
          {isReadOnly ? 'Close' : 'Cancel'}
        </Button>
        
        {!isReadOnly && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <i className={`fas ${isEditMode ? 'fa-save' : 'fa-plus'} me-1`}></i>
                {isEditMode ? 'Update Entity' : 'Create Entity'}
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EntityModal;
