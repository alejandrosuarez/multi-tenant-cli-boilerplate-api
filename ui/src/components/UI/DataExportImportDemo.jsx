import React, { useState, useCallback } from 'react';
import DataExport from './DataExport';
import DataImport from './DataImport';
import { dataExport } from '../../utils/dataExport';
import './DataExportImportDemo.css';

const DataExportImportDemo = () => {
  const [activeTab, setActiveTab] = useState('export');
  const [sampleData, setSampleData] = useState([
    {
      id: '1',
      entity_type: 'product',
      user_id: 'user123',
      tenant_id: 'tenant1',
      status: 'active',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z',
      attributes: {
        name: 'Sample Product',
        price: 29.99,
        category: 'Electronics',
        description: 'A sample product for demonstration'
      }
    },
    {
      id: '2',
      entity_type: 'service',
      user_id: 'user456',
      tenant_id: 'tenant1',
      status: 'active',
      created_at: '2024-01-16T09:15:00Z',
      updated_at: '2024-01-21T16:20:00Z',
      attributes: {
        name: 'Consulting Service',
        hourly_rate: 150,
        category: 'Professional Services',
        description: 'Expert consulting services'
      }
    },
    {
      id: '3',
      entity_type: 'product',
      user_id: 'user789',
      tenant_id: 'tenant2',
      status: 'inactive',
      created_at: '2024-01-17T11:00:00Z',
      updated_at: '2024-01-22T13:30:00Z',
      attributes: {
        name: 'Legacy Product',
        price: 19.99,
        category: 'Books',
        description: 'An older product that is no longer active'
      }
    }
  ]);
  const [importedData, setImportedData] = useState([]);
  const [messages, setMessages] = useState([]);

  const addMessage = useCallback((message, type = 'info') => {
    const newMessage = {
      id: Date.now(),
      text: message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [newMessage, ...prev.slice(0, 9)]); // Keep last 10 messages
  }, []);

  const handleExportStart = useCallback(() => {
    addMessage('Starting export...', 'info');
  }, [addMessage]);

  const handleExportComplete = useCallback((result) => {
    addMessage(`Export completed: ${result.recordCount} records exported as ${result.format.toUpperCase()}`, 'success');
  }, [addMessage]);

  const handleExportError = useCallback((error) => {
    addMessage(`Export failed: ${error}`, 'error');
  }, [addMessage]);

  const handleImportData = useCallback(async (data, options) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (options.validateOnly) {
      addMessage(`Validation completed: ${data.length} records validated`, 'success');
      return;
    }

    // Add imported data to our sample data
    const newData = data.map((item, index) => ({
      ...item,
      id: item.id || `imported_${Date.now()}_${index}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setImportedData(prev => [...prev, ...newData]);
    addMessage(`Imported ${data.length} records successfully`, 'success');
  }, [addMessage]);

  const handleImportSuccess = useCallback((result) => {
    addMessage(`Import completed: ${result.recordCount} records processed in ${result.batchCount} batches`, 'success');
  }, [addMessage]);

  const handleImportError = useCallback((error) => {
    addMessage(`Import failed: ${error}`, 'error');
  }, [addMessage]);

  const generateMoreSampleData = () => {
    const newData = [];
    for (let i = 0; i < 10; i++) {
      newData.push({
        id: `generated_${Date.now()}_${i}`,
        entity_type: ['product', 'service', 'event'][Math.floor(Math.random() * 3)],
        user_id: `user${Math.floor(Math.random() * 1000)}`,
        tenant_id: `tenant${Math.floor(Math.random() * 5) + 1}`,
        status: Math.random() > 0.2 ? 'active' : 'inactive',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        attributes: {
          name: `Generated Item ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          category: ['Category A', 'Category B', 'Category C'][Math.floor(Math.random() * 3)],
          description: `This is a generated item for testing purposes`
        }
      });
    }
    setSampleData(prev => [...prev, ...newData]);
    addMessage(`Generated ${newData.length} additional sample records`, 'info');
  };

  const clearImportedData = () => {
    setImportedData([]);
    addMessage('Cleared imported data', 'info');
  };

  const resetSampleData = () => {
    setSampleData([
      {
        id: '1',
        entity_type: 'product',
        user_id: 'user123',
        tenant_id: 'tenant1',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:45:00Z',
        attributes: {
          name: 'Sample Product',
          price: 29.99,
          category: 'Electronics',
          description: 'A sample product for demonstration'
        }
      }
    ]);
    addMessage('Reset to original sample data', 'info');
  };

  const allData = [...sampleData, ...importedData];

  return (
    <div className="data-export-import-demo">
      <div className="demo-header">
        <h2>Data Export & Import Demo</h2>
        <p>Test the data export and import functionality with sample data</p>
      </div>

      <div className="demo-tabs">
        <button 
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export Data
        </button>
        <button 
          className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Import Data
        </button>
        <button 
          className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          View Data ({allData.length})
        </button>
      </div>

      <div className="demo-content">
        {activeTab === 'export' && (
          <div className="export-section">
            <div className="section-header">
              <h3>Export Sample Data</h3>
              <div className="data-controls">
                <button onClick={generateMoreSampleData} className="control-button">
                  Generate More Data
                </button>
                <button onClick={resetSampleData} className="control-button secondary">
                  Reset Sample Data
                </button>
              </div>
            </div>
            
            <DataExport
              data={allData}
              filename="sample_entities"
              title="Sample Entity Data Export"
              onExportStart={handleExportStart}
              onExportComplete={handleExportComplete}
              onExportError={handleExportError}
              availableFormats={['csv', 'json', 'pdf']}
              excludeFields={['internal_id', 'temp_data']}
            />
          </div>
        )}

        {activeTab === 'import' && (
          <div className="import-section">
            <div className="section-header">
              <h3>Import Data</h3>
              <div className="data-controls">
                <button onClick={clearImportedData} className="control-button secondary">
                  Clear Imported Data ({importedData.length})
                </button>
              </div>
            </div>
            
            <DataImport
              onImportData={handleImportData}
              onImportSuccess={handleImportSuccess}
              onImportError={handleImportError}
              acceptedFormats={['csv', 'json']}
              validationSchema={dataExport.getValidationSchema('entity')}
              entityType="entity"
              maxFileSize={5 * 1024 * 1024} // 5MB
              previewRowCount={3}
            />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-section">
            <div className="section-header">
              <h3>Current Data</h3>
              <div className="data-stats">
                <span className="stat">Sample: {sampleData.length}</span>
                <span className="stat">Imported: {importedData.length}</span>
                <span className="stat">Total: {allData.length}</span>
              </div>
            </div>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>User ID</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Created</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {allData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td title={item.id}>{(item.id || '').substring(0, 15)}...</td>
                      <td>{item.entity_type}</td>
                      <td>{item.user_id}</td>
                      <td>
                        <span className={`status ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.attributes?.name || 'N/A'}</td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`source ${item.id?.startsWith('imported_') ? 'imported' : 'sample'}`}>
                          {item.id?.startsWith('imported_') ? 'Imported' : 
                           item.id?.startsWith('generated_') ? 'Generated' : 'Sample'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {allData.length === 0 && (
                <div className="no-data">
                  <p>No data available. Generate some sample data or import data to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="demo-messages">
        <h4>Activity Log</h4>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">No activity yet</p>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <span className="message-time">{message.timestamp}</span>
                <span className="message-text">{message.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExportImportDemo;