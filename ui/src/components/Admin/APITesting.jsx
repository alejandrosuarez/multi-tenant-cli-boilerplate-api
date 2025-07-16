import React, { useState, useEffect } from 'react';
import './APITesting.css';

const APITesting = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const endpoints = [
    { name: 'Get Entities', method: 'GET', path: '/api/entities' },
    { name: 'Create Entity', method: 'POST', path: '/api/entities' },
    { name: 'Update Entity', method: 'PUT', path: '/api/entities/:id' },
    { name: 'Delete Entity', method: 'DELETE', path: '/api/entities/:id' },
    { name: 'Get Attributes', method: 'GET', path: '/api/attributes' },
    { name: 'Request Attribute', method: 'POST', path: '/api/attributes/request' },
    { name: 'Send Notification', method: 'POST', path: '/api/notifications/send' },
    { name: 'Get Analytics', method: 'GET', path: '/api/analytics' },
    { name: 'Health Check', method: 'GET', path: '/api/health' }
  ];

  const handleEndpointSelect = (endpoint) => {
    setSelectedEndpoint(endpoint.name);
    setMethod(endpoint.method);
    setUrl(`${window.location.origin}${endpoint.path}`);
    
    // Set default body for POST/PUT requests
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      if (endpoint.path.includes('entities')) {
        setBody('{\n  "entity_type": "example",\n  "attributes": {\n    "name": "Test Entity"\n  }\n}');
      } else if (endpoint.path.includes('notifications')) {
        setBody('{\n  "title": "Test Notification",\n  "message": "This is a test notification"\n}');
      } else {
        setBody('{}');
      }
    } else {
      setBody('');
    }
  };

  const executeRequest = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const parsedHeaders = JSON.parse(headers);
      const token = localStorage.getItem('token');
      
      if (token) {
        parsedHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        method,
        headers: parsedHeaders,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = body;
      }

      const response = await fetch(url, config);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        responseTime,
        timestamp: new Date().toISOString()
      };

      setResponse(result);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        endpoint: selectedEndpoint || 'Custom',
        method,
        url,
        status: response.status,
        responseTime,
        timestamp: new Date().toISOString()
      };
      
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 requests
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      setResponse({
        error: true,
        message: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return obj;
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="api-testing">
      <div className="api-testing-header">
        <h2>API Testing Interface</h2>
        <p>Test API endpoints interactively with real-time response visualization</p>
      </div>

      <div className="api-testing-content">
        <div className="api-testing-left">
          <div className="endpoint-selector">
            <h3>Quick Endpoints</h3>
            <div className="endpoint-list">
              {endpoints.map((endpoint, index) => (
                <button
                  key={index}
                  className={`endpoint-item ${selectedEndpoint === endpoint.name ? 'active' : ''}`}
                  onClick={() => handleEndpointSelect(endpoint)}
                >
                  <span className={`method method-${endpoint.method.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                  <span className="endpoint-name">{endpoint.name}</span>
                  <span className="endpoint-path">{endpoint.path}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="request-builder">
            <h3>Request Builder</h3>
            
            <div className="form-group">
              <label>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="form-group">
              <label>URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter API endpoint URL"
              />
            </div>

            <div className="form-group">
              <label>Headers</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                rows={4}
                placeholder="Enter headers as JSON"
              />
            </div>

            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div className="form-group">
                <label>Request Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Enter request body as JSON"
                />
              </div>
            )}

            <button
              className="execute-btn"
              onClick={executeRequest}
              disabled={loading || !url}
            >
              {loading ? 'Executing...' : 'Execute Request'}
            </button>
          </div>
        </div>

        <div className="api-testing-right">
          <div className="response-section">
            <div className="response-header">
              <h3>Response</h3>
              {response && (
                <div className="response-meta">
                  <span className={`status status-${Math.floor(response.status / 100)}`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="response-time">
                    {response.responseTime}ms
                  </span>
                </div>
              )}
            </div>

            <div className="response-content">
              {loading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Executing request...</p>
                </div>
              )}

              {response && !loading && (
                <div className="response-data">
                  {response.error ? (
                    <div className="error-response">
                      <h4>Error</h4>
                      <pre>{response.message}</pre>
                    </div>
                  ) : (
                    <>
                      <div className="response-headers">
                        <h4>Headers</h4>
                        <pre>{formatJson(response.headers)}</pre>
                      </div>
                      <div className="response-body">
                        <h4>Body</h4>
                        <pre>{formatJson(response.data)}</pre>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!response && !loading && (
                <div className="empty-state">
                  <p>Select an endpoint and execute a request to see the response</p>
                </div>
              )}
            </div>
          </div>

          <div className="request-history">
            <div className="history-header">
              <h3>Request History</h3>
              {history.length > 0 && (
                <button className="clear-history" onClick={clearHistory}>
                  Clear
                </button>
              )}
            </div>
            
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-meta">
                    <span className={`method method-${entry.method.toLowerCase()}`}>
                      {entry.method}
                    </span>
                    <span className="endpoint">{entry.endpoint}</span>
                    <span className={`status status-${Math.floor(entry.status / 100)}`}>
                      {entry.status}
                    </span>
                  </div>
                  <div className="history-details">
                    <span className="response-time">{entry.responseTime}ms</span>
                    <span className="timestamp">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {history.length === 0 && (
                <div className="empty-history">
                  <p>No requests executed yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITesting;