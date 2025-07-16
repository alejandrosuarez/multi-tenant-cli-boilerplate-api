import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { entitiesAPI } from '../../services/api';
import './SchemaEditor.css';

const SchemaEditor = () => {
  const { currentTenant } = useTenant();
  const [schemas, setSchemas] = useState({});
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [newEntityType, setNewEntityType] = useState('');
  const [currentSchema, setCurrentSchema] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    type: 'text',
    required: false,
    defaultValue: '',
    description: '',
    options: []
  });

  const attributeTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'phone', label: 'Phone' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'multiselect', label: 'Multi-Select' },
    { value: 'textarea', label: 'Long Text' }
  ];

  const loadSchemas = useCallback(async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint for schema management
      // For now, we'll simulate with entity types
      const response = await entitiesAPI.getAll(currentTenant?.id, 1, 100);
      const entityTypes = [...new Set(response.data.data.map(entity => entity.entity_type))];
      
      // Initialize schemas for each entity type
      const schemaData = {};
      entityTypes.forEach(type => {
        schemaData[type] = getDefaultSchema(type);
      });
      
      setSchemas(schemaData);
      if (entityTypes.length > 0 && !selectedEntityType) {
        setSelectedEntityType(entityTypes[0]);
        setCurrentSchema(schemaData[entityTypes[0]] || []);
      }
    } catch (error) {
      console.error('Error loading schemas:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    loadSchemas();
  }, [loadSchemas]);

  const getDefaultSchema = (entityType) => {
    // Default schema based on entity type
    const baseSchema = [
      {
        name: 'name',
        type: 'text',
        required: true,
        defaultValue: '',
        description: 'Entity name',
        visibility: 'public'
      },
      {
        name: 'description',
        type: 'textarea',
        required: false,
        defaultValue: '',
        description: 'Entity description',
        visibility: 'public'
      }
    ];

    // Add type-specific attributes
    switch (entityType.toLowerCase()) {
      case 'person':
        return [
          ...baseSchema,
          {
            name: 'email',
            type: 'email',
            required: false,
            defaultValue: '',
            description: 'Contact email',
            visibility: 'private'
          },
          {
            name: 'phone',
            type: 'phone',
            required: false,
            defaultValue: '',
            description: 'Phone number',
            visibility: 'private'
          }
        ];
      case 'business':
        return [
          ...baseSchema,
          {
            name: 'website',
            type: 'url',
            required: false,
            defaultValue: '',
            description: 'Business website',
            visibility: 'public'
          },
          {
            name: 'industry',
            type: 'select',
            required: false,
            defaultValue: '',
            description: 'Industry category',
            visibility: 'public',
            options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Other']
          }
        ];
      default:
        return baseSchema;
    }
  };

  const handleEntityTypeChange = (entityType) => {
    setSelectedEntityType(entityType);
    setCurrentSchema(schemas[entityType] || []);
  };

  const handleAddAttribute = () => {
    if (!newAttribute.name.trim()) return;

    const attribute = {
      ...newAttribute,
      id: Date.now().toString(),
      name: newAttribute.name.toLowerCase().replace(/\s+/g, '_')
    };

    const updatedSchema = [...currentSchema, attribute];
    setCurrentSchema(updatedSchema);
    setSchemas(prev => ({
      ...prev,
      [selectedEntityType]: updatedSchema
    }));

    // Reset form
    setNewAttribute({
      name: '',
      type: 'text',
      required: false,
      defaultValue: '',
      description: '',
      options: []
    });
    setShowAddAttribute(false);
  };

  const handleRemoveAttribute = (index) => {
    const updatedSchema = currentSchema.filter((_, i) => i !== index);
    setCurrentSchema(updatedSchema);
    setSchemas(prev => ({
      ...prev,
      [selectedEntityType]: updatedSchema
    }));
  };

  const handleAttributeUpdate = (index, field, value) => {
    const updatedSchema = [...currentSchema];
    updatedSchema[index] = {
      ...updatedSchema[index],
      [field]: value
    };
    setCurrentSchema(updatedSchema);
    setSchemas(prev => ({
      ...prev,
      [selectedEntityType]: updatedSchema
    }));
  };

  const handleSaveSchema = async () => {
    try {
      setSaving(true);
      // This would save to a schema management API
      console.log('Saving schema for', selectedEntityType, currentSchema);
      // await schemaAPI.saveSchema(selectedEntityType, currentSchema, currentTenant?.id);
    } catch (error) {
      console.error('Error saving schema:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEntityType = () => {
    if (!newEntityType.trim()) return;
    
    const entityType = newEntityType.trim();
    setSchemas(prev => ({
      ...prev,
      [entityType]: getDefaultSchema(entityType)
    }));
    setSelectedEntityType(entityType);
    setCurrentSchema(getDefaultSchema(entityType));
    setNewEntityType('');
  };

  return (
    <div className="schema-editor">
      <div className="schema-editor-header">
        <h2>Schema Editor</h2>
        <p>Define and modify entity type schemas</p>
      </div>

      <div className="schema-controls">
        <div className="entity-type-selector">
          <label>Entity Type:</label>
          <select
            value={selectedEntityType}
            onChange={(e) => handleEntityTypeChange(e.target.value)}
          >
            <option value="">Select entity type</option>
            {Object.keys(schemas).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="new-entity-type">
          <input
            type="text"
            placeholder="New entity type name"
            value={newEntityType}
            onChange={(e) => setNewEntityType(e.target.value)}
          />
          <button onClick={handleCreateEntityType}>Create Type</button>
        </div>

        <button
          className="save-schema-btn"
          onClick={handleSaveSchema}
          disabled={saving || !selectedEntityType}
        >
          {saving ? 'Saving...' : 'Save Schema'}
        </button>
      </div>

      {selectedEntityType && (
        <div className="schema-content">
          <div className="schema-attributes">
            <div className="attributes-header">
              <h3>Attributes for {selectedEntityType}</h3>
              <button
                className="add-attribute-btn"
                onClick={() => setShowAddAttribute(true)}
              >
                + Add Attribute
              </button>
            </div>

            <div className="attributes-list">
              {currentSchema.map((attribute, index) => (
                <div key={attribute.id || index} className="attribute-card">
                  <div className="attribute-header">
                    <div className="attribute-name">
                      <input
                        type="text"
                        value={attribute.name}
                        onChange={(e) => handleAttributeUpdate(index, 'name', e.target.value)}
                        placeholder="Attribute name"
                      />
                      <span className="attribute-type">{attribute.type}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveAttribute(index)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="attribute-details">
                    <div className="detail-row">
                      <label>Type:</label>
                      <select
                        value={attribute.type}
                        onChange={(e) => handleAttributeUpdate(index, 'type', e.target.value)}
                      >
                        {attributeTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="detail-row">
                      <label>Description:</label>
                      <input
                        type="text"
                        value={attribute.description}
                        onChange={(e) => handleAttributeUpdate(index, 'description', e.target.value)}
                        placeholder="Attribute description"
                      />
                    </div>

                    <div className="detail-row">
                      <label>Default Value:</label>
                      <input
                        type="text"
                        value={attribute.defaultValue}
                        onChange={(e) => handleAttributeUpdate(index, 'defaultValue', e.target.value)}
                        placeholder="Default value"
                      />
                    </div>

                    <div className="detail-row checkboxes">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={attribute.required}
                          onChange={(e) => handleAttributeUpdate(index, 'required', e.target.checked)}
                        />
                        Required
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={attribute.visibility === 'public'}
                          onChange={(e) => handleAttributeUpdate(index, 'visibility', e.target.checked ? 'public' : 'private')}
                        />
                        Public
                      </label>
                    </div>

                    {(attribute.type === 'select' || attribute.type === 'multiselect') && (
                      <div className="detail-row">
                        <label>Options (comma-separated):</label>
                        <input
                          type="text"
                          value={attribute.options?.join(', ') || ''}
                          onChange={(e) => handleAttributeUpdate(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showAddAttribute && (
            <div className="add-attribute-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Add New Attribute</h3>
                  <button
                    className="close-btn"
                    onClick={() => setShowAddAttribute(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-row">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={newAttribute.name}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Attribute name"
                    />
                  </div>

                  <div className="form-row">
                    <label>Type:</label>
                    <select
                      value={newAttribute.type}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, type: e.target.value }))}
                    >
                      {attributeTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label>Description:</label>
                    <input
                      type="text"
                      value={newAttribute.description}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Attribute description"
                    />
                  </div>

                  <div className="form-row">
                    <label>Default Value:</label>
                    <input
                      type="text"
                      value={newAttribute.defaultValue}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, defaultValue: e.target.value }))}
                      placeholder="Default value"
                    />
                  </div>

                  <div className="form-row checkboxes">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newAttribute.required}
                        onChange={(e) => setNewAttribute(prev => ({ ...prev, required: e.target.checked }))}
                      />
                      Required
                    </label>
                  </div>

                  {(newAttribute.type === 'select' || newAttribute.type === 'multiselect') && (
                    <div className="form-row">
                      <label>Options (comma-separated):</label>
                      <input
                        type="text"
                        value={newAttribute.options?.join(', ') || ''}
                        onChange={(e) => setNewAttribute(prev => ({ 
                          ...prev, 
                          options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }))}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => setShowAddAttribute(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="add-btn"
                    onClick={handleAddAttribute}
                    disabled={!newAttribute.name.trim()}
                  >
                    Add Attribute
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading schemas...</p>
        </div>
      )}
    </div>
  );
};

export default SchemaEditor;