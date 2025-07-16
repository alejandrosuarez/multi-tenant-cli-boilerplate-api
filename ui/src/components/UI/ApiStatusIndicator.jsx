import React, { useState, useEffect } from 'react';
import './ApiStatusIndicator.css';

const ApiStatusIndicator = () => {
  const [status, setStatus] = useState('checking');
  const [apiUrl, setApiUrl] = useState('');
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    checkApiStatus();
    // Check API status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';
    setApiUrl(API_URL);
    
    try {
      // Use the health endpoint (proxy will handle routing)
      const healthUrl = `${API_URL}/health`;
        
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus('online');
        setLastCheck(new Date());
        console.log('✅ API Status: Online', data);
      } else {
        setStatus('error');
        setLastCheck(new Date());
        console.warn('⚠️ API Status: Error', response.status);
      }
    } catch (error) {
      setStatus('offline');
      setLastCheck(new Date());
      console.error('❌ API Status: Offline', error);
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'online':
        return {
          icon: 'fas fa-check-circle',
          text: 'API Online',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'offline':
        return {
          icon: 'fas fa-times-circle',
          text: 'API Offline',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'error':
        return {
          icon: 'fas fa-exclamation-triangle',
          text: 'API Error',
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)'
        };
      default:
        return {
          icon: 'fas fa-spinner fa-spin',
          text: 'Checking...',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className="api-status-indicator"
      style={{ 
        backgroundColor: statusInfo.bgColor,
        borderColor: statusInfo.color 
      }}
      title={`API: ${apiUrl}\nLast checked: ${lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}`}
    >
      <i 
        className={statusInfo.icon}
        style={{ color: statusInfo.color }}
      ></i>
      <span 
        className="api-status-text"
        style={{ color: statusInfo.color }}
      >
        {statusInfo.text}
      </span>
    </div>
  );
};

export default ApiStatusIndicator;