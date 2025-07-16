import React, { useState, useEffect } from 'react';
import './APIDocumentation.css';

const APIDocumentation = () => {
  const [selectedCategory, setSelectedCategory] = useState('entities');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const apiDocumentation = {
    entities: {
      title: 'Entity Management',
      description: 'Manage entities with full CRUD operations and advanced filtering',
      endpoints: [
        {
          id: 'get-entities',
          method: 'GET',
          path: '/api/entities',
          title: 'Get Entities',
          description: 'Retrieve a list of entities with optional filtering and pagination',
          parameters: [
            { name: 'page', type: 'integer', required: false, description: 'Page number for pagination' },
            { name: 'limit', type: 'integer', required: false, description: 'Number of items per page' },
            { name: 'entity_type', type: 'string', required: false, description: 'Filter by entity type' },
            { name: 'search', type: 'string', required: false, description: 'Search term for entity attributes' }
          ],
          responses: {
            200: {
              description: 'Successful response',
              example: {
                entities: [
                  {
                    id: 'ent_123',
                    entity_type: 'person',
                    attributes: { name: 'John Doe', age: 30 },
                    created_at: '2024-01-01T00:00:00Z'
                  }
                ],
                pagination: { page: 1, limit: 10, total: 1 }
              }
            }
          }
        },
        {
          id: 'create-entity',
          method: 'POST',
          path: '/api/entities',
          title: 'Create Entity',
          description: 'Create a new entity with specified attributes',
          requestBody: {
            required: true,
            example: {
              entity_type: 'person',
              attributes: {
                name: 'Jane Doe',
                age: 25,
                email: 'jane@example.com'
              }
            }
          },
          responses: {
            201: {
              description: 'Entity created successfully',
              example: {
                id: 'ent_124',
                entity_type: 'person',
                attributes: { name: 'Jane Doe', age: 25, email: 'jane@example.com' },
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        },
        {
          id: 'update-entity',
          method: 'PUT',
          path: '/api/entities/:id',
          title: 'Update Entity',
          description: 'Update an existing entity\'s attributes',
          parameters: [
            { name: 'id', type: 'string', required: true, description: 'Entity ID' }
          ],
          requestBody: {
            required: true,
            example: {
              attributes: {
                name: 'Jane Smith',
                age: 26
              }
            }
          },
          responses: {
            200: {
              description: 'Entity updated successfully',
              example: {
                id: 'ent_124',
                entity_type: 'person',
                attributes: { name: 'Jane Smith', age: 26, email: 'jane@example.com' },
                updated_at: '2024-01-01T01:00:00Z'
              }
            }
          }
        }
      ]
    },
    attributes: {
      title: 'Attribute Management',
      description: 'Handle attribute requests and responses for entities',
      endpoints: [
        {
          id: 'request-attribute',
          method: 'POST',
          path: '/api/attributes/request',
          title: 'Request Attribute',
          description: 'Request a specific attribute for an entity',
          requestBody: {
            required: true,
            example: {
              entity_id: 'ent_123',
              attribute_name: 'phone_number',
              message: 'Please provide your phone number for contact purposes'
            }
          },
          responses: {
            201: {
              description: 'Attribute request created',
              example: {
                id: 'req_456',
                entity_id: 'ent_123',
                attribute_name: 'phone_number',
                status: 'pending',
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        },
        {
          id: 'respond-attribute',
          method: 'POST',
          path: '/api/attributes/respond',
          title: 'Respond to Attribute Request',
          description: 'Provide a response to an attribute request',
          requestBody: {
            required: true,
            example: {
              request_id: 'req_456',
              value: '+1-555-0123'
            }
          },
          responses: {
            200: {
              description: 'Attribute response recorded',
              example: {
                id: 'req_456',
                status: 'fulfilled',
                value: '+1-555-0123',
                fulfilled_at: '2024-01-01T01:00:00Z'
              }
            }
          }
        }
      ]
    },
    notifications: {
      title: 'Notification System',
      description: 'Send and manage push notifications',
      endpoints: [
        {
          id: 'send-notification',
          method: 'POST',
          path: '/api/notifications/send',
          title: 'Send Notification',
          description: 'Send a push notification to specific users or all users',
          requestBody: {
            required: true,
            example: {
              title: 'New Message',
              message: 'You have received a new message',
              data: { entity_id: 'ent_123' },
              user_ids: ['user_1', 'user_2']
            }
          },
          responses: {
            200: {
              description: 'Notification sent successfully',
              example: {
                id: 'notif_789',
                title: 'New Message',
                sent_count: 2,
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        }
      ]
    },
    analytics: {
      title: 'Analytics & Reporting',
      description: 'Access system analytics and generate reports',
      endpoints: [
        {
          id: 'get-analytics',
          method: 'GET',
          path: '/api/analytics',
          title: 'Get Analytics',
          description: 'Retrieve system analytics and metrics',
          parameters: [
            { name: 'start_date', type: 'string', required: false, description: 'Start date for analytics (ISO 8601)' },
            { name: 'end_date', type: 'string', required: false, description: 'End date for analytics (ISO 8601)' },
            { name: 'metric', type: 'string', required: false, description: 'Specific metric to retrieve' }
          ],
          responses: {
            200: {
              description: 'Analytics data',
              example: {
                entities: { total: 150, created_today: 5 },
                interactions: { total: 1200, today: 45 },
                notifications: { sent_today: 23, success_rate: 0.95 }
              }
            }
          }
        }
      ]
    }
  };

  const filteredEndpoints = () => {
    if (!searchTerm) return apiDocumentation;
    
    const filtered = {};
    Object.keys(apiDocumentation).forEach(category => {
      const categoryData = apiDocumentation[category];
      const matchingEndpoints = categoryData.endpoints.filter(endpoint =>
        endpoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingEndpoints.length > 0) {
        filtered[category] = {
          ...categoryData,
          endpoints: matchingEndpoints
        };
      }
    });
    
    return filtered;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const generateCurlCommand = (endpoint) => {
    let curl = `curl -X ${endpoint.method} "${window.location.origin}${endpoint.path}"`;
    curl += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    
    if (endpoint.requestBody) {
      curl += ` \\\n  -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'`;
    }
    
    return curl;
  };

  return (
    <div className="api-documentation">
      <div className="api-docs-header">
        <h2>API Documentation</h2>
        <p>Comprehensive API reference with interactive examples</p>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="api-docs-content">
        <div className="api-sidebar">
          <nav className="api-nav">
            {Object.keys(filteredEndpoints()).map(category => (
              <div key={category} className="nav-category">
                <button
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {apiDocumentation[category].title}
                </button>
                
                {selectedCategory === category && (
                  <div className="endpoint-list">
                    {filteredEndpoints()[category].endpoints.map(endpoint => (
                      <button
                        key={endpoint.id}
                        className={`endpoint-btn ${selectedEndpoint?.id === endpoint.id ? 'active' : ''}`}
                        onClick={() => setSelectedEndpoint(endpoint)}
                      >
                        <span className={`method method-${endpoint.method.toLowerCase()}`}>
                          {endpoint.method}
                        </span>
                        <span className="endpoint-title">{endpoint.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="api-main">
          {selectedEndpoint ? (
            <div className="endpoint-details">
              <div className="endpoint-header">
                <div className="endpoint-title-section">
                  <h3>{selectedEndpoint.title}</h3>
                  <div className="endpoint-method-path">
                    <span className={`method method-${selectedEndpoint.method.toLowerCase()}`}>
                      {selectedEndpoint.method}
                    </span>
                    <code className="endpoint-path">{selectedEndpoint.path}</code>
                  </div>
                </div>
                
                <button
                  className="copy-curl"
                  onClick={() => copyToClipboard(generateCurlCommand(selectedEndpoint))}
                  title="Copy cURL command"
                >
                  Copy cURL
                </button>
              </div>

              <p className="endpoint-description">{selectedEndpoint.description}</p>

              {selectedEndpoint.parameters && (
                <div className="parameters-section">
                  <h4>Parameters</h4>
                  <div className="parameters-table">
                    <div className="table-header">
                      <span>Name</span>
                      <span>Type</span>
                      <span>Required</span>
                      <span>Description</span>
                    </div>
                    {selectedEndpoint.parameters.map((param, index) => (
                      <div key={index} className="table-row">
                        <code className="param-name">{param.name}</code>
                        <span className="param-type">{param.type}</span>
                        <span className={`param-required ${param.required ? 'required' : 'optional'}`}>
                          {param.required ? 'Required' : 'Optional'}
                        </span>
                        <span className="param-description">{param.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEndpoint.requestBody && (
                <div className="request-section">
                  <h4>Request Body</h4>
                  <div className="code-block">
                    <div className="code-header">
                      <span>JSON</span>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.requestBody.example, null, 2))}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="code-content">
                      {JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="responses-section">
                <h4>Responses</h4>
                {Object.keys(selectedEndpoint.responses).map(statusCode => {
                  const response = selectedEndpoint.responses[statusCode];
                  return (
                    <div key={statusCode} className="response-item">
                      <div className="response-header">
                        <span className={`status-code status-${statusCode.charAt(0)}`}>
                          {statusCode}
                        </span>
                        <span className="response-description">{response.description}</span>
                      </div>
                      
                      {response.example && (
                        <div className="code-block">
                          <div className="code-header">
                            <span>Example Response</span>
                            <button
                              className="copy-btn"
                              onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="code-content">
                            {JSON.stringify(response.example, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="curl-section">
                <h4>cURL Example</h4>
                <div className="code-block">
                  <div className="code-header">
                    <span>Command</span>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(generateCurlCommand(selectedEndpoint))}
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="code-content curl-command">
                    {generateCurlCommand(selectedEndpoint)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="welcome-section">
              <h3>Welcome to the API Documentation</h3>
              <p>Select an endpoint from the sidebar to view detailed documentation, examples, and interactive testing capabilities.</p>
              
              <div className="quick-start">
                <h4>Quick Start</h4>
                <ol>
                  <li>Choose a category from the sidebar</li>
                  <li>Select an endpoint to view its documentation</li>
                  <li>Copy the cURL command or use the API Testing tool</li>
                  <li>Make sure to include your authentication token</li>
                </ol>
              </div>

              <div className="auth-info">
                <h4>Authentication</h4>
                <p>All API requests require authentication using a Bearer token:</p>
                <div className="code-block">
                  <pre className="code-content">
                    Authorization: Bearer YOUR_TOKEN_HERE
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;