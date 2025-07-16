import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import './AdvancedFilters.css';

const AdvancedFilters = ({ onFiltersChange, initialFilters = {}, availableFields = [] }) => {
  const [filters, setFilters] = useState({
    conditions: [
      {
        id: Date.now(),
        field: '',
        operator: 'equals',
        value: '',
        dataType: 'string'
      }
    ],
    logic: 'AND',
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [presets, setPresets] = useState([]);
  const { currentTenant } = useTenant();

  const operators = {
    string: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does Not Contain' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' }
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'greater_equal', label: 'Greater Than or Equal' },
      { value: 'less_equal', label: 'Less Than or Equal' },
      { value: 'between', label: 'Between' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' }
    ],
    date: [
      { value: 'equals', label: 'On Date' },
      { value: 'not_equals', label: 'Not On Date' },
      { value: 'after', label: 'After' },
      { value: 'before', label: 'Before' },
      { value: 'between', label: 'Between' },
      { value: 'last_days', label: 'Last N Days' },
      { value: 'next_days', label: 'Next N Days' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' }
    ],
    boolean: [
      { value: 'is_true', label: 'Is True' },
      { value: 'is_false', label: 'Is False' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' }
    ],
    array: [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does Not Contain' },
      { value: 'contains_all', label: 'Contains All' },
      { value: 'contains_any', label: 'Contains Any' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' }
    ]
  };

  useEffect(() => {
    loadPresets();
  }, [currentTenant]);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const loadPresets = () => {
    const savedPresets = localStorage.getItem(`filterPresets_${currentTenant?.id || 'default'}`);
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  };

  const savePresets = (newPresets) => {
    localStorage.setItem(`filterPresets_${currentTenant?.id || 'default'}`, JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const addCondition = () => {
    const newCondition = {
      id: Date.now(),
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string'
    };
    
    setFilters(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const removeCondition = (conditionId) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  };

  const updateCondition = (conditionId, updates) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    }));
  };

  const updateLogic = (logic) => {
    setFilters(prev => ({ ...prev, logic }));
  };

  const clearFilters = () => {
    setFilters({
      conditions: [
        {
          id: Date.now(),
          field: '',
          operator: 'equals',
          value: '',
          dataType: 'string'
        }
      ],
      logic: 'AND'
    });
  };

  const saveAsPreset = () => {
    const name = prompt('Enter a name for this filter preset:');
    if (name && name.trim()) {
      const newPreset = {
        id: Date.now(),
        name: name.trim(),
        filters: { ...filters },
        created_at: new Date().toISOString()
      };
      
      const updatedPresets = [...presets, newPreset];
      savePresets(updatedPresets);
    }
  };

  const loadPreset = (preset) => {
    setFilters(preset.filters);
  };

  const deletePreset = (presetId) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      savePresets(updatedPresets);
    }
  };

  const getFieldDataType = (fieldName) => {
    const field = availableFields.find(f => f.name === fieldName);
    return field?.type || 'string';
  };

  const renderValueInput = (condition) => {
    const { operator, dataType, value } = condition;
    
    // No value input needed for these operators
    if (['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(operator)) {
      return null;
    }

    // Between operator needs two inputs
    if (operator === 'between') {
      const values = Array.isArray(value) ? value : ['', ''];
      return (
        <div className="between-inputs">
          <input
            type={dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text'}
            value={values[0] || ''}
            onChange={(e) => updateCondition(condition.id, { 
              value: [e.target.value, values[1] || ''] 
            })}
            placeholder="From"
            className="filter-input"
          />
          <span className="between-separator">and</span>
          <input
            type={dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text'}
            value={values[1] || ''}
            onChange={(e) => updateCondition(condition.id, { 
              value: [values[0] || '', e.target.value] 
            })}
            placeholder="To"
            className="filter-input"
          />
        </div>
      );
    }

    // Array values for contains_all, contains_any
    if (['contains_all', 'contains_any'].includes(operator)) {
      return (
        <input
          type="text"
          value={Array.isArray(value) ? value.join(', ') : value}
          onChange={(e) => updateCondition(condition.id, { 
            value: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
          })}
          placeholder="Enter values separated by commas"
          className="filter-input"
        />
      );
    }

    // Regular single value input
    return (
      <input
        type={dataType === 'date' ? 'date' : dataType === 'number' ? 'number' : 'text'}
        value={Array.isArray(value) ? value[0] || '' : value}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        placeholder="Enter value"
        className="filter-input"
      />
    );
  };

  const hasActiveFilters = filters.conditions.some(c => c.field && c.value !== '' && c.value !== null);

  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`expand-button ${isExpanded ? 'expanded' : ''}`}
        >
          <span className="expand-icon">🔽</span>
          Advanced Filters
          {hasActiveFilters && <span className="active-indicator">●</span>}
        </button>
        
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-button">
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-controls">
            <div className="logic-selector">
              <label>Match:</label>
              <select
                value={filters.logic}
                onChange={(e) => updateLogic(e.target.value)}
                className="logic-select"
              >
                <option value="AND">All conditions (AND)</option>
                <option value="OR">Any condition (OR)</option>
              </select>
            </div>

            <div className="preset-controls">
              {presets.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const preset = presets.find(p => p.id === parseInt(e.target.value));
                      if (preset) loadPreset(preset);
                    }
                  }}
                  value=""
                  className="preset-select"
                >
                  <option value="">Load Preset...</option>
                  {presets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              )}
              
              <button onClick={saveAsPreset} className="save-preset-button">
                Save Preset
              </button>
            </div>
          </div>

          <div className="conditions-list">
            {filters.conditions.map((condition, index) => (
              <div key={condition.id} className="filter-condition">
                {index > 0 && (
                  <div className="logic-indicator">
                    {filters.logic}
                  </div>
                )}
                
                <div className="condition-row">
                  <select
                    value={condition.field}
                    onChange={(e) => {
                      const fieldType = getFieldDataType(e.target.value);
                      updateCondition(condition.id, {
                        field: e.target.value,
                        dataType: fieldType,
                        operator: operators[fieldType]?.[0]?.value || 'equals',
                        value: ''
                      });
                    }}
                    className="field-select"
                  >
                    <option value="">Select field...</option>
                    {availableFields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.label || field.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { 
                      operator: e.target.value,
                      value: '' 
                    })}
                    className="operator-select"
                    disabled={!condition.field}
                  >
                    {(operators[condition.dataType] || operators.string).map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <div className="value-container">
                    {renderValueInput(condition)}
                  </div>

                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="remove-condition-button"
                    disabled={filters.conditions.length === 1}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="filters-actions">
            <button onClick={addCondition} className="add-condition-button">
              + Add Condition
            </button>
          </div>

          {presets.length > 0 && (
            <div className="saved-presets">
              <h4>Saved Presets</h4>
              <div className="presets-list">
                {presets.map(preset => (
                  <div key={preset.id} className="preset-item">
                    <span className="preset-name">{preset.name}</span>
                    <div className="preset-actions">
                      <button
                        onClick={() => loadPreset(preset)}
                        className="load-preset-button"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="delete-preset-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;