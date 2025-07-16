import React, { useState, useCallback, useRef } from 'react';
import { validateCSVData, validateJSONData, generateImportTemplate } from '../../utils/dataTransform';
import './DataImport.css';

const DataImport = ({
  onImportData,
  onImportError,
  onImportSuccess,
  acceptedFormats = ['csv', 'json'],
  validationSchema = {},
  entityType = 'entity',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  previewRowCount = 5
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [importOptions, setImportOptions] = useState({
    skipFirstRow: true,
    updateExisting: false,
    validateOnly: false,
    batchSize: 100
  });

  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      onImportError?.(`File size exceeds maximum limit of ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      onImportError?.(`Unsupported file format. Accepted formats: ${acceptedFormats.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const content = await readFileContent(file);
      setFileContent(content);
      
      // Validate content
      const validation = await validateFileContent(content, fileExtension);
      setValidationResult(validation);
      
      if (validation.isValid) {
        setShowPreview(true);
      }
    } catch (error) {
      onImportError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [maxFileSize, acceptedFormats, onImportError]);

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const validateFileContent = async (content, format) => {
    switch (format) {
      case 'csv':
        return validateCSVData(content, validationSchema);
      case 'json':
        return validateJSONData(content, validationSchema);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  const handleTextImport = useCallback(async () => {
    const content = textAreaRef.current?.value;
    if (!content) {
      onImportError?.('Please enter data to import');
      return;
    }

    setIsProcessing(true);
    try {
      // Try to detect format
      let format = 'json';
      try {
        JSON.parse(content);
      } catch {
        format = 'csv';
      }

      const validation = await validateFileContent(content, format);
      setValidationResult(validation);
      setFileContent(content);
      
      if (validation.isValid) {
        setShowPreview(true);
      }
    } catch (error) {
      onImportError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [onImportError]);

  const handleImport = useCallback(async () => {
    if (!validationResult || !validationResult.isValid) {
      onImportError?.('Please fix validation errors before importing');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const { data } = validationResult;
      const batchSize = importOptions.batchSize;
      const totalBatches = Math.ceil(data.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, data.length);
        const batch = data.slice(start, end);

        await onImportData?.(batch, {
          ...importOptions,
          batchIndex: i,
          totalBatches,
          isLastBatch: i === totalBatches - 1
        });

        setImportProgress(((i + 1) / totalBatches) * 100);
      }

      onImportSuccess?.({
        recordCount: data.length,
        batchCount: totalBatches,
        validationResult
      });

      // Reset form
      resetForm();

    } catch (error) {
      onImportError?.(error.message);
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
    }
  }, [validationResult, importOptions, onImportData, onImportSuccess, onImportError]);

  const resetForm = () => {
    setSelectedFile(null);
    setFileContent('');
    setValidationResult(null);
    setShowPreview(false);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textAreaRef.current) {
      textAreaRef.current.value = '';
    }
  };

  const downloadTemplate = (format) => {
    const templates = generateImportTemplate(entityType, validationSchema);
    const template = templates[format];
    
    if (!template) {
      onImportError?.(`Template not available for format: ${format}`);
      return;
    }

    const blob = new Blob([template], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_import_template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderValidationResults = () => {
    if (!validationResult) return null;

    return (
      <div className="validation-results">
        <div className={`validation-status ${validationResult.isValid ? 'valid' : 'invalid'}`}>
          <h4>
            {validationResult.isValid ? '✓ Validation Passed' : '✗ Validation Failed'}
          </h4>
          <p>{validationResult.recordCount} records found</p>
        </div>

        {validationResult.errors.length > 0 && (
          <div className="validation-errors">
            <h5>Errors ({validationResult.errors.length})</h5>
            <ul>
              {validationResult.errors.slice(0, 10).map((error, index) => (
                <li key={index} className="error-item">{error}</li>
              ))}
              {validationResult.errors.length > 10 && (
                <li className="more-errors">
                  ... and {validationResult.errors.length - 10} more errors
                </li>
              )}
            </ul>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="validation-warnings">
            <h5>Warnings ({validationResult.warnings.length})</h5>
            <ul>
              {validationResult.warnings.slice(0, 5).map((warning, index) => (
                <li key={index} className="warning-item">{warning}</li>
              ))}
              {validationResult.warnings.length > 5 && (
                <li className="more-warnings">
                  ... and {validationResult.warnings.length - 5} more warnings
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderDataPreview = () => {
    if (!showPreview || !validationResult?.data) return null;

    const previewData = validationResult.data.slice(0, previewRowCount);
    const headers = validationResult.headers || Object.keys(previewData[0] || {});

    return (
      <div className="data-preview">
        <h4>Data Preview ({previewRowCount} of {validationResult.recordCount} records)</h4>
        <div className="preview-table-container">
          <table className="preview-table">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, index) => (
                <tr key={index}>
                  {headers.map(header => (
                    <td key={header} title={String(row[header] || '')}>
                      {String(row[header] || '').substring(0, 50)}
                      {String(row[header] || '').length > 50 && '...'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="data-import">
      <div className="import-header">
        <h3>Import Data</h3>
        <p>Upload or paste data to import into the system</p>
      </div>

      <div className="import-templates">
        <h4>Download Templates</h4>
        <div className="template-buttons">
          {acceptedFormats.map(format => (
            <button
              key={format}
              className="template-button"
              onClick={() => downloadTemplate(format)}
            >
              Download {format.toUpperCase()} Template
            </button>
          ))}
        </div>
      </div>

      <div className="import-methods">
        <div className="file-upload-section">
          <h4>Upload File</h4>
          <div
            className={`file-drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.map(f => `.${f}`).join(',')}
              onChange={(e) => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
            
            {selectedFile ? (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">
                    {Math.round(selectedFile.size / 1024)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="drop-zone-content">
                <span className="upload-icon">📁</span>
                <p>Drop files here or click to browse</p>
                <p className="file-types">
                  Supported: {acceptedFormats.join(', ').toUpperCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-import-section">
          <h4>Paste Data</h4>
          <textarea
            ref={textAreaRef}
            className="text-import-area"
            placeholder="Paste your CSV or JSON data here..."
            rows={8}
          />
          <button
            className="text-import-button"
            onClick={handleTextImport}
            disabled={isProcessing}
          >
            Validate Pasted Data
          </button>
        </div>
      </div>

      {renderValidationResults()}
      {renderDataPreview()}

      {validationResult && (
        <div className="import-options">
          <h4>Import Options</h4>
          <div className="options-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={importOptions.skipFirstRow}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  skipFirstRow: e.target.checked
                }))}
              />
              Skip first row (headers)
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={importOptions.updateExisting}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  updateExisting: e.target.checked
                }))}
              />
              Update existing records
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={importOptions.validateOnly}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  validateOnly: e.target.checked
                }))}
              />
              Validate only (don't import)
            </label>

            <div className="batch-size-option">
              <label htmlFor="batch-size">Batch Size:</label>
              <input
                id="batch-size"
                type="number"
                min="1"
                max="1000"
                value={importOptions.batchSize}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  batchSize: parseInt(e.target.value) || 100
                }))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="import-actions">
        {validationResult && (
          <>
            <button
              className="import-button secondary"
              onClick={resetForm}
              disabled={isProcessing}
            >
              Reset
            </button>
            
            <button
              className="import-button primary"
              onClick={handleImport}
              disabled={!validationResult.isValid || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  {importOptions.validateOnly ? 'Validating...' : 'Importing...'}
                </>
              ) : (
                importOptions.validateOnly ? 'Validate Data' : 'Import Data'
              )}
            </button>
          </>
        )}
      </div>

      {isProcessing && importProgress > 0 && (
        <div className="import-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
          <p>Import progress: {Math.round(importProgress)}%</p>
        </div>
      )}
    </div>
  );
};

export default DataImport;