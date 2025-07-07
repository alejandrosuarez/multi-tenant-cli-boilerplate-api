import { useState, useEffect } from 'react';
import { mediaAPI, categoriesAPI } from '../../services/api';

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll(tenantId);
        setCategories(response.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();

    if (entity) {
      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        entity_type: entity.entity_type || '',
        attributes: entity.attributes || {}
      });
      setSelectedCategory(entity.entity_type || '');
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
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
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
    <div className="neumorphic-card">
      <h2>{entity ? 'Edit Entity' : 'Create Entity'}</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Entity Name"
          value={formData.name}
          onChange={handleChange}
          className="neumorphic-input"
          required
        />

        <select
          name="entity_type"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="neumorphic-input"
          required
        >
          <option value="">Select Entity Type</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.display_name}
            </option>
          ))}
        </select>

        <textarea
          name="description"
          placeholder="Description (optional)"
          value={formData.description}
          onChange={handleChange}
          className="neumorphic-input"
          rows="3"
          style={{ resize: 'vertical' }}
        />

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Images (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="neumorphic-input"
          />
          {imageFiles.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              {imageFiles.length} file(s) selected
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Attributes
          </label>
          
          {Object.entries(formData.attributes).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{key}:</label>
              <input
                type="text"
                name={key}
                value={value || ''}
                onChange={handleAttributeChange}
                className="neumorphic-input"
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            className="neumorphic-button"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Saving...' : (entity ? 'Update' : 'Create')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="neumorphic-button"
            style={{ flex: 1, background: '#f8d7da', color: '#721c24' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntityForm;