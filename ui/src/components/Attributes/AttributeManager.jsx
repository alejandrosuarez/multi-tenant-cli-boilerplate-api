import React, { useState } from 'react';
import RequestDashboard from './RequestDashboard';
import SchemaEditor from './SchemaEditor';
import AttributeAnalytics from './AttributeAnalytics';
import './AttributeManager.css';

const AttributeManager = () => {
  const [activeTab, setActiveTab] = useState('requests');

  const tabs = [
    { id: 'requests', label: 'Attribute Requests', icon: '📋' },
    { id: 'schemas', label: 'Schema Editor', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestDashboard />;
      case 'schemas':
        return <SchemaEditor />;
      case 'analytics':
        return <AttributeAnalytics />;
      default:
        return <RequestDashboard />;
    }
  };

  return (
    <div className="attribute-manager">
      <div className="attribute-manager-header">
        <h1>Attribute Management</h1>
        <p>Manage attribute requests, schemas, and analyze patterns</p>
      </div>

      <div className="attribute-manager-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="attribute-manager-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AttributeManager;