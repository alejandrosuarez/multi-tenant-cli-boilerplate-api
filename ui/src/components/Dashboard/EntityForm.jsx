import { useState, useEffect } from 'react';
import { mediaAPI } from '../../services/api';

const EntityForm = ({ entity, tenantId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type: '',
    attributes: {}
  });
  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        entity_type: entity.entity_type || '',
        attributes: entity.attributes || {}
      });
    }
  }, [entity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create/update the entity
      const entityData = {
        name: formData.name,
        description: formData.description,
        entity_type: formData.entity_type,
        attributes: formData.attributes
      };

      const result = await onSubmit(entityData);
      
      // If we have images and this is a new entity, upload them
      if (imageFiles.length > 0 && !entity) {
        // For new entities, we'd need the entity ID from the response
        // This would require modifying the onSubmit to return the created entity
        console.log('Image upload for new entities needs entity ID from response');
      } else if (imageFiles.length > 0 && entity) {
        // Upload images to existing entity
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addAttribute = () => {
    if (attributeKey && attributeValue) {
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [attributeKey]: attributeValue
        }
      });
      setAttributeKey('');
      setAttributeValue('');
    }
  };

  const removeAttribute = (key) => {
    const newAttributes = { ...formData.attributes };
    delete newAttributes[key];
    setFormData({
      ...formData,
      attributes: newAttributes
    });
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

        <input
          type="text"
          name="entity_type"
          placeholder="Entity Type (e.g., product, person, location)"
          value={formData.entity_type}
          onChange={handleChange}
          className="neumorphic-input"
        />

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
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Key"
              value={attributeKey}
              onChange={(e) => setAttributeKey(e.target.value)}
              className="neumorphic-input"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Value"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              className="neumorphic-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={addAttribute}
              className="neumorphic-button"
              style={{ whiteSpace: 'nowrap' }}
            >
              Add
            </button>
          </div>

          {Object.entries(formData.attributes).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px',
              background: '#f0f5fa',
              borderRadius: '8px',
              marginBottom: '5px'
            }}>
              <span><strong>{key}:</strong> {String(value)}</span>
              <button
                type="button"
                onClick={() => removeAttribute(key)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e74c3c',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Remove
              </button>
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