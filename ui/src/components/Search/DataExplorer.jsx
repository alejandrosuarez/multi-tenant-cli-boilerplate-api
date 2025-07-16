import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../services/api';
import Charts from '../UI/Charts';
import './DataExplorer.css';

const DataExplorer = ({ searchResults = [], onEntitySelect }) => {
  const [explorationData, setExplorationData] = useState(null);
  const [selectedVisualization, setSelectedVisualization] = useState('overview');
  const [relationshipMap, setRelationshipMap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityDetails, setEntityDetails] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [insights, setInsights] = useState([]);
  
  const { currentTenant } = useTenant();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (searchResults.length > 0) {
      analyzeSearchResults();
    }
  }, [searchResults]);

  useEffect(() => {
    if (selectedEntity) {
      loadEntityDetails();
    }
  }, [selectedEntity]);

  const analyzeSearchResults = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/search/analyze', {
        results: searchResults.map(r => ({ id: r.id, type: r.type })),
        tenant_id: currentTenant?.id
      });
      
      setExplorationData(response.data.analysis);
      setRelationshipMap(response.data.relationships);
      setPatterns(response.data.patterns || []);
      setInsights(response.data.insights || []);
    } catch (error) {
      console.error('Failed to analyze search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntityDetails = async () => {
    if (!selectedEntity) return;
    
    try {
      const response = await api.get(`/entities/${selectedEntity.id}/details`, {
        params: { tenant_id: currentTenant?.id }
      });
      setEntityDetails(response.data.entity);
    } catch (error) {
      console.error('Failed to load entity details:', error);
    }
  };

  const renderRelationshipMap = () => {
    if (!relationshipMap || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const { nodes, edges } = relationshipMap;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.3;
    
    // Position nodes in a circle
    const nodePositions = {};
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      nodePositions[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        ...node
      };
    });
    
    // Draw edges
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const source = nodePositions[edge.source];
      const target = nodePositions[edge.target];
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        
        // Draw edge label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(edge.type || 'related', midX, midY);
      }
    });
    
    // Draw nodes
    Object.values(nodePositions).forEach(node => {
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node.type);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Node label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.name || node.id, node.x, node.y + 35);
    });
  };

  const getNodeColor = (type) => {
    const colors = {
      entity: '#007bff',
      user: '#28a745',
      tenant: '#ffc107',
      attribute: '#17a2b8',
      interaction: '#fd7e14',
      notification: '#6f42c1'
    };
    return colors[type] || '#6c757d';
  };

  const handleCanvasClick = (event) => {
    if (!relationshipMap) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is on a node
    const { nodes } = relationshipMap;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.3;
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const nodeX = centerX + Math.cos(angle) * radius;
      const nodeY = centerY + Math.sin(angle) * radius;
      
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= 20) {
        setSelectedEntity(node);
        if (onEntitySelect) {
          onEntitySelect(node);
        }
      }
    });
  };

  useEffect(() => {
    if (selectedVisualization === 'relationships') {
      setTimeout(renderRelationshipMap, 100);
    }
  }, [selectedVisualization, relationshipMap]);

  const getVisualizationData = () => {
    if (!explorationData) return null;

    switch (selectedVisualization) {
      case 'overview':
        return {
          type: 'mixed',
          data: [
            {
              type: 'doughnut',
              title: 'Entity Types',
              data: {
                labels: Object.keys(explorationData.entityTypes || {}),
                datasets: [{
                  data: Object.values(explorationData.entityTypes || {}),
                  backgroundColor: ['#007bff', '#28a745', '#ffc107', '#17a2b8', '#fd7e14']
                }]
              }
            },
            {
              type: 'bar',
              title: 'Activity Timeline',
              data: {
                labels: explorationData.timeline?.labels || [],
                datasets: [{
                  label: 'Entities Created',
                  data: explorationData.timeline?.data || [],
                  backgroundColor: '#007bff'
                }]
              }
            }
          ]
        };
      
      case 'attributes':
        return {
          type: 'bar',
          title: 'Most Common Attributes',
          data: {
            labels: explorationData.commonAttributes?.map(a => a.name) || [],
            datasets: [{
              label: 'Frequency',
              data: explorationData.commonAttributes?.map(a => a.count) || [],
              backgroundColor: '#17a2b8'
            }]
          }
        };
      
      case 'interactions':
        return {
          type: 'line',
          title: 'Interaction Patterns',
          data: {
            labels: explorationData.interactionTimeline?.labels || [],
            datasets: [{
              label: 'Interactions',
              data: explorationData.interactionTimeline?.data || [],
              borderColor: '#fd7e14',
              backgroundColor: 'rgba(253, 126, 20, 0.1)'
            }]
          }
        };
      
      default:
        return null;
    }
  };

  if (searchResults.length === 0) {
    return (
      <div className="data-explorer empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Data Explorer</h3>
          <p>Perform a search to explore data patterns and relationships.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-explorer">
      <div className="explorer-header">
        <h3>Data Explorer</h3>
        <div className="visualization-tabs">
          <button
            className={selectedVisualization === 'overview' ? 'active' : ''}
            onClick={() => setSelectedVisualization('overview')}
          >
            Overview
          </button>
          <button
            className={selectedVisualization === 'relationships' ? 'active' : ''}
            onClick={() => setSelectedVisualization('relationships')}
          >
            Relationships
          </button>
          <button
            className={selectedVisualization === 'attributes' ? 'active' : ''}
            onClick={() => setSelectedVisualization('attributes')}
          >
            Attributes
          </button>
          <button
            className={selectedVisualization === 'interactions' ? 'active' : ''}
            onClick={() => setSelectedVisualization('interactions')}
          >
            Interactions
          </button>
        </div>
      </div>

      <div className="explorer-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Analyzing data patterns...</p>
          </div>
        ) : (
          <>
            <div className="main-visualization">
              {selectedVisualization === 'relationships' ? (
                <div className="relationship-map">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="relationship-canvas"
                  />
                  {selectedEntity && (
                    <div className="entity-tooltip">
                      <h4>{selectedEntity.name || selectedEntity.id}</h4>
                      <p>Type: {selectedEntity.type}</p>
                      <p>Connections: {selectedEntity.connections || 0}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="chart-container">
                  <Charts data={getVisualizationData()} />
                </div>
              )}
            </div>

            <div className="explorer-sidebar">
              {patterns.length > 0 && (
                <div className="patterns-section">
                  <h4>Discovered Patterns</h4>
                  <div className="patterns-list">
                    {patterns.map((pattern, index) => (
                      <div key={index} className="pattern-item">
                        <div className="pattern-icon">🔍</div>
                        <div className="pattern-content">
                          <h5>{pattern.title}</h5>
                          <p>{pattern.description}</p>
                          <div className="pattern-stats">
                            <span>Confidence: {Math.round(pattern.confidence * 100)}%</span>
                            <span>Occurrences: {pattern.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.length > 0 && (
                <div className="insights-section">
                  <h4>Key Insights</h4>
                  <div className="insights-list">
                    {insights.map((insight, index) => (
                      <div key={index} className="insight-item">
                        <div className="insight-icon">💡</div>
                        <div className="insight-content">
                          <h5>{insight.title}</h5>
                          <p>{insight.description}</p>
                          {insight.recommendation && (
                            <div className="insight-recommendation">
                              <strong>Recommendation:</strong> {insight.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explorationData && (
                <div className="stats-section">
                  <h4>Quick Stats</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{searchResults.length}</div>
                      <div className="stat-label">Total Results</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {Object.keys(explorationData.entityTypes || {}).length}
                      </div>
                      <div className="stat-label">Entity Types</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {explorationData.totalConnections || 0}
                      </div>
                      <div className="stat-label">Connections</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {explorationData.avgAttributes || 0}
                      </div>
                      <div className="stat-label">Avg Attributes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedEntity && entityDetails && (
        <div className="entity-details-modal">
          <div className="modal-overlay" onClick={() => setSelectedEntity(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>{entityDetails.name || entityDetails.id}</h3>
              <button
                onClick={() => setSelectedEntity(null)}
                className="close-button"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="entity-info">
                <div className="info-row">
                  <span className="label">Type:</span>
                  <span className="value">{entityDetails.entity_type}</span>
                </div>
                <div className="info-row">
                  <span className="label">Created:</span>
                  <span className="value">
                    {new Date(entityDetails.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Attributes:</span>
                  <span className="value">
                    {Object.keys(entityDetails.attributes || {}).length}
                  </span>
                </div>
              </div>
              
              {entityDetails.attributes && (
                <div className="attributes-preview">
                  <h4>Attributes</h4>
                  <div className="attributes-list">
                    {Object.entries(entityDetails.attributes).slice(0, 5).map(([key, value]) => (
                      <div key={key} className="attribute-item">
                        <span className="attr-key">{key}:</span>
                        <span className="attr-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExplorer;