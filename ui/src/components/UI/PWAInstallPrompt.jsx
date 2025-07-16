import React, { useState, useEffect } from 'react';
import TouchButton from './TouchButton';
import pwaService from '../../services/pwa';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(pwaService.isInstalled());
    setIsOnline(!pwaService.isOffline());

    // Listen for install prompt availability
    const checkInstallPrompt = () => {
      setShowPrompt(pwaService.canInstall() && !pwaService.isInstalled());
    };

    // Listen for network status changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    pwaService.on('online', handleOnline);
    pwaService.on('offline', handleOffline);

    // Check install prompt periodically
    const interval = setInterval(checkInstallPrompt, 1000);
    checkInstallPrompt();

    return () => {
      clearInterval(interval);
      pwaService.off('online', handleOnline);
      pwaService.off('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    try {
      const result = await pwaService.showInstallPrompt();
      if (result && result.outcome === 'accepted') {
        setShowPrompt(false);
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Hide for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  if (isInstalled) {
    return (
      <div className="pwa-status installed">
        <div className="pwa-status-content">
          <i className="fas fa-check-circle pwa-status-icon"></i>
          <span className="pwa-status-text">App Installed</span>
          {!isOnline && (
            <div className="offline-indicator">
              <i className="fas fa-wifi-slash"></i>
              <span>Offline Mode</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-prompt-content">
        <div className="pwa-prompt-header">
          <div className="pwa-prompt-icon">
            <i className="fas fa-mobile-alt"></i>
          </div>
          <div className="pwa-prompt-text">
            <h4 className="pwa-prompt-title">Install App</h4>
            <p className="pwa-prompt-subtitle">
              Get the full experience with offline access and push notifications
            </p>
          </div>
        </div>
        
        <div className="pwa-prompt-features">
          <div className="pwa-feature">
            <i className="fas fa-wifi-slash"></i>
            <span>Works Offline</span>
          </div>
          <div className="pwa-feature">
            <i className="fas fa-bell"></i>
            <span>Push Notifications</span>
          </div>
          <div className="pwa-feature">
            <i className="fas fa-rocket"></i>
            <span>Faster Loading</span>
          </div>
        </div>
        
        <div className="pwa-prompt-actions">
          <TouchButton
            onClick={handleInstall}
            variant="primary"
            icon="fas fa-download"
          >
            Install
          </TouchButton>
          
          <TouchButton
            onClick={handleDismiss}
            variant="secondary"
            size="small"
          >
            Not Now
          </TouchButton>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;