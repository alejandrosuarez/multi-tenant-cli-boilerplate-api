import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import './TenantSwitcher.css';

const TenantSwitcher = ({ className = '' }) => {
  const { 
    getTenantSwitchingOptions, 
    switchTenant, 
    switchToSystemScope,
    getCurrentScopeIndicator,
    canSwitchTenants,
    currentTenant,
    scope
  } = useTenant();
  const { hasRole, ROLES } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const scopeIndicator = getCurrentScopeIndicator();
  const switchingOptions = getTenantSwitchingOptions();

  const handleTenantSwitch = async (optionId) => {
    setSwitching(true);
    setIsOpen(false);

    try {
      let result;
      if (optionId === 'system') {
        result = switchToSystemScope();
      } else {
        result = await switchTenant(optionId);
      }

      if (!result.success) {
        console.error('Failed to switch tenant:', result.error);
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setSwitching(false);
    }
  };

  if (!canSwitchTenants() && !hasRole(ROLES.SYSTEM_ADMIN)) {
    return null;
  }

  return (
    <div className={`tenant-switcher ${className}`}>
      <button
        className="tenant-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
      >
        <div className="current-tenant-info">
          <div className="tenant-icon" style={{ color: scopeIndicator.color }}>
            {scopeIndicator.icon}
          </div>
          <div className="tenant-details">
            <div className="tenant-name">
              {scope === 'system' ? 'System Admin' : currentTenant?.name || 'Select Tenant'}
            </div>
            <div className="tenant-role">{scopeIndicator.label}</div>
          </div>
        </div>
        <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          {switching ? (
            <div className="spinner-sm"></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.427 9.573L8 6l3.573 3.573a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708z"/>
            </svg>
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="tenant-switcher-overlay" onClick={() => setIsOpen(false)} />
          <div className="tenant-switcher-dropdown">
            <div className="dropdown-header">
              <h3>Switch Context</h3>
              <p>Select a tenant or system scope</p>
            </div>
            
            <div className="tenant-options">
              {switchingOptions.map((option) => (
                <button
                  key={option.id}
                  className={`tenant-option ${option.isCurrent ? 'current' : ''}`}
                  onClick={() => handleTenantSwitch(option.id)}
                  disabled={option.isCurrent}
                >
                  <div className="option-icon">
                    {option.id === 'system' ? '🔧' : '🏢'}
                  </div>
                  <div className="option-details">
                    <div className="option-name">{option.name}</div>
                    {option.description && (
                      <div className="option-description">{option.description}</div>
                    )}
                  </div>
                  {option.isCurrent && (
                    <div className="current-indicator">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {hasRole(ROLES.SYSTEM_ADMIN) && (
              <div className="dropdown-footer">
                <div className="admin-notice">
                  <span className="notice-icon">ℹ️</span>
                  <span>System admin privileges active</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TenantSwitcher;