import React from 'react';
import './TouchButton.css';

const TouchButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = '',
  icon,
  ...props 
}) => {
  const baseClass = 'touch-button';
  const variantClass = `touch-button--${variant}`;
  const sizeClass = `touch-button--${size}`;
  const disabledClass = disabled ? 'touch-button--disabled' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <i className={`${icon} touch-button__icon`}></i>}
      {children && <span className="touch-button__text">{children}</span>}
    </button>
  );
};

export default TouchButton;