import React, { useState } from 'react';
import api from '../../services/api';
import { bulkOperations } from '../../utils/bulkOperations';
import './BulkOperations.css';

const BulkOperations = ({ selectedEntities, entities, onClose, onComplete }) => {
  const [operation, setOperation] = useState('');
  const [operationData, setOperationData] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const operations = [
    { id: 'delete', label: 'Delete Entities', icon: '🗑️', destructive: true },
    { id: 'update_status', label: 'Update Status', icon: '🔄' },
    { id: 'update_type', label: 'Change Entity Type', icon: '🏷️' },
    { id: 'add_attributes', label: 'Add Attributes', icon: '➕' },
    { id: 'remove_attributes', label: 'Remove Attributes', icon: '➖' },
    { id: 'export', label: 'Export Data', icon: '📤' },
    { id: 'duplicate', label: 'Duplicate Entities', icon: '📋' }
  ];

  const handleOperationChange = (operationId) => {
    setOperation(operationId);
    setOperationData({});
    setResults(null);
    setError(null);
  };

  const handleExecute = async () => {
    if (!operation) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      let result;
      
      switch (operation) {
        case 'delete':
          result = await bulkOperations.deleteEntities(
            selectedEntities,
            (progress) => setProgress(progress)
          );
          break;
          
        case 'update_status':
          result = await bulkOperations.updateStatus(
            selectedEntities,
            operationData.status,
            (progress) => setProgress(progress)
          );
          break;
          
        case 'update_type':
          result = await bulkOperations.updateEntityType(
            selectedEntities,
            operationData.entityType,
            (progress) => setProgress(progress)
          );
          break;
          
        case 'add_attributes':
          result = await bulkOperations.addAttributes(
            selectedEntities,
            operationData.attributes,
            (progress) => setProgress(progress)
          );
          break;
          
        case 'remove_attributes':
          result = await bulkOperations.removeAttributes(
            selectedEntities,
            operationData.attributeKeys,
            (progress) => setProgress(progress)
          );
          break;
          
        case 'export':
          result = await bulkOperations.exportEntities(
            selectedEntities,
            entities,
            operationData.format || 'json'
          );
          break;
          
        case 'duplicate':
          result = await bulkOperations.duplicateEntities(
            selectedEntities,
            entities,
            (progress) => setProgress(progress)
          );
          break;
          
        default:
          throw new Error('Unknown operation');
      }

      setResults(result);
      
      // If operation was successful and not export, trigger refresh
      if (operation !== 'export' && result.success) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
      
    } catch (err) {
      setError(err.message || 'Operation failed');
      console.error('Bulk operation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOperationForm = () => {
    switch (operation) {
      case 'update_status':
        return (
          <div className="operation-form">
            <label>New Status:</label>
            <select 
              value={operationData.status || ''}
              onChange={(e) => setOperationData({ ...operationData, status: e.target.value })}
            >
              <option value="">Select status...</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        );
        
      case 'update_type':
        const entityTypes = [...new Set(entities.map(e => e.entity_type))];
        return (
          <div className="operation-form">
            <label>New Entity Type:</label>
            <select 
              value={operationData.entityType || ''}
              onChange={(e) => setOperationData({ ...operationData, entityType: e.target.value })}
            >
              <option value="">Select type...</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input 
              type="text"
              placeholder="Or enter new type..."
              value={operationData.customType || ''}
              onChange={(e) => setOperationData({ 
                ...operationData, 
                entityType: e.target.value,
                customType: e.target.value 
              })}
            />
          </div>
        );
        
      case 'add_attributes':
        return (
          <div className="operation-form">
            <label>Attributes to Add (JSON format):</label>
            <textarea
              placeholder='{"key": "value", "another_key": "another_value"}'
              value={operationData.attributesJson || ''}
              onChange={(e) => {
                try {
                  const attributes = JSON.parse(e.target.value || '{}');
                  setOperationData({ 
                    ...operationData, 
                    attributes,
                    attributesJson: e.target.value 
                  });
                } catch {
                  setOperationData({ 
                    ...operationData, 
                    attributesJson: e.target.value 
                  });
                }
              }}
            />
          </div>
        );
        
      case 'remove_attributes':
        return (
          <div className="operation-form">
            <label>Attribute Keys to Remove (comma-separated):</label>
            <input 
              type="text"
              placeholder="key1, key2, key3"
              value={operationData.attributeKeysStr || ''}
              onChange={(e) => setOperationData({ 
                ...operationData, 
                attributeKeys: e.target.value.split(',').map(k => k.trim()).filter(k => k),
                attributeKeysStr: e.target.value 
              })}
            />
          </div>
        );
        
      case 'export':
        return (
          <div className="operation-form">
            <label>Export Format:</label>
            <select 
              value={operationData.format || 'json'}
              onChange={(e) => setOperationData({ ...operationData, format: e.target.value })}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>
        );
        
      case 'delete':
        return (
          <div className="operation-form warning">
            <p>⚠️ This action cannot be undone. {selectedEntities.length} entities will be permanently deleted.</p>
          </div>
        );
        
      case 'duplicate':
        return (
          <div className="operation-form">
            <label>Duplicate Options:</label>
            <div className="checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  checked={operationData.includeImages || false}
                  onChange={(e) => setOperationData({ 
                    ...operationData, 
                    includeImages: e.target.checked 
                  })}
                />
                Include images
              </label>
              <label>
                <input 
                  type="checkbox"
                  checked={operationData.appendSuffix || true}
                  onChange={(e) => setOperationData({ 
                    ...operationData, 
                    appendSuffix: e.target.checked 
                  })}
                />
                Append "Copy" to names
              </label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const canExecute = () => {
    if (!operation) return false;
    
    switch (operation) {
      case 'update_status':
        return operationData.status;
      case 'update_type':
        return operationData.entityType;
      case 'add_attributes':
        return operationData.attributes && Object.keys(operationData.attributes).length > 0;
      case 'remove_attributes':
        return operationData.attributeKeys && operationData.attributeKeys.length > 0;
      case 'delete':
      case 'export':
      case 'duplicate':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="bulk-operations-modal">
      <div className="bulk-operations-content">
        <div className="bulk-operations-header">
          <h3>Bulk Operations</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="bulk-operations-body">
          <div className="selection-info">
            <p>{selectedEntities.length} entities selected</p>
          </div>

          <div className="operation-selector">
            <h4>Select Operation:</h4>
            <div className="operations-grid">
              {operations.map(op => (
                <button
                  key={op.id}
                  className={`operation-btn ${operation === op.id ? 'selected' : ''} ${op.destructive ? 'destructive' : ''}`}
                  onClick={() => handleOperationChange(op.id)}
                >
                  <span className="operation-icon">{op.icon}</span>
                  <span className="operation-label">{op.label}</span>
                </button>
              ))}
            </div>
          </div>

          {operation && (
            <div className="operation-config">
              <h4>Configure Operation:</h4>
              {renderOperationForm()}
            </div>
          )}

          {loading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p>Processing... {Math.round(progress)}%</p>
            </div>
          )}

          {results && (
            <div className="results-section">
              <h4>Results:</h4>
              <div className={`results-summary ${results.success ? 'success' : 'error'}`}>
                {results.success ? (
                  <div>
                    <p>✅ Operation completed successfully!</p>
                    <p>Processed: {results.processed || selectedEntities.length}</p>
                    {results.failed && <p>Failed: {results.failed}</p>}
                    {results.downloadUrl && (
                      <a href={results.downloadUrl} download className="download-link">
                        📥 Download Export
                      </a>
                    )}
                  </div>
                ) : (
                  <div>
                    <p>❌ Operation failed</p>
                    <p>{results.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="error-section">
              <p>❌ {error}</p>
            </div>
          )}
        </div>

        <div className="bulk-operations-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`btn-primary ${operation && operations.find(op => op.id === operation)?.destructive ? 'destructive' : ''}`}
            onClick={handleExecute}
            disabled={!canExecute() || loading}
          >
            {loading ? 'Processing...' : 'Execute Operation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;