import React, { useState, useEffect } from 'react';
import './FilterPanel.css';

const FilterPanel = ({
  filters = [],
  onFiltersChange,
  onReset,
  onSave,
  savedFilters = [],
  onLoadSavedFilter,
  onDeleteSavedFilter,
  className = '',
  collapsible = true,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeFilters, setActiveFilters] = useState({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  useEffect(() => {
    // Initialize active filters with default values
    const initialFilters = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        initialFilters[filter.key] = filter.defaultValue;
      }
    });
    setActiveFilters(initialFilters);
  }, [filters]);

  useEffect(() => {
    onFiltersChange?.(activeFilters);
  }, [activeFilters, onFiltersChange]);

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleReset = () => {
    setActiveFilters({});
    onReset?.();
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      onSave?.(saveFilterName.trim(), activeFilters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  const renderFilterInput = (filter) => {
    const value = activeFilters[filter.key] || '';

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="filter-input"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="filter-select"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="filter-multiselect">
            {filter.options?.map(option => (
              <label key={option.value} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter(v => v !== option.value);
                    handleFilterChange(filter.key, newValues);
                  }}
                />
                <span className="checkmark"></span>
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="filter-input"
          />
        );

      case 'daterange':
        return (
          <div className="filter-daterange">
            <input
              type="date"
              value={value?.start || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, start: e.target.value })}
              className="filter-input"
              placeholder="Start date"
            />
            <span className="daterange-separator">to</span>
            <input
              type="date"
              value={value?.end || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, end: e.target.value })}
              className="filter-input"
              placeholder="End date"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            min={filter.min}
            max={filter.max}
            step={filter.step}
            className="filter-input"
          />
        );

      case 'range':
        return (
          <div className="filter-range">
            <input
              type="number"
              value={value?.min || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, min: e.target.value })}
              placeholder="Min"
              className="filter-input range-input"
            />
            <span className="range-separator">-</span>
            <input
              type="number"
              value={value?.max || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, max: e.target.value })}
              placeholder="Max"
              className="filter-input range-input"
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="filter-boolean">
            <label className="filter-radio">
              <input
                type="radio"
                name={filter.key}
                value=""
                checked={value === ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
              <span className="radio-mark"></span>
              All
            </label>
            <label className="filter-radio">
              <input
                type="radio"
                name={filter.key}
                value="true"
                checked={value === 'true'}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
              <span className="radio-mark"></span>
              Yes
            </label>
            <label className="filter-radio">
              <input
                type="radio"
                name={filter.key}
                value="false"
                checked={value === 'false'}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
              <span className="radio-mark"></span>
              No
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
      }
      return value !== '' && value !== null && value !== undefined;
    }).length;
  };

  return (
    <div className={`filter-panel ${className}`}>
      {collapsible && (
        <div className="filter-panel-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="filter-panel-title">
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="active-filter-count">{getActiveFilterCount()}</span>
            )}
          </div>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </div>
      )}

      {(!collapsible || isExpanded) && (
        <div className="filter-panel-content">
          <div className="filter-grid">
            {filters.map(filter => (
              <div key={filter.key} className="filter-group">
                <label className="filter-label">{filter.label}</label>
                {renderFilterInput(filter)}
                {filter.description && (
                  <small className="filter-description">{filter.description}</small>
                )}
              </div>
            ))}
          </div>

          <div className="filter-actions">
            <button
              type="button"
              onClick={handleReset}
              className="filter-btn reset-btn"
              disabled={getActiveFilterCount() === 0}
            >
              Reset
            </button>
            
            {onSave && (
              <button
                type="button"
                onClick={() => setShowSaveDialog(true)}
                className="filter-btn save-btn"
                disabled={getActiveFilterCount() === 0}
              >
                Save Filter
              </button>
            )}
          </div>

          {savedFilters.length > 0 && (
            <div className="saved-filters">
              <h4 className="saved-filters-title">Saved Filters</h4>
              <div className="saved-filters-list">
                {savedFilters.map(savedFilter => (
                  <div key={savedFilter.id} className="saved-filter-item">
                    <button
                      type="button"
                      onClick={() => onLoadSavedFilter?.(savedFilter)}
                      className="saved-filter-btn"
                    >
                      {savedFilter.name}
                    </button>
                    {onDeleteSavedFilter && (
                      <button
                        type="button"
                        onClick={() => onDeleteSavedFilter?.(savedFilter.id)}
                        className="delete-saved-filter-btn"
                        title="Delete saved filter"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showSaveDialog && (
        <div className="save-filter-dialog">
          <div className="save-filter-content">
            <h3>Save Filter</h3>
            <input
              type="text"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              placeholder="Enter filter name"
              className="save-filter-input"
              autoFocus
            />
            <div className="save-filter-actions">
              <button
                type="button"
                onClick={() => setShowSaveDialog(false)}
                className="filter-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFilter}
                className="filter-btn save-btn"
                disabled={!saveFilterName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;