import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  overlay = false,
  message = null,
  fullScreen = false 
}) => {
  const spinnerClass = `loading-spinner loading-spinner-${size} loading-spinner-${color}`;
  
  const spinner = (
    <div className={spinnerClass}>
      <div className="loading-spinner-circle">
        <svg viewBox="0 0 50 50">
          <circle
            className="loading-spinner-path"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
          />
        </svg>
      </div>
      {message && <div className="loading-spinner-message">{message}</div>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-spinner-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;