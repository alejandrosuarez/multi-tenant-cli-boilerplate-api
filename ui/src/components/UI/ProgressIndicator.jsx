import React from 'react';
import './ProgressIndicator.css';

const ProgressIndicator = ({ 
  progress = 0, 
  message = null,
  showPercentage = true,
  size = 'medium',
  color = 'primary',
  indeterminate = false,
  steps = null,
  currentStep = 0
}) => {
  const progressValue = Math.min(Math.max(progress, 0), 100);

  if (steps && steps.length > 0) {
    return (
      <div className={`progress-indicator progress-indicator-${size} progress-steps`}>
        {message && <div className="progress-indicator-message">{message}</div>}
        <div className="progress-steps-container">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`progress-step ${index <= currentStep ? 'progress-step-completed' : ''} ${index === currentStep ? 'progress-step-active' : ''}`}
            >
              <div className="progress-step-circle">
                {index < currentStep ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="progress-step-label">{step}</div>
              {index < steps.length - 1 && <div className="progress-step-connector" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`progress-indicator progress-indicator-${size}`}>
      {message && <div className="progress-indicator-message">{message}</div>}
      <div className="progress-indicator-container">
        <div className="progress-indicator-track">
          <div 
            className={`progress-indicator-fill progress-indicator-${color} ${indeterminate ? 'progress-indicator-indeterminate' : ''}`}
            style={!indeterminate ? { width: `${progressValue}%` } : {}}
          />
        </div>
        {showPercentage && !indeterminate && (
          <div className="progress-indicator-percentage">
            {Math.round(progressValue)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;