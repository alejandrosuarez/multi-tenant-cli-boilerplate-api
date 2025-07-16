import React, { useState, useRef } from 'react';
import TouchButton from './TouchButton';
import './MobileFileUpload.css';

const MobileFileUpload = ({
  onFilesSelected,
  accept = "image/*",
  multiple = true,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  className = '',
  disabled = false
}) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesSelected && onFilesSelected(updatedFiles.map(f => f.file));
  };

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesSelected && onFilesSelected(updatedFiles.map(f => f.file));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`mobile-file-upload ${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <i className="fas fa-cloud-upload-alt upload-icon"></i>
          <h3 className="upload-title">Upload Files</h3>
          <p className="upload-subtitle">
            Drag and drop files here, or use the buttons below
          </p>
          
          <div className="upload-actions">
            <TouchButton
              onClick={openFileDialog}
              variant="primary"
              icon="fas fa-folder-open"
              disabled={disabled}
            >
              Browse Files
            </TouchButton>
            
            <TouchButton
              onClick={openCamera}
              variant="secondary"
              icon="fas fa-camera"
              disabled={disabled}
            >
              Take Photo
            </TouchButton>
          </div>
          
          <div className="upload-info">
            <small>
              Max {maxFiles} files, {formatFileSize(maxFileSize)} each
            </small>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list">
          <h4 className="file-list-title">
            Selected Files ({files.length})
          </h4>
          
          <div className="file-items">
            {files.map((fileItem) => (
              <div key={fileItem.id} className="file-item">
                <div className="file-preview">
                  {fileItem.preview ? (
                    <img 
                      src={fileItem.preview} 
                      alt={fileItem.name}
                      className="file-image"
                    />
                  ) : (
                    <div className="file-icon">
                      <i className="fas fa-file"></i>
                    </div>
                  )}
                </div>
                
                <div className="file-info">
                  <div className="file-name">{fileItem.name}</div>
                  <div className="file-size">{formatFileSize(fileItem.size)}</div>
                </div>
                
                <TouchButton
                  onClick={() => removeFile(fileItem.id)}
                  variant="danger"
                  size="small"
                  icon="fas fa-times"
                  className="file-remove"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-text">Uploading files...</div>
        </div>
      )}
    </div>
  );
};

export default MobileFileUpload;