import React, { useState, useRef, useCallback } from 'react';
import './BulkUpload.css';

const BulkUpload = ({ entities, onUpload, onUploadComplete }) => {
  const [selectedEntity, setSelectedEntity] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [label, setLabel] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
      setFiles(prev => [...prev, ...imageFiles]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      setFiles(prev => [...prev, ...imageFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setUploadProgress({});
    setUploadResults([]);
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadFiles = async () => {
    if (!selectedEntity || files.length === 0) return;

    setUploading(true);
    setUploadResults([]);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `file-${i}`;
      
      try {
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { status: 'uploading', progress: 0 }
        }));

        // Simulate progress updates (in real implementation, you'd get this from the upload)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { 
              status: 'uploading', 
              progress: Math.min((prev[fileId]?.progress || 0) + Math.random() * 30, 90)
            }
          }));
        }, 200);

        await onUpload([file], selectedEntity, label);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { status: 'completed', progress: 100 }
        }));

        results.push({
          file: file.name,
          status: 'success',
          message: 'Upload completed successfully'
        });

      } catch (error) {
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { status: 'error', progress: 0 }
        }));

        results.push({
          file: file.name,
          status: 'error',
          message: error.message || 'Upload failed'
        });
      }
    }

    setUploadResults(results);
    setUploading(false);
    
    // Call completion callback
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'uploading': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const selectedEntityData = entities.find(e => e.id === selectedEntity);

  return (
    <div className="bulk-upload">
      <div className="upload-header">
        <h2>Bulk Upload</h2>
        <p>Upload multiple images at once to your entities</p>
      </div>

      <div className="upload-config">
        <div className="config-row">
          <label htmlFor="entity-select">Target Entity:</label>
          <select
            id="entity-select"
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="entity-select"
            disabled={uploading}
          >
            <option value="">Select an entity...</option>
            {entities.map(entity => (
              <option key={entity.id} value={entity.id}>
                {entity.attributes?.title || entity.attributes?.name || `${entity.entity_type} #${entity.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="config-row">
          <label htmlFor="label-input">Label (optional):</label>
          <input
            id="label-input"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add a label for these images..."
            className="label-input"
            disabled={uploading}
          />
        </div>
      </div>

      <div 
        className={`drop-zone ${dragActive ? 'active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        <div className="drop-zone-content">
          <div className="drop-icon">📁</div>
          <h3>Drop images here or click to browse</h3>
          <p>Supports JPG, PNG, GIF, WebP formats</p>
          {files.length > 0 && (
            <div className="file-summary">
              <strong>{files.length} files selected</strong>
              <span>Total size: {formatFileSize(totalSize)}</span>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <h3>Selected Files ({files.length})</h3>
            <div className="file-list-actions">
              <button
                onClick={clearAll}
                className="clear-btn"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={uploadFiles}
                className="upload-btn"
                disabled={!selectedEntity || uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
              </button>
            </div>
          </div>

          <div className="files-container">
            {files.map((file, index) => {
              const fileId = `file-${index}`;
              const progress = uploadProgress[fileId];
              
              return (
                <div key={index} className="file-item">
                  <div className="file-preview">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="file-thumbnail"
                    />
                  </div>
                  
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-details">
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <span className="file-type">{file.type}</span>
                    </div>
                    
                    {progress && (
                      <div className="progress-container">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${progress.progress}%`,
                            backgroundColor: getProgressColor(progress.status)
                          }}
                        />
                        <div className="progress-text">
                          {progress.status === 'uploading' && `${Math.round(progress.progress)}%`}
                          {progress.status === 'completed' && '✅ Complete'}
                          {progress.status === 'error' && '❌ Failed'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="file-actions">
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="remove-btn"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {uploadResults.length > 0 && (
        <div className="upload-results">
          <h3>Upload Results</h3>
          <div className="results-summary">
            <span className="success-count">
              ✅ {uploadResults.filter(r => r.status === 'success').length} successful
            </span>
            <span className="error-count">
              ❌ {uploadResults.filter(r => r.status === 'error').length} failed
            </span>
          </div>
          
          <div className="results-list">
            {uploadResults.map((result, index) => (
              <div 
                key={index} 
                className={`result-item ${result.status}`}
              >
                <div className="result-icon">
                  {result.status === 'success' ? '✅' : '❌'}
                </div>
                <div className="result-info">
                  <div className="result-file">{result.file}</div>
                  <div className="result-message">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEntityData && (
        <div className="entity-info">
          <h4>Target Entity Details</h4>
          <div className="entity-details">
            <div className="detail-row">
              <strong>Type:</strong> {selectedEntityData.entity_type}
            </div>
            <div className="detail-row">
              <strong>Title:</strong> {selectedEntityData.attributes?.title || selectedEntityData.attributes?.name || 'Untitled'}
            </div>
            <div className="detail-row">
              <strong>Created:</strong> {new Date(selectedEntityData.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;