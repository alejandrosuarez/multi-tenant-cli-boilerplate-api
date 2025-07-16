import React, { useState } from 'react';
import './CollapsibleSection.css';

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultExpanded = false,
  icon,
  badge,
  className = '',
  headerActions,
  ...props 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`collapsible-section ${className}`} {...props}>
      <div className="collapsible-header" onClick={toggleExpanded}>
        <div className="collapsible-header__left">
          {icon && <i className={`${icon} collapsible-header__icon`}></i>}
          <h3 className="collapsible-header__title">{title}</h3>
          {badge && <span className="collapsible-header__badge">{badge}</span>}
        </div>
        
        <div className="collapsible-header__right">
          {headerActions && (
            <div className="collapsible-header__actions" onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
          <i className={`fas fa-chevron-down collapsible-toggle ${isExpanded ? 'expanded' : ''}`}></i>
        </div>
      </div>
      
      <div className={`collapsible-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="collapsible-content__inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;